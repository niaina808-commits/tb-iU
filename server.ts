import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_TEAMS_8035,
  generateInstantLeagueFixtures,
  findTeamByName,
  mapBet261HistoryToForm
} from './src/utils/mockLeagueData';
import {
  Team,
  VirtualMatch,
  VirtualRoundSummary,
  VirtualMatchResult,
  FormResult,
  MatchOdds,
  SavedCombineTicket,
  VipPlanId,
  VipAccessCode,
  ActiveUserRecord,
  VipSubscriptionRequest
} from './src/types/league';
import {
  generateTopCombinesForRound,
  buildSavedCombineTicket,
  buildAutoEvaluatedCombinesFromResults,
  reconcileCombineTicketWithResults,
  ensurePositiveCombineBilan
} from './src/utils/combineGenerator';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Cached Bet261 API configuration
let cachedAppVersion = '35316';
let cachedApiEventsBaseUrl = 'https://hg-event-api-prod.sporty-tech.net/api/';
let lastConfigCheck = 0;

// Live state cache
let currentTeams: Team[] = [...INITIAL_TEAMS_8035];
let currentMatches: VirtualMatch[] = [];
let currentRounds: VirtualRoundSummary[] = [];
let currentResults: VirtualMatchResult[] = [];
let serverCombineHistory: SavedCombineTicket[] = [];
let currentSeasonId: number = 0;
const roundMatchesCache = new Map<number, VirtualMatch[]>();
let activeRoundNumber: number = 1;
let lastSyncTimestamp = new Date().toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
let lastSyncEpochMs = 0;
let lastSyncDurationMs = 0;
let isLiveConnected = false;

interface SyncStatePayload {
  isRealTimeSynced: boolean;
  teams: Team[];
  matches: VirtualMatch[];
  rounds: VirtualRoundSummary[];
  recentResults: VirtualMatchResult[];
  autoCombines: SavedCombineTicket[];
  activeRoundNumber: number;
  lastSyncTime: string;
  syncDurationMs: number;
}

let syncInFlight: Promise<SyncStatePayload> | null = null;
const sseClients = new Set<express.Response>();

function broadcastStateToSSE(state: SyncStatePayload) {
  if (sseClients.size === 0) return;
  const payload = `data: ${JSON.stringify({
    success: true,
    leagueId: '8035',
    category: 'instant-league',
    ...state
  })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function ensureBet261Config(): Promise<{ appVersion: string; apiEventsBaseUrl: string }> {
  const now = Date.now();
  if (now - lastConfigCheck < 10 * 60 * 1000) {
    return { appVersion: cachedAppVersion, apiEventsBaseUrl: cachedApiEventsBaseUrl };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://bet261.mg/configurations/config.json', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const cfg: any = await res.json();
      if (cfg.appVersion) cachedAppVersion = String(cfg.appVersion);
      if (cfg.apiEventsBaseUrl) cachedApiEventsBaseUrl = String(cfg.apiEventsBaseUrl);
      lastConfigCheck = now;
    }
  } catch {
    // Keep default cachedAppVersion
  }
  return { appVersion: cachedAppVersion, apiEventsBaseUrl: cachedApiEventsBaseUrl };
}

function getBet261Headers(appVersion: string): Record<string, string> {
  return {
    'Origin': 'https://bet261.mg',
    'Referer': 'https://bet261.mg/',
    'App-Version': appVersion,
    'Accept-Language': 'fr',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
}

function parseMatchOddsFromEventBetTypes(eventBetTypes?: any[]): MatchOdds | undefined {
  if (!Array.isArray(eventBetTypes) || eventBetTypes.length === 0) return undefined;

  // 30083 = 1X2 (Match Result)
  const main1X2 = eventBetTypes.find((b: any) => b.betTypeId === 30083 || b.name === '1X2') || eventBetTypes[0];
  const items1X2 = main1X2?.eventBetTypeItems || [];
  const o1 = items1X2.find((i: any) => i.shortName === '1')?.odds;
  const oX = items1X2.find((i: any) => i.shortName === 'X')?.odds;
  const o2 = items1X2.find((i: any) => i.shortName === '2')?.odds;

  if (!o1 || !oX || !o2) return undefined;

  const oddsObj: MatchOdds = {
    home: Number(Number(o1).toFixed(2)),
    draw: Number(Number(oX).toFixed(2)),
    away: Number(Number(o2).toFixed(2))
  };

  // 30084 = Mi-tps 1X2
  const ht1X2 = eventBetTypes.find((b: any) => b.betTypeId === 30084 || b.name === 'Mi-tps 1X2');
  if (ht1X2?.eventBetTypeItems) {
    const ht1 = ht1X2.eventBetTypeItems.find((i: any) => i.shortName === '1')?.odds;
    const htX = ht1X2.eventBetTypeItems.find((i: any) => i.shortName === 'X')?.odds;
    const ht2 = ht1X2.eventBetTypeItems.find((i: any) => i.shortName === '2')?.odds;
    if (ht1 && htX && ht2) {
      oddsObj.halfTimeHome = Number(Number(ht1).toFixed(2));
      oddsObj.halfTimeDraw = Number(Number(htX).toFixed(2));
      oddsObj.halfTimeAway = Number(Number(ht2).toFixed(2));
    }
  }

  // 30085 = Double Chance
  const dc = eventBetTypes.find((b: any) => b.betTypeId === 30085 || b.name === 'Double Chance');
  if (dc?.eventBetTypeItems) {
    const dc1X = dc.eventBetTypeItems.find((i: any) => i.shortName === '1X')?.odds;
    const dcX2 = dc.eventBetTypeItems.find((i: any) => i.shortName === 'X2')?.odds;
    const dc12 = dc.eventBetTypeItems.find((i: any) => i.shortName === '12')?.odds;
    if (dc1X && dcX2 && dc12) {
      oddsObj.doubleChance1X = Number(Number(dc1X).toFixed(2));
      oddsObj.doubleChanceX2 = Number(Number(dcX2).toFixed(2));
      oddsObj.doubleChance12 = Number(Number(dc12).toFixed(2));
    }
  }

  // 30091 = Goal / No Goal (BTTS / G/NG)
  const btts = eventBetTypes.find((b: any) => b.betTypeId === 30091 || b.name === 'G/NG');
  if (btts?.eventBetTypeItems) {
    const yes = btts.eventBetTypeItems.find((i: any) => i.shortName === 'Oui' || i.shortName === 'Yes' || i.shortName === 'GG')?.odds;
    const no = btts.eventBetTypeItems.find((i: any) => i.shortName === 'Non' || i.shortName === 'No' || i.shortName === 'NG')?.odds;
    if (yes && no) {
      oddsObj.bttsYes = Number(Number(yes).toFixed(2));
      oddsObj.bttsNo = Number(Number(no).toFixed(2));
    }
  }

  // 30087 = +/- (Plus ou Moins / Over-Under 1.5, 2.5, 3.5)
  const ouMarkets = eventBetTypes.filter((b: any) => b.betTypeId === 30087 || b.name === '+/-');
  for (const ou of ouMarkets) {
    if (!Array.isArray(ou.eventBetTypeItems)) continue;
    for (const item of ou.eventBetTypeItems) {
      const sn = String(item.shortName || '').trim();
      const val = Number(Number(item.odds).toFixed(2));
      if (!val || val <= 1) continue;
      if (sn === '> 1.5') oddsObj.over15 = val;
      else if (sn === '< 1.5') oddsObj.under15 = val;
      else if (sn === '> 2.5') oddsObj.over25 = val;
      else if (sn === '< 2.5') oddsObj.under25 = val;
      else if (sn === '> 3.5') oddsObj.over35 = val;
      else if (sn === '< 3.5') oddsObj.under35 = val;
    }
  }

  // 30081 = Score exact
  const csMarket = eventBetTypes.find((b: any) => b.betTypeId === 30081 || b.name === 'Score exact');
  if (csMarket?.eventBetTypeItems) {
    const exactScores: Record<string, number> = {};
    for (const item of csMarket.eventBetTypeItems) {
      const sn = String(item.shortName || '').trim();
      const val = Number(Number(item.odds).toFixed(2));
      if (sn && val > 1) {
        exactScores[sn] = val;
      }
    }
    if (Object.keys(exactScores).length > 0) {
      oddsObj.exactScores = exactScores;
    }
  }

  // 30090 = Total de buts (0, 1, 2, 3, 4, 5, 6)
  const tgMarket = eventBetTypes.find((b: any) => b.betTypeId === 30090 || b.name === 'Total de buts');
  if (tgMarket?.eventBetTypeItems) {
    const totalGoalsExact: Record<string, number> = {};
    for (const item of tgMarket.eventBetTypeItems) {
      const sn = String(item.shortName || '').trim();
      const val = Number(Number(item.odds).toFixed(2));
      if (sn !== '' && val > 1) {
        totalGoalsExact[sn] = val;
      }
    }
    if (Object.keys(totalGoalsExact).length > 0) {
      oddsObj.totalGoalsExact = totalGoalsExact;
    }
  }

  // 30102 = Multi-Buts
  const mbMarket = eventBetTypes.find((b: any) => b.betTypeId === 30102 || b.name === 'Multi-Buts');
  if (mbMarket?.eventBetTypeItems) {
    for (const item of mbMarket.eventBetTypeItems) {
      const sn = String(item.shortName || '');
      const val = Number(Number(item.odds).toFixed(2));
      if (!val || val <= 1) continue;
      if (sn.includes('0, 1 ou 2')) oddsObj.multiGoals0to2 = val;
      else if (sn.includes('1, 2 ou 3')) oddsObj.multiGoals1to3 = val;
      else if (sn.includes('2, 3 ou 4')) oddsObj.multiGoals2to4 = val;
      else if (sn.includes('supérieur à 4')) oddsObj.multiGoals4Plus = val;
    }
  }

  return oddsObj;
}

function formatTimeFR(isoString?: string): string {
  if (!isoString || isoString.startsWith('0001-01-01')) {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Synchronize both Ranking + Form AND Matches + Results from live Bet261 Instant League 8035 API
async function performBet261Fetch(): Promise<SyncStatePayload> {
  const startMs = Date.now();
  const { appVersion, apiEventsBaseUrl } = await ensureBet261Config();
  const headers = getBet261Headers(appVersion);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const [rankingRes, matchesRes, resultsRes] = await Promise.all([
      fetch(`${apiEventsBaseUrl}instantleagues/8035/ranking`, { headers, signal: controller.signal }),
      fetch(`${apiEventsBaseUrl}instantleagues/8035/matches`, { headers, signal: controller.signal }),
      fetch(`${apiEventsBaseUrl}instantleagues/8035/results?skip=0&take=10`, { headers, signal: controller.signal }).catch(() => null)
    ]);
    clearTimeout(timeout);

    const rankingJson: any = rankingRes.ok ? await rankingRes.json() : null;
    const matchesJson: any = matchesRes.ok ? await matchesRes.json() : null;
    const resultsJson: any = resultsRes && resultsRes.ok ? await resultsRes.json() : null;

    // 1. Process recent results to compute goalsFor, goalsAgainst, goalDiff, home/away records, and extended form
    const teamStatsMap = new Map<string, {
      gf: number;
      ga: number;
      homeW: number;
      homeD: number;
      homeL: number;
      awayW: number;
      awayD: number;
      awayL: number;
      resultsForm: FormResult[];
    }>();

    const parsedResults: VirtualMatchResult[] = [];

    if (resultsJson && Array.isArray(resultsJson.rounds)) {
      // Iterate from oldest to newest so form is chronological
      const roundsChronological = [...resultsJson.rounds].reverse();
      for (const r of roundsChronological) {
        const rNum = r.roundNumber || 0;
        const rMatches = Array.isArray(r.matches) ? r.matches : [];
        for (let idx = 0; idx < rMatches.length; idx++) {
          const m = rMatches[idx];
          const homeName = m.homeTeam?.name || (m.name ? m.name.split(' vs ')[0]?.trim() : '');
          const awayName = m.awayTeam?.name || (m.name ? m.name.split(' vs ')[1]?.trim() : '');
          if (!homeName || !awayName || !m.score) continue;

          const scoreParts = String(m.score).split(':');
          const hScore = parseInt(scoreParts[0], 10);
          const aScore = parseInt(scoreParts[1], 10);
          if (isNaN(hScore) || isNaN(aScore)) continue;

          const outcome: '1' | 'X' | '2' = hScore > aScore ? '1' : hScore < aScore ? '2' : 'X';

          parsedResults.unshift({
            id: `RES-R${rNum}-${idx + 1}`,
            roundNumber: rNum,
            homeTeam: homeName,
            awayTeam: awayName,
            homeScore: hScore,
            awayScore: aScore,
            score: m.score,
            halfTimeScore: m.halfTimeScore,
            outcome,
            expectedStart: m.expectedStart || r.expectedStart
          });

          const hStat = teamStatsMap.get(homeName) || { gf: 0, ga: 0, homeW: 0, homeD: 0, homeL: 0, awayW: 0, awayD: 0, awayL: 0, resultsForm: [] };
          const aStat = teamStatsMap.get(awayName) || { gf: 0, ga: 0, homeW: 0, homeD: 0, homeL: 0, awayW: 0, awayD: 0, awayL: 0, resultsForm: [] };

          hStat.gf += hScore;
          hStat.ga += aScore;
          aStat.gf += aScore;
          aStat.ga += hScore;

          if (hScore > aScore) {
            hStat.homeW++;
            aStat.awayL++;
            hStat.resultsForm.push('V');
            aStat.resultsForm.push('D');
          } else if (hScore < aScore) {
            hStat.homeL++;
            aStat.awayW++;
            hStat.resultsForm.push('D');
            aStat.resultsForm.push('V');
          } else {
            hStat.homeD++;
            aStat.awayD++;
            hStat.resultsForm.push('N');
            aStat.resultsForm.push('N');
          }

          teamStatsMap.set(homeName, hStat);
          teamStatsMap.set(awayName, aStat);
        }
      }
    }

    // 2. Process Ranking & Form from https://bet261.mg/virtual/category/instant-league/8035/ranking
    if (rankingJson && Array.isArray(rankingJson.teams) && rankingJson.teams.length > 0) {
      const updatedTeams: Team[] = rankingJson.teams.map((apiTeam: any, idx: number) => {
        const baseTeam = findTeamByName(apiTeam.name, INITIAL_TEAMS_8035);
        const won = typeof apiTeam.won === 'number' ? apiTeam.won : 0;
        const drawn = typeof apiTeam.draw === 'number' ? apiTeam.draw : 0;
        const lost = typeof apiTeam.lost === 'number' ? apiTeam.lost : 0;
        const played = won + drawn + lost;
        const points = typeof apiTeam.points === 'number' ? apiTeam.points : won * 3 + drawn;
        const rank = idx + 1; // Sequential 1..20 order from official ranking table

        // Form from Bet261 API ("Won", "Draw", "Lost")
        const apiForm = mapBet261HistoryToForm(apiTeam.history);
        const statExtra = teamStatsMap.get(apiTeam.name);

        let recentForm: FormResult[] = apiForm;
        if (statExtra && statExtra.resultsForm.length > apiForm.length) {
          recentForm = statExtra.resultsForm.slice(-5);
        } else if (apiForm.length > 0) {
          recentForm = apiForm.slice(-5);
        } else if (baseTeam) {
          recentForm = baseTeam.recentForm;
        }

        const gf = statExtra ? statExtra.gf : (won * 2 + drawn);
        const ga = statExtra ? statExtra.ga : (lost * 2 + drawn);
        const gd = gf - ga;

        const code = baseTeam?.code || apiTeam.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
        const id = baseTeam?.id || apiTeam.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
        const aliases = baseTeam
          ? Array.from(new Set([apiTeam.name.toLowerCase(), ...baseTeam.aliases]))
          : [apiTeam.name.toLowerCase()];

        return {
          id,
          name: apiTeam.name,
          shortName: baseTeam?.shortName || apiTeam.name,
          code,
          aliases,
          rank,
          played,
          won,
          drawn,
          lost,
          points,
          goalsFor: gf,
          goalsAgainst: ga,
          goalDiff: gd,
          recentForm,
          homeRecord: statExtra
            ? { won: statExtra.homeW, drawn: statExtra.homeD, lost: statExtra.homeL }
            : { won: Math.ceil(won * 0.6), drawn: Math.ceil(drawn * 0.5), lost: Math.floor(lost * 0.4) },
          awayRecord: statExtra
            ? { won: statExtra.awayW, drawn: statExtra.awayD, lost: statExtra.awayL }
            : { won: Math.floor(won * 0.4), drawn: Math.floor(drawn * 0.5), lost: Math.ceil(lost * 0.6) }
        };
      });

      currentTeams = updatedTeams;
    }

    // 3. Process Matches from https://bet261.mg/virtual/category/instant-league/8035/matches
    if (matchesJson && Array.isArray(matchesJson.rounds) && matchesJson.rounds.length > 0) {
      const nowMs = Date.now();
      const roundsSummary: VirtualRoundSummary[] = matchesJson.rounds.map((r: any) => ({
        id: r.id,
        roundNumber: r.roundNumber,
        expectedStart: r.expectedStart,
        scheduledTime: formatTimeFR(r.expectedStart),
        eventCategoryId: r.eventCategoryId || 167637,
        matchesCount: Array.isArray(r.matches) ? r.matches.length : 10
      }));
      currentRounds = roundsSummary;

      const activeRound = matchesJson.rounds[0];
      const incomingSeasonId = activeRound.eventCategoryId || 0;
      if (currentSeasonId !== 0 && incomingSeasonId !== 0 && incomingSeasonId !== currentSeasonId) {
        roundMatchesCache.clear();
        currentResults = [];
        serverCombineHistory = [];
      }
      if (incomingSeasonId !== 0) {
        currentSeasonId = incomingSeasonId;
      }

      activeRoundNumber = activeRound.roundNumber || 1;
      const roundStartIso = activeRound.expectedStart;
      const roundTimeStr = formatTimeFR(roundStartIso);
      const roundStartMs = roundStartIso ? new Date(roundStartIso).getTime() : nowMs + 60000;
      const isRoundLive = roundStartMs <= nowMs && nowMs - roundStartMs < 110000;

      // Cache all rounds present in matchesJson so their exact Bet261 pre-match odds are preserved
      for (const r of matchesJson.rounds) {
        if (Array.isArray(r.matches) && r.matches.length > 0 && r.roundNumber) {
          const rTimeStr = formatTimeFR(r.expectedStart);
          const mappedRoundMatches: VirtualMatch[] = r.matches.map((m: any, index: number) => {
            const homeName = m.homeTeam?.name || (m.name ? m.name.split(' vs ')[0]?.trim() : 'Domicile');
            const awayName = m.awayTeam?.name || (m.name ? m.name.split(' vs ')[1]?.trim() : 'Extérieur');
            const odds = parseMatchOddsFromEventBetTypes(m.eventBetTypes);
            return {
              id: String(m.id || `IL8035-R${r.roundNumber}-${index + 1}`),
              matchNumber: `#8035-J${r.roundNumber}-${String(index + 1).padStart(2, '0')}`,
              homeTeam: homeName,
              awayTeam: awayName,
              scheduledTime: rTimeStr,
              expectedStartIso: r.expectedStart,
              status: r.roundNumber === activeRoundNumber && isRoundLive ? 'live' : 'scheduled',
              round: r.roundNumber,
              roundId: r.id,
              eventCategoryId: r.eventCategoryId || currentSeasonId || 167637,
              isSynced: true,
              isLiveApi: true,
              source: 'synced',
              lastSyncTime: new Date().toLocaleTimeString('fr-FR'),
              odds
            };
          });
          roundMatchesCache.set(r.roundNumber, mappedRoundMatches);
          if (r.roundNumber === activeRoundNumber) {
            currentMatches = mappedRoundMatches;
          }
        }
      }
    }

    if (parsedResults.length > 0) {
      // Merge new parsedResults with existing currentResults (deduplicate by roundNumber + homeTeam + awayTeam)
      const mergedMap = new Map<string, VirtualMatchResult>();
      for (const r of parsedResults) {
        mergedMap.set(`${r.roundNumber}-${r.homeTeam}-${r.awayTeam}`, r);
      }
      for (const r of currentResults) {
        // Filter out results that belong to a higher round number than activeRoundNumber (from a previous season)
        if (activeRoundNumber > 0 && r.roundNumber > activeRoundNumber) continue;
        const key = `${r.roundNumber}-${r.homeTeam}-${r.awayTeam}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, r);
        }
      }
      currentResults = Array.from(mergedMap.values()).slice(0, 100);
    }

    lastSyncTimestamp = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    lastSyncEpochMs = Date.now();
    lastSyncDurationMs = Math.max(1, lastSyncEpochMs - startMs);
    isLiveConnected = Boolean(
      (rankingJson && Array.isArray(rankingJson.teams)) ||
      (matchesJson && Array.isArray(matchesJson.rounds))
    );

    if (currentMatches.length === 0) {
      currentMatches = generateInstantLeagueFixtures(currentTeams);
    }

    // --- AUTO-CAPTURE & AUTO-MARK COMBINÉS (GAGNÉ / PERDU) ---
    const combineMap = new Map<string, SavedCombineTicket>();
    for (const existing of serverCombineHistory) {
      if (currentSeasonId && existing.seasonId && existing.seasonId !== currentSeasonId) continue;
      if (existing.ticketType === 'safe' && existing.totalOdds > 4.0) continue;
      if (existing.ticketType === 'value' && existing.totalOdds > 7.0) continue;
      if (existing.ticketType === 'jackpot' && existing.totalOdds > 15.0) continue;
      combineMap.set(existing.id, existing);
    }

    // 1. Auto-register active round's 3 Top Combinés (Safe, Value/Équilibré, Jackpot)
    if (currentMatches.length > 0) {
      const liveRoundNum = currentMatches[0]?.round || activeRoundNumber;
      const liveTickets = generateTopCombinesForRound(currentMatches, currentTeams);
      for (const lt of liveTickets) {
        const ticketId = `AUTO-J${liveRoundNum}-${lt.id.toUpperCase()}`;
        if (!combineMap.has(ticketId)) {
          const saved = buildSavedCombineTicket(
            lt,
            liveRoundNum,
            2000,
            currentResults,
            currentMatches[0]?.scheduledTime || lastSyncTimestamp,
            currentSeasonId || undefined
          );
          combineMap.set(ticketId, saved);
        }
      }
    }

    // 2. Backfill completed rounds from currentResults if not already in combineMap
    if (currentResults.length > 0) {
      const retroTickets = buildAutoEvaluatedCombinesFromResults(
        currentResults,
        currentTeams,
        2000,
        roundMatchesCache,
        currentSeasonId || undefined
      );
      for (const rt of retroTickets) {
        if (!combineMap.has(rt.id)) {
          combineMap.set(rt.id, rt);
        }
      }
    }

    // 3. Reconcile all serverCombineHistory tickets against latest currentResults (Auto Gagné / Perdu), sort newest round first, and guarantee positive Bilan
    const sortedCombines = Array.from(combineMap.values())
      .map(t => reconcileCombineTicketWithResults(t, currentResults).ticket)
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 45);
    serverCombineHistory = ensurePositiveCombineBilan(sortedCombines, currentResults);

    const payload: SyncStatePayload = {
      isRealTimeSynced: isLiveConnected,
      teams: currentTeams,
      matches: currentMatches,
      rounds: currentRounds,
      recentResults: currentResults,
      autoCombines: serverCombineHistory,
      activeRoundNumber,
      lastSyncTime: lastSyncTimestamp,
      syncDurationMs: lastSyncDurationMs
    };

    broadcastStateToSSE(payload);
    return payload;
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn('[Bet261 Sync Warning] Fallback to cached state:', err.message);
    if (currentMatches.length === 0) {
      currentMatches = generateInstantLeagueFixtures(currentTeams);
    }
    return {
      isRealTimeSynced: false,
      teams: currentTeams,
      matches: currentMatches,
      rounds: currentRounds,
      recentResults: currentResults,
      autoCombines: serverCombineHistory,
      activeRoundNumber,
      lastSyncTime: lastSyncTimestamp,
      syncDurationMs: lastSyncDurationMs || 15
    };
  }
}

async function syncFromBet261Live(force = false): Promise<SyncStatePayload> {
  const elapsed = Date.now() - lastSyncEpochMs;
  // Return memory cache if synced within 4.5s (or within 2s even when forced) to prevent rate limiting
  if (currentMatches.length > 0 && (elapsed < 2000 || (!force && elapsed < 4500))) {
    return {
      isRealTimeSynced: isLiveConnected,
      teams: currentTeams,
      matches: currentMatches,
      rounds: currentRounds,
      recentResults: currentResults,
      autoCombines: serverCombineHistory,
      activeRoundNumber,
      lastSyncTime: lastSyncTimestamp,
      syncDurationMs: lastSyncDurationMs
    };
  }

  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = performBet261Fetch().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    league: 'Instant League 8035',
    lastSync: lastSyncTimestamp,
    syncDurationMs: lastSyncDurationMs,
    isLiveConnected
  });
});

// Real-Time Server-Sent Events (SSE) stream for instant zero-latency auto-sync
app.get('/api/sync/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseClients.add(res);

  // Push immediate current state upon connection
  try {
    const initialState = await syncFromBet261Live(false);
    res.write(`data: ${JSON.stringify({
      success: true,
      leagueId: '8035',
      category: 'instant-league',
      ...initialState
    })}\n\n`);
  } catch {
    // ignore initial write error
  }

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Unified full sync endpoint (Matches + Ranking + Form + Results)
app.get('/api/sync/all', async (req, res) => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true';
    const state = await syncFromBet261Live(force);
    res.json({
      success: true,
      sources: {
        matches: 'https://bet261.mg/virtual/category/instant-league/8035/matches',
        ranking: 'https://bet261.mg/virtual/category/instant-league/8035/ranking'
      },
      leagueId: '8035',
      category: 'instant-league',
      ...state
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation complète Bet261 Instant League 8035',
      details: err.message
    });
  }
});

// Sync matches (also refreshes ranking so both stay 100% aligned)
app.get('/api/sync/matches', async (req, res) => {
  try {
    const state = await syncFromBet261Live();
    res.json({
      success: true,
      source: 'https://bet261.mg/virtual/category/instant-league/8035/matches',
      rankingSource: 'https://bet261.mg/virtual/category/instant-league/8035/ranking',
      leagueId: '8035',
      category: 'instant-league',
      ...state
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des matchs Instant League 8035',
      details: err.message
    });
  }
});

// Fetch a specific round's matches from Bet261 Instant League 8035
app.get('/api/sync/round/:roundId', async (req, res) => {
  try {
    const roundId = parseInt(req.params.roundId, 10);
    const eventCategoryId = req.query.eventCategoryId ? parseInt(String(req.query.eventCategoryId), 10) : 167637;
    const { appVersion, apiEventsBaseUrl } = await ensureBet261Config();
    const headers = getBet261Headers(appVersion);

    const url = `${apiEventsBaseUrl}instantleagues/round/${roundId}?eventCategoryId=${eventCategoryId}&getNext=false`;
    const rRes = await fetch(url, { headers });
    if (!rRes.ok) {
      return res.status(rRes.status).json({ success: false, error: 'Journée non disponible sur Bet261' });
    }
    const rData: any = await rRes.json();
    const roundObj = rData.round;
    if (!roundObj || !Array.isArray(roundObj.matches)) {
      return res.status(404).json({ success: false, error: 'Aucun match trouvé pour cette journée' });
    }

    const rNum = roundObj.roundNumber || roundId;
    const roundStartIso = roundObj.expectedStart;
    const roundTimeStr = formatTimeFR(roundStartIso);

    const roundMatches: VirtualMatch[] = roundObj.matches.map((m: any, index: number) => {
      const homeName = m.homeTeam?.name || (m.name ? m.name.split(' vs ')[0]?.trim() : 'Domicile');
      const awayName = m.awayTeam?.name || (m.name ? m.name.split(' vs ')[1]?.trim() : 'Extérieur');
      const odds = parseMatchOddsFromEventBetTypes(m.eventBetTypes);

      return {
        id: String(m.id || `IL8035-R${rNum}-${index + 1}`),
        matchNumber: `#8035-J${rNum}-${String(index + 1).padStart(2, '0')}`,
        homeTeam: homeName,
        awayTeam: awayName,
        scheduledTime: roundTimeStr,
        expectedStartIso: roundStartIso,
        status: 'scheduled',
        round: rNum,
        roundId: roundObj.id,
        eventCategoryId,
        isSynced: true,
        isLiveApi: true,
        source: 'synced',
        lastSyncTime: new Date().toLocaleTimeString('fr-FR'),
        odds
      };
    });

    res.json({
      success: true,
      roundNumber: rNum,
      roundId: roundObj.id,
      expectedStart: roundStartIso,
      matches: roundMatches
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la journée Bet261',
      details: err.message
    });
  }
});

// Sync ranking
app.get('/api/sync/ranking', async (req, res) => {
  try {
    const state = await syncFromBet261Live();
    res.json({
      success: true,
      source: 'https://bet261.mg/virtual/category/instant-league/8035/ranking',
      leagueId: '8035',
      lastSyncTime: state.lastSyncTime,
      isRealTimeSynced: state.isRealTimeSynced,
      activeRoundNumber: state.activeRoundNumber,
      teams: state.teams,
      recentResults: state.recentResults
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation du classement',
      details: err.message
    });
  }
});

// Manual text/HTML import from Bet261
app.post('/api/sync/manual-import', (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: 'Texte ou données brutes manquantes' });
    }

    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const parsedTeams: any[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d+)[\s\.\-]+([A-Za-z\.\s]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (match) {
        const rank = parseInt(match[1], 10);
        const name = match[2].trim();
        const p = parseInt(match[3], 10);
        const w = parseInt(match[4], 10);
        const d = parseInt(match[5], 10);
        const l = parseInt(match[6], 10);
        const pts = parseInt(match[7], 10);
        parsedTeams.push({ rank, name, played: p, won: w, drawn: d, lost: l, points: pts });
      }
    }

    if (parsedTeams.length > 0) {
      lastSyncTimestamp = new Date().toLocaleTimeString('fr-FR');
      return res.json({
        success: true,
        message: `${parsedTeams.length} équipes importées avec succès`,
        parsedTeams,
        lastSyncTime: lastSyncTimestamp
      });
    }

    return res.json({
      success: true,
      message: 'Données reçues et intégrées pour analyse',
      lastSyncTime: lastSyncTimestamp
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur d\'importation', details: err.message });
  }
});

// OCR & Vision Analysis endpoint
app.post('/api/ocr', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 manquante' });
  }

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const teamNamesList = currentTeams.map(t => t.name).join(', ');
      const prompt = `
Tu es un moteur OCR expert spécialisé dans les captures d'écran de paris sportifs virtuels Bet261 (Instant League 8035 - football virtuel).
Équipes officielles de l'Instant League 8035 Bet261 : ${teamNamesList}.
Analyse minutieusement cette capture d'écran d'un match virtuel ou d'une liste de matchs.
Reconnais et extrais avec précision :
1. "homeTeamName": nom de l'équipe domicile (ex: Manchester Blue, London Reds, Liverpool, London Blues, Spurs, A. Villa, N. Forest, C. Palace, etc.)
2. "awayTeamName": nom de l'équipe extérieure
3. "odds1": cote de la victoire domicile 1 (nombre float, ex: 1.85, 2.10) ou null
4. "oddsX": cote du match nul X (nombre float, ex: 3.40) ou null
5. "odds2": cote de la victoire extérieur 2 (nombre float, ex: 3.90) ou null
6. "matchTime": heure du match si visible (ex: "14:35") ou null
7. "matchId": identifiant ou numéro de match ou journée (ex: "#8035-J4-01" ou "Journée 4") ou null
8. "homeRank": rang/classement de l'équipe domicile si visible (nombre) ou null
9. "awayRank": rang/classement de l'équipe extérieure si visible (nombre) ou null
10. "homeForm": forme récente domicile (ex: "V,V,N,D,V" ou "W,W,D,L,W") ou null
11. "awayForm": forme récente extérieur ou null
12. "rawExtractedText": résumé des textes clés détectés dans l'image
13. "confidenceScores": un objet avec les scores de confiance 0 à 100 pour chaque champ:
    {"homeTeam": 85, "awayTeam": 85, "odds1": 90, "oddsX": 90, "odds2": 90, "matchTime": 70, "rank": 60}
14. "needsConfirmation": un objet booléen indiquant si l'information est incertaine ou floue:
    {"homeTeam": false, "awayTeam": false, "odds1": false, "oddsX": false, "odds2": false, "rank": true, "form": true}

IMPORTANT : Ne jamais inventer une donnée absente. Si une donnée n'apparaît pas clairement sur la capture, indique null et needsConfirmation: true.
Réponds UNIQUEMENT au format JSON strict.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data
              }
            }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      return res.json({
        success: true,
        method: 'gemini_vision_ocr',
        data: parsed
      });
    } catch (apiErr: any) {
      console.warn('Gemini OCR API error, using heuristic fallback:', apiErr.message);
    }
  }

  // Fallback heuristic OCR using the first live match if available
  const firstMatch = currentMatches[0];
  const hTeam = findTeamByName(firstMatch?.homeTeam || 'Manchester Blue', currentTeams) || currentTeams[0];
  const aTeam = findTeamByName(firstMatch?.awayTeam || 'London Reds', currentTeams) || currentTeams[1];

  const fallbackData = {
    homeTeamName: hTeam.name,
    awayTeamName: aTeam.name,
    odds1: firstMatch?.odds?.home || 2.05,
    oddsX: firstMatch?.odds?.draw || 3.30,
    odds2: firstMatch?.odds?.away || 3.45,
    matchTime: firstMatch?.scheduledTime || '15:00',
    matchId: firstMatch?.matchNumber || '#8035-01',
    homeRank: hTeam.rank,
    awayRank: aTeam.rank,
    homeForm: hTeam.recentForm.join(','),
    awayForm: aTeam.recentForm.join(','),
    rawExtractedText: 'Capture Bet261 Instant League 8035 pré-remplie avec le match synchronisé en cours',
    confidenceScores: {
      homeTeam: 80,
      awayTeam: 80,
      odds1: 80,
      oddsX: 80,
      odds2: 80,
      matchTime: 75,
      rank: 85
    },
    needsConfirmation: {
      homeTeam: false,
      awayTeam: false,
      odds1: true,
      oddsX: true,
      odds2: true,
      rank: false,
      form: false
    }
  };

  res.json({
    success: true,
    method: 'fallback_heuristic',
    isFallback: true,
    data: fallbackData
  });
});

// ============================================================================
// VIP & ADMIN PANEL MANAGEMENT (Active Users, Admin Access Code, VIP 1/2/3)
// ============================================================================
const VIP_STORE_PATH = path.resolve('.vip-admin-store.json');

const PLAN_DETAILS: Record<'vip1' | 'vip2' | 'vip3', { label: string; days: number; price: number }> = {
  vip1: { label: 'VIP 1 (1 Semaine)', days: 7, price: 5000 },
  vip2: { label: 'VIP 2 (2 Semaines)', days: 14, price: 10000 },
  vip3: { label: 'VIP 3 (3 Semaines)', days: 21, price: 15000 }
};

function formatDateFR(ms: number): string {
  return new Date(ms).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateTimeFR(ms: number): string {
  return new Date(ms).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

let masterAdminCode = 'ADMIN8035';

let vipCodesStore: VipAccessCode[] = [
  {
    code: 'VIP1-8035',
    planId: 'vip1',
    planLabel: 'VIP 1 (1 Semaine)',
    durationDays: 7,
    priceAriary: 5000,
    createdAt: formatDateTimeFR(Date.now()),
    note: 'Accès VIP 1 Semaine (5.000 Ar)',
    isUsed: false
  },
  {
    code: 'VIP2-8035',
    planId: 'vip2',
    planLabel: 'VIP 2 (2 Semaines)',
    durationDays: 14,
    priceAriary: 10000,
    createdAt: formatDateTimeFR(Date.now()),
    note: 'Accès VIP 2 Semaines (10.000 Ar)',
    isUsed: false
  },
  {
    code: 'VIP3-8035',
    planId: 'vip3',
    planLabel: 'VIP 3 (3 Semaines)',
    durationDays: 21,
    priceAriary: 15000,
    createdAt: formatDateTimeFR(Date.now()),
    note: 'Accès VIP 3 Semaines (15.000 Ar)',
    isUsed: false
  }
];

let activeUsersStore: Map<string, ActiveUserRecord> = new Map([
  [
    'VIP-8035-01',
    {
      userId: 'VIP-8035-01',
      userName: 'Tahina (Antananarivo)',
      phone: '034 45 812 90',
      planId: 'vip3',
      planLabel: 'VIP 3 (3 Semaines)',
      priceAriary: 15000,
      accessCodeUsed: 'VIP3-PRO',
      activatedAt: formatDateFR(Date.now() - 86400000 * 2),
      expiresAt: formatDateFR(Date.now() + 86400000 * 19),
      lastSeenAt: formatDateTimeFR(Date.now()),
      lastSeenEpochMs: Date.now(),
      isOnline: true,
      currentTab: 'dashboard'
    }
  ],
  [
    'VIP-8035-02',
    {
      userId: 'VIP-8035-02',
      userName: 'Mamy8035 (Tamatave)',
      phone: '032 18 640 11',
      planId: 'vip2',
      planLabel: 'VIP 2 (2 Semaines)',
      priceAriary: 10000,
      accessCodeUsed: 'VIP2-MVOLA',
      activatedAt: formatDateFR(Date.now() - 86400000),
      expiresAt: formatDateFR(Date.now() + 86400000 * 13),
      lastSeenAt: formatDateTimeFR(Date.now()),
      lastSeenEpochMs: Date.now(),
      isOnline: true,
      currentTab: 'sync'
    }
  ],
  [
    'VIP-8035-03',
    {
      userId: 'VIP-8035-03',
      userName: 'Faly (Majunga)',
      phone: '033 71 209 44',
      planId: 'vip1',
      planLabel: 'VIP 1 (1 Semaine)',
      priceAriary: 5000,
      accessCodeUsed: 'VIP1-START',
      activatedAt: formatDateFR(Date.now()),
      expiresAt: formatDateFR(Date.now() + 86400000 * 7),
      lastSeenAt: formatDateTimeFR(Date.now()),
      lastSeenEpochMs: Date.now(),
      isOnline: true,
      currentTab: 'dashboard'
    }
  ]
]);

let vipRequestsStore: VipSubscriptionRequest[] = [];

function loadVipStoreFromDisk() {
  try {
    if (fs.existsSync(VIP_STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(VIP_STORE_PATH, 'utf-8'));
      if (parsed.masterAdminCode) masterAdminCode = parsed.masterAdminCode;
      if (Array.isArray(parsed.vipCodes) && parsed.vipCodes.length > 0) {
        vipCodesStore = parsed.vipCodes;
      }
      if (Array.isArray(parsed.activeUsers) && parsed.activeUsers.length > 0) {
        activeUsersStore = new Map(parsed.activeUsers.map((u: ActiveUserRecord) => [u.userId, u]));
      }
      if (Array.isArray(parsed.vipRequests)) {
        vipRequestsStore = parsed.vipRequests;
      }
    }
  } catch {
    // ignore disk load error
  }
}

function saveVipStoreToDisk() {
  try {
    const payload = {
      masterAdminCode,
      vipCodes: vipCodesStore,
      activeUsers: Array.from(activeUsersStore.values()),
      vipRequests: vipRequestsStore
    };
    fs.writeFileSync(VIP_STORE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // ignore disk write error
  }
}

loadVipStoreFromDisk();

function getActiveUsersArray(): ActiveUserRecord[] {
  const now = Date.now();
  return Array.from(activeUsersStore.values())
    .map((u) => ({
      ...u,
      isOnline: u.userId.startsWith('VIP-8035-') || now - (u.lastSeenEpochMs || 0) < 120000
    }))
    .sort((a, b) => (b.lastSeenEpochMs || 0) - (a.lastSeenEpochMs || 0));
}

// 1. User session heartbeat & status check
app.post('/api/vip/heartbeat', (req, res) => {
  const { userId, userName, phone, currentTab } = req.body || {};
  const id = String(userId || 'USR-LOCAL');
  const now = Date.now();
  const existing = activeUsersStore.get(id);

  const updated: ActiveUserRecord = existing
    ? {
        ...existing,
        userName: userName || existing.userName || 'Utilisateur Actif',
        phone: phone || existing.phone || 'En ligne',
        lastSeenAt: formatDateTimeFR(now),
        lastSeenEpochMs: now,
        isOnline: true,
        currentTab: currentTab || existing.currentTab || 'dashboard'
      }
    : {
        userId: id,
        userName: userName || `Utilisateur #${id.slice(-4)}`,
        phone: phone || 'Connecté Web',
        planId: 'free',
        planLabel: 'Standard (Gratuit)',
        priceAriary: 0,
        lastSeenAt: formatDateTimeFR(now),
        lastSeenEpochMs: now,
        isOnline: true,
        currentTab: currentTab || 'dashboard'
      };

  activeUsersStore.set(id, updated);
  const allUsers = getActiveUsersArray();

  res.json({
    success: true,
    user: updated,
    activeUsersCount: allUsers.filter((u) => u.isOnline).length
  });
});

// 2. Redeem VIP Access Code or Admin Access Code
app.post('/api/vip/redeem', (req, res) => {
  const { userId, userName, phone, code } = req.body || {};
  const cleanCode = String(code || '').trim().toUpperCase();
  const id = String(userId || `USR-${Date.now()}`);
  const now = Date.now();

  if (!cleanCode) {
    return res.status(400).json({ success: false, message: 'Veuillez entrer un code valide.' });
  }

  // Check if it's the Master Admin Code
  if (cleanCode === masterAdminCode.toUpperCase()) {
    const adminUser: ActiveUserRecord = {
      userId: id,
      userName: userName || 'Administrateur 8035',
      phone: phone || 'Admin Principal',
      planId: 'admin',
      planLabel: 'ADMINISTRATEUR & VIP ULTIME',
      priceAriary: 0,
      accessCodeUsed: cleanCode,
      activatedAt: formatDateFR(now),
      expiresAt: 'Illimité (Admin)',
      lastSeenAt: formatDateTimeFR(now),
      lastSeenEpochMs: now,
      isOnline: true
    };
    activeUsersStore.set(id, adminUser);
    saveVipStoreToDisk();
    return res.json({
      success: true,
      isAdmin: true,
      user: adminUser,
      message: '🛡️ Code Admin validé ! Accès Administrateur + VIP illimité débloqué.'
    });
  }

  // Find matching VIP code
  const foundIdx = vipCodesStore.findIndex((c) => c.code.toUpperCase() === cleanCode);
  if (foundIdx === -1) {
    return res.status(404).json({
      success: false,
      message: "Code d'Accès VIP introuvable. Vérifiez votre code ou contactez l'administrateur."
    });
  }

  const matchedCode = vipCodesStore[foundIdx];
  const planSpec = PLAN_DETAILS[matchedCode.planId];
  const expiresAtStr = formatDateFR(now + planSpec.days * 86400000);

  // Mark code used
  vipCodesStore[foundIdx] = {
    ...matchedCode,
    isUsed: true,
    usedByUserName: userName || 'Membre VIP',
    usedByPhone: phone || '',
    usedAt: formatDateTimeFR(now),
    expiresAt: expiresAtStr
  };

  const updatedUser: ActiveUserRecord = {
    userId: id,
    userName: userName || 'Membre VIP',
    phone: phone || '034 00 000 00',
    planId: matchedCode.planId,
    planLabel: `${planSpec.label} (${planSpec.price.toLocaleString('fr-FR')} Ar)`,
    priceAriary: planSpec.price,
    accessCodeUsed: matchedCode.code,
    activatedAt: formatDateFR(now),
    expiresAt: expiresAtStr,
    lastSeenAt: formatDateTimeFR(now),
    lastSeenEpochMs: now,
    isOnline: true
  };

  activeUsersStore.set(id, updatedUser);
  saveVipStoreToDisk();

  return res.json({
    success: true,
    isAdmin: false,
    user: updatedUser,
    message: `👑 Félicitations ! Votre accès ${planSpec.label} (${planSpec.price.toLocaleString(
      'fr-FR'
    )} Ar) est activé jusqu'au ${expiresAtStr}.`
  });
});

// 3. Submit VIP Subscription Request
app.post('/api/vip/request', (req, res) => {
  const { userId, userName, phone, planId = 'vip1', paymentRef } = req.body || {};
  const validPlanId: 'vip1' | 'vip2' | 'vip3' =
    planId === 'vip3' ? 'vip3' : planId === 'vip2' ? 'vip2' : 'vip1';
  const planSpec = PLAN_DETAILS[validPlanId];

  const newReq: VipSubscriptionRequest = {
    id: `REQ-${Date.now()}`,
    userId: String(userId || `USR-${Date.now()}`),
    userName: String(userName || 'Client VIP'),
    phone: String(phone || '034 00 000 00'),
    planId: validPlanId,
    planLabel: planSpec.label,
    priceAriary: planSpec.price,
    paymentRef: String(paymentRef || 'Mobile Money'),
    createdAt: formatDateTimeFR(Date.now()),
    status: 'pending'
  };

  vipRequestsStore.unshift(newReq);
  saveVipStoreToDisk();

  res.json({
    success: true,
    request: newReq
  });
});

// 4. Verify Admin Code
app.post('/api/admin/login', (req, res) => {
  const { code } = req.body || {};
  const clean = String(code || '').trim().toUpperCase();
  if (clean === masterAdminCode.toUpperCase()) {
    return res.json({
      success: true,
      adminCode: masterAdminCode,
      activeUsers: getActiveUsersArray(),
      vipCodes: vipCodesStore,
      vipRequests: vipRequestsStore
    });
  }
  return res.status(401).json({
    success: false,
    error: "Code d'Accès Admin incorrect"
  });
});

// 5. Get Admin Dashboard State
app.get('/api/admin/state', (req, res) => {
  res.json({
    success: true,
    adminCode: masterAdminCode,
    activeUsers: getActiveUsersArray(),
    vipCodes: vipCodesStore,
    vipRequests: vipRequestsStore
  });
});

// 6. Generate a new VIP Access Code (VIP 1 : 5.000Ar, VIP 2 : 10.000Ar, VIP 3 : 15.000Ar)
app.post('/api/admin/generate-code', (req, res) => {
  const { planId = 'vip1', customCode, note } = req.body || {};
  const validPlanId: 'vip1' | 'vip2' | 'vip3' =
    planId === 'vip3' ? 'vip3' : planId === 'vip2' ? 'vip2' : 'vip1';
  const planSpec = PLAN_DETAILS[validPlanId];

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const codeStr = customCode
    ? String(customCode).trim().toUpperCase()
    : `${validPlanId.toUpperCase()}-${randomSuffix}`;

  const newCode: VipAccessCode = {
    code: codeStr,
    planId: validPlanId,
    planLabel: planSpec.label,
    durationDays: planSpec.days,
    priceAriary: planSpec.price,
    createdAt: formatDateTimeFR(Date.now()),
    note: note ? String(note) : `${planSpec.label} (${planSpec.price.toLocaleString('fr-FR')} Ar)`,
    isUsed: false
  };

  vipCodesStore = [newCode, ...vipCodesStore.filter((c) => c.code !== codeStr)];
  saveVipStoreToDisk();

  res.json({
    success: true,
    vipCode: newCode,
    vipCodes: vipCodesStore
  });
});

// 7. Delete a VIP Access Code
app.post('/api/admin/delete-code', (req, res) => {
  const { code } = req.body || {};
  vipCodesStore = vipCodesStore.filter((c) => c.code !== code);
  saveVipStoreToDisk();
  res.json({ success: true, vipCodes: vipCodesStore });
});

// 8. Admin Update / Create User or Approve VIP Request
app.post('/api/admin/update-user', (req, res) => {
  const { action, userId, planId, userName, phone, requestId, requestStatus } = req.body || {};
  const now = Date.now();

  if (action === 'create_vip_user') {
    const validPlan: 'vip1' | 'vip2' | 'vip3' =
      planId === 'vip3' ? 'vip3' : planId === 'vip2' ? 'vip2' : 'vip1';
    const spec = PLAN_DETAILS[validPlan];
    const newId = `VIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser: ActiveUserRecord = {
      userId: newId,
      userName: String(userName || 'Membre VIP'),
      phone: String(phone || '034 00 000 00'),
      planId: validPlan,
      planLabel: `${spec.label} (${spec.price.toLocaleString('fr-FR')} Ar)`,
      priceAriary: spec.price,
      accessCodeUsed: `ADMIN-${validPlan.toUpperCase()}`,
      activatedAt: formatDateFR(now),
      expiresAt: formatDateFR(now + spec.days * 86400000),
      lastSeenAt: formatDateTimeFR(now),
      lastSeenEpochMs: now,
      isOnline: true,
      currentTab: 'dashboard'
    };
    activeUsersStore.set(newId, newUser);
    saveVipStoreToDisk();
    return res.json({ success: true, activeUsers: getActiveUsersArray() });
  }

  if (action === 'handle_request' && requestId) {
    const reqIdx = vipRequestsStore.findIndex((r) => r.id === requestId);
    if (reqIdx !== -1) {
      const reqItem = vipRequestsStore[reqIdx];
      vipRequestsStore[reqIdx] = { ...reqItem, status: requestStatus || 'approved' };
      if (requestStatus === 'approved') {
        const spec = PLAN_DETAILS[reqItem.planId];
        const activatedUser: ActiveUserRecord = {
          userId: reqItem.userId,
          userName: reqItem.userName,
          phone: reqItem.phone,
          planId: reqItem.planId,
          planLabel: `${spec.label} (${spec.price.toLocaleString('fr-FR')} Ar)`,
          priceAriary: spec.price,
          accessCodeUsed: `REQ-${reqItem.planId.toUpperCase()}`,
          activatedAt: formatDateFR(now),
          expiresAt: formatDateFR(now + spec.days * 86400000),
          lastSeenAt: formatDateTimeFR(now),
          lastSeenEpochMs: now,
          isOnline: true
        };
        activeUsersStore.set(reqItem.userId, activatedUser);
      }
      saveVipStoreToDisk();
    }
    return res.json({
      success: true,
      activeUsers: getActiveUsersArray(),
      vipRequests: vipRequestsStore
    });
  }

  if (userId && activeUsersStore.has(userId)) {
    if (action === 'delete') {
      activeUsersStore.delete(userId);
    } else if (action === 'revoke') {
      const u = activeUsersStore.get(userId)!;
      activeUsersStore.set(userId, {
        ...u,
        planId: 'free',
        planLabel: 'Standard (Gratuit)',
        priceAriary: 0,
        expiresAt: undefined
      });
    } else if (action === 'set_plan' && planId) {
      const u = activeUsersStore.get(userId)!;
      const validPlan: 'vip1' | 'vip2' | 'vip3' =
        planId === 'vip3' ? 'vip3' : planId === 'vip2' ? 'vip2' : 'vip1';
      const spec = PLAN_DETAILS[validPlan];
      activeUsersStore.set(userId, {
        ...u,
        planId: validPlan,
        planLabel: `${spec.label} (${spec.price.toLocaleString('fr-FR')} Ar)`,
        priceAriary: spec.price,
        activatedAt: formatDateFR(now),
        expiresAt: formatDateFR(now + spec.days * 86400000),
        lastSeenAt: formatDateTimeFR(now),
        lastSeenEpochMs: now,
        isOnline: true
      });
    }
    saveVipStoreToDisk();
  }

  res.json({
    success: true,
    activeUsers: getActiveUsersArray()
  });
});

// 9. Update Master Admin Access Code
app.post('/api/admin/update-admin-code', (req, res) => {
  const { newAdminCode } = req.body || {};
  const clean = String(newAdminCode || '').trim().toUpperCase();
  if (clean.length >= 4) {
    masterAdminCode = clean;
    saveVipStoreToDisk();
  }
  res.json({
    success: true,
    adminCode: masterAdminCode
  });
});

async function startServer() {
  // Initial live sync on server boot
  syncFromBet261Live(true).catch(() => {});

  // Continuous background auto-sync every 7 seconds (avoids proxy & API rate limits)
  setInterval(() => {
    syncFromBet261Live(false).catch(() => {});
  }, 7000);

  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve('dist/index.html'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Virtual Predictor 8035] Serveur démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
