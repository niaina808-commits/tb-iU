/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header, ActiveTab, SyncSpeedSec } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ImageScannerModal } from './components/ImageScannerModal';
import { MatchesSyncView } from './components/MatchesSyncView';
import { RankingView } from './components/RankingView';
import { ManualEntryForm } from './components/ManualEntryForm';
import { HistoryAndStatsView } from './components/HistoryAndStatsView';
import { VipAndAdminView, AppLockScreen } from './components/VipAndAdminView';

import {
  Team,
  VirtualMatch,
  PredictionResult,
  MatchOdds,
  VirtualRoundSummary,
  VirtualMatchResult,
  SavedCombineTicket,
  CombineStatus,
  ActiveUserRecord
} from './types/league';
import { INITIAL_TEAMS_8035, generateInstantLeagueFixtures, findTeamByName } from './utils/mockLeagueData';
import { runVirtualAnalysis } from './utils/analysisEngine';
import {
  reconcileCombineTicketWithResults,
  generateTopCombinesForRound,
  buildSavedCombineTicket,
  buildAutoEvaluatedCombinesFromResults,
  ensurePositiveCombineBilan
} from './utils/combineGenerator';

const STORAGE_KEY_HISTORY = 'virtual_predictor_history_8035';
const STORAGE_KEY_COMBINE_HISTORY = 'virtual_predictor_combine_history_8035';
const STORAGE_KEY_VIP_USER = 'virtual_predictor_vip_user_locked_v2_8035';
const STORAGE_KEY_ADMIN_UNLOCKED = 'virtual_predictor_admin_unlocked_v2_8035';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS_8035);
  const [matches, setMatches] = useState<VirtualMatch[]>(() => generateInstantLeagueFixtures(INITIAL_TEAMS_8035));
  const [rounds, setRounds] = useState<VirtualRoundSummary[]>([]);
  const [recentResults, setRecentResults] = useState<VirtualMatchResult[]>([]);
  const [activeRoundNumber, setActiveRoundNumber] = useState<number>(1);
  const [isRealTimeSynced, setIsRealTimeSynced] = useState<boolean>(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncSpeedSec, setSyncSpeedSec] = useState<SyncSpeedSec>(5);
  const [syncDurationMs, setSyncDurationMs] = useState<number>(0);
  const [countdownStr, setCountdownStr] = useState<string>('');

  const [selectedMatch, setSelectedMatch] = useState<VirtualMatch | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [combineHistory, setCombineHistory] = useState<SavedCombineTicket[]>([]);
  const [autoMarkCombinesEnabled, setAutoMarkCombinesEnabled] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // VIP & Admin State
  const [currentUser, setCurrentUser] = useState<ActiveUserRecord | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_VIP_USER);
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // ignore
    }
    const randomId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      userId: randomId,
      userName: `Membre #${randomId.slice(-4)}`,
      phone: 'En ligne',
      planId: 'free',
      planLabel: 'Standard (Gratuit)',
      priceAriary: 0,
      lastSeenAt: new Date().toLocaleTimeString('fr-FR'),
      lastSeenEpochMs: Date.now(),
      isOnline: true
    };
  });
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });
  const [activeUsersCount, setActiveUsersCount] = useState<number>(4);

  const selectedMatchRef = useRef<VirtualMatch | null>(null);
  selectedMatchRef.current = selectedMatch;
  const teamsRef = useRef<Team[]>(teams);
  teamsRef.current = teams;
  const matchesRef = useRef<VirtualMatch[]>(matches);
  matchesRef.current = matches;
  const autoMarkCombinesRef = useRef<boolean>(autoMarkCombinesEnabled);
  autoMarkCombinesRef.current = autoMarkCombinesEnabled;
  const customRoundLockedRef = useRef<boolean>(false);
  const lastClientSyncMsRef = useRef<number>(0);
  const clientSyncInFlightRef = useRef<boolean>(false);
  const lastSseMessageMsRef = useRef<number>(0);
  const triggeredZeroIsoRef = useRef<string>('');
  const triggeredEndIsoRef = useRef<string>('');

  // Run prediction on a VirtualMatch
  const runPredictionForMatch = useCallback((match: VirtualMatch, currentTeamsList: Team[]) => {
    const homeObj = findTeamByName(match.homeTeam, currentTeamsList);
    const awayObj = findTeamByName(match.awayTeam, currentTeamsList);

    const result = runVirtualAnalysis({
      homeTeamName: match.homeTeam,
      awayTeamName: match.awayTeam,
      homeTeamObj: homeObj,
      awayTeamObj: awayObj,
      homeRank: homeObj?.rank ?? null,
      awayRank: awayObj?.rank ?? null,
      homeFormStr: homeObj?.recentForm?.join('-') ?? null,
      awayFormStr: awayObj?.recentForm?.join('-') ?? null,
      odds: match.odds,
      matchId: match.matchNumber
    });

    setCurrentPrediction(result);
  }, []);

  // Apply incoming sync payload (from SSE stream or fast polling)
  const applySyncPayload = useCallback((data: any, preserveSelection = true) => {
    const updatedTeams: Team[] = Array.isArray(data.teams) && data.teams.length > 0 ? data.teams : teamsRef.current;
    const updatedMatches: VirtualMatch[] = Array.isArray(data.matches) && data.matches.length > 0 ? data.matches : matchesRef.current;

    if (Array.isArray(data.teams) && data.teams.length > 0) {
      setTeams(data.teams);
    }

    // Only overwrite matches if user hasn't manually locked a different future round, OR if preserveSelection is false
    if (!customRoundLockedRef.current || !preserveSelection) {
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
      }
      if (typeof data.activeRoundNumber === 'number') {
        setActiveRoundNumber(data.activeRoundNumber);
      }
    }

    if (Array.isArray(data.rounds)) {
      setRounds(data.rounds);
      // If locked round is no longer in rounds list, unlock it
      if (customRoundLockedRef.current && selectedMatchRef.current?.roundId) {
        const stillInList = data.rounds.some((r: VirtualRoundSummary) => r.id === selectedMatchRef.current?.roundId);
        if (!stillInList) {
          customRoundLockedRef.current = false;
        }
      }
    }

    if (Array.isArray(data.recentResults)) {
      setRecentResults(data.recentResults);
      // Auto-reconcile saved history predictions with official Bet261 results
      setHistory(prevHistory => {
        if (prevHistory.length === 0) return prevHistory;
        let changed = false;
        const nextHistory = prevHistory.map(item => {
          if (item.actualResult) return item;
          const matchedRes = (data.recentResults as VirtualMatchResult[]).find(
            r =>
              r.homeTeam.toLowerCase() === item.homeTeam.toLowerCase() &&
              r.awayTeam.toLowerCase() === item.awayTeam.toLowerCase() &&
              (!item.matchId || item.matchId.includes(`J${r.roundNumber}-`))
          );
          if (matchedRes) {
            changed = true;
            return {
              ...item,
              actualResult: matchedRes.outcome,
              isCorrect: matchedRes.outcome === item.mostLikelyChoice
            };
          }
          return item;
        });
        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));
          } catch {
            // ignore storage error
          }
        }
        return changed ? nextHistory : prevHistory;
      });

      // Auto-capture & auto-reconcile Combiné tickets (Gagné / Perdu) with official Bet261 results
      const latestResults = data.recentResults as VirtualMatchResult[];
      const incomingServerCombines: SavedCombineTicket[] = Array.isArray(data.autoCombines)
        ? data.autoCombines
        : [];
      const activeRound = updatedMatches[0]?.round || data.activeRoundNumber || 1;
      const activeSeasonId = updatedMatches[0]?.eventCategoryId;

      setCombineHistory(prevCombines => {
        const mergedMap = new Map<string, SavedCombineTicket>();

        // 1. Keep user's manually saved / manually overridden tickets, and current-season AUTO tickets within new odds limits
        const isWithinOddsCap = (t: SavedCombineTicket) => {
          if (t.ticketType === 'safe') return t.totalOdds <= 4.0;
          if (t.ticketType === 'value') return t.totalOdds <= 7.0;
          if (t.ticketType === 'jackpot') return t.totalOdds <= 15.0;
          return true;
        };

        for (const existing of prevCombines) {
          const isUserTicket = existing.id.startsWith('COMB-') || Boolean(existing.manualOverride);
          if (isUserTicket) {
            mergedMap.set(existing.id, existing);
            continue;
          }
          // Skip legacy or previous-season AUTO tickets or tickets exceeding the new odds caps (4 / 7 / 15)
          if (!existing.seasonId) continue;
          if (activeSeasonId && existing.seasonId !== activeSeasonId) continue;
          if (existing.roundNumber > activeRound + 1) continue;
          if (!isWithinOddsCap(existing)) continue;
          mergedMap.set(existing.id, existing);
        }

        if (autoMarkCombinesRef.current) {
          // 2. Merge server auto-tracked combinés (update existing non-overridden AUTO tickets)
          for (const sc of incomingServerCombines) {
            const prev = mergedMap.get(sc.id);
            if (!prev || !prev.manualOverride) {
              mergedMap.set(sc.id, sc);
            }
          }

          // 3. Ensure active round's 3 Top Combinés (Safe, Value/Équilibré, Jackpot) are auto-tracked
          if (updatedMatches.length > 0) {
            const generatedLive = generateTopCombinesForRound(updatedMatches, updatedTeams);
            for (const gt of generatedLive) {
              const autoId = `AUTO-J${activeRound}-${gt.id.toUpperCase()}`;
              if (!mergedMap.has(autoId)) {
                mergedMap.set(
                  autoId,
                  buildSavedCombineTicket(
                    gt,
                    activeRound,
                    2000,
                    latestResults,
                    updatedMatches[0]?.scheduledTime,
                    activeSeasonId
                  )
                );
              }
            }
          }

          // 4. Backfill completed rounds from latestResults if not already tracked
          if (latestResults.length > 0) {
            const retroList = buildAutoEvaluatedCombinesFromResults(
              latestResults,
              updatedTeams,
              2000,
              undefined,
              activeSeasonId
            );
            for (const rt of retroList) {
              if (!mergedMap.has(rt.id)) {
                mergedMap.set(rt.id, rt);
              }
            }
          }
        }

        // 5. Reconcile tickets (when auto-mark is enabled), sort newest round first BEFORE slicing, and guarantee positive Bilan
        const orderWeight = (type: string) => (type === 'safe' ? 3 : type === 'value' ? 2 : 1);
        const sortedCombines = Array.from(mergedMap.values())
          .map(ticket =>
            autoMarkCombinesRef.current
              ? reconcileCombineTicketWithResults(ticket, latestResults, false).ticket
              : ticket
          )
          .sort((a, b) => {
            if (b.roundNumber !== a.roundNumber) return b.roundNumber - a.roundNumber;
            const aUser = a.id.startsWith('COMB-') ? 1 : 0;
            const bUser = b.id.startsWith('COMB-') ? 1 : 0;
            if (bUser !== aUser) return bUser - aUser;
            return orderWeight(b.ticketType) - orderWeight(a.ticketType);
          })
          .slice(0, 45);

        const nextCombines = ensurePositiveCombineBilan(sortedCombines, latestResults);

        try {
          localStorage.setItem(STORAGE_KEY_COMBINE_HISTORY, JSON.stringify(nextCombines));
        } catch {
          // ignore storage error
        }

        return nextCombines;
      });
    }

    if (typeof data.isRealTimeSynced === 'boolean') {
      setIsRealTimeSynced(data.isRealTimeSynced);
    }
    if (data.lastSyncTime) {
      setLastSyncTime(data.lastSyncTime);
    }
    if (typeof data.syncDurationMs === 'number') {
      setSyncDurationMs(data.syncDurationMs);
    }

    if (updatedMatches.length > 0 && (!customRoundLockedRef.current || !preserveSelection)) {
      const currentSel = selectedMatchRef.current;
      const targetMatch = preserveSelection && currentSel
        ? updatedMatches.find(
            m => m.id === currentSel.id || (m.homeTeam === currentSel.homeTeam && m.awayTeam === currentSel.awayTeam)
          ) || updatedMatches[0]
        : updatedMatches[0];
      setSelectedMatch(targetMatch);
      runPredictionForMatch(targetMatch, updatedTeams);
    }
  }, [runPredictionForMatch]);

  // Synchronize both Matches (8035/matches) and Ranking & Form (8035/ranking) from Bet261 via backend
  const handleSyncAll = useCallback(async (preserveSelection = false, silent = false) => {
    const now = Date.now();
    if (clientSyncInFlightRef.current) return;
    if (silent && now - lastClientSyncMsRef.current < 4500) return;
    if (!silent && now - lastClientSyncMsRef.current < 1200) return;

    if (!preserveSelection) {
      customRoundLockedRef.current = false;
    }
    if (!silent) {
      setIsSyncing(true);
    }
    clientSyncInFlightRef.current = true;
    lastClientSyncMsRef.current = now;

    try {
      const clientStart = performance.now();
      const res = await fetch(`/api/sync/all${!silent ? '?force=1' : ''}`);
      if (res.status === 429 || !res.ok) {
        // Back off for 10 seconds if rate-limited by proxy
        lastClientSyncMsRef.current = Date.now() + 5500;
        return;
      }
      const rawText = await res.text();
      if (!rawText || rawText.startsWith('Rate exceeded')) {
        lastClientSyncMsRef.current = Date.now() + 5500;
        return;
      }
      const data = JSON.parse(rawText);
      const roundTripMs = Math.max(1, Math.round(performance.now() - clientStart));
      applySyncPayload(
        {
          ...data,
          syncDurationMs: data.syncDurationMs || roundTripMs
        },
        preserveSelection
      );
    } catch (err) {
      if (!silent) {
        console.warn('Sync failed, regenerating local simulated fixtures:', err);
        const regenerated = generateInstantLeagueFixtures(teamsRef.current);
        setMatches(regenerated);
        setIsRealTimeSynced(false);
        const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(nowStr);
        if (regenerated.length > 0) {
          setSelectedMatch(regenerated[0]);
          runPredictionForMatch(regenerated[0], teamsRef.current);
        }
      }
    } finally {
      clientSyncInFlightRef.current = false;
      if (!silent) {
        setIsSyncing(false);
      }
    }
  }, [applySyncPayload, runPredictionForMatch]);

  // Load specific round from Bet261
  const handleSelectRound = async (roundId: number, eventCategoryId: number) => {
    setIsSyncing(true);
    customRoundLockedRef.current = true;
    try {
      const res = await fetch(`/api/sync/round/${roundId}?eventCategoryId=${eventCategoryId}`);
      if (!res.ok) return;
      const rawText = await res.text();
      if (!rawText || rawText.startsWith('Rate exceeded')) return;
      const data = JSON.parse(rawText);
      if (data.success && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        if (data.roundNumber) setActiveRoundNumber(data.roundNumber);
        setSelectedMatch(data.matches[0]);
        runPredictionForMatch(data.matches[0], teamsRef.current);
      }
    } catch (err) {
      console.warn('Failed to fetch specific round:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load history from localStorage and trigger initial live Bet261 sync
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
      const savedCombines = localStorage.getItem(STORAGE_KEY_COMBINE_HISTORY);
      if (savedCombines) {
        const parsedCombines = JSON.parse(savedCombines);
        if (Array.isArray(parsedCombines)) {
          setCombineHistory(ensurePositiveCombineBilan(parsedCombines, []));
        }
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }

    handleSyncAll(false, false);
  }, []);

  // Real-Time Server-Sent Events (SSE) + Rate-Limit Safe Fallback Polling
  useEffect(() => {
    if (!autoSyncEnabled) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/sync/stream');
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.success) {
            lastSseMessageMsRef.current = Date.now();
            lastClientSyncMsRef.current = Date.now();
            applySyncPayload(parsed, true);
          }
        } catch {
          // ignore parse error
        }
      };
      es.onerror = () => {
        // Close SSE stream on error to prevent rapid browser reconnect loops that trigger proxy rate limits
        if (es) {
          es.close();
          es = null;
        }
      };
    } catch {
      // Fallback to polling if EventSource is unavailable
    }

    const effectiveIntervalMs = Math.max(5000, syncSpeedSec * 1000);
    const interval = setInterval(() => {
      // Only poll via HTTP if SSE hasn't pushed a fresh update recently
      if (Date.now() - lastSseMessageMsRef.current >= effectiveIntervalMs - 500) {
        handleSyncAll(true, true);
      }
    }, effectiveIntervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleSyncAll(true, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (es) es.close();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [autoSyncEnabled, syncSpeedSec, handleSyncAll, applySyncPayload]);

  // Global live countdown & single-shot round-transition trigger
  const activeExpectedStartIso = matches[0]?.expectedStartIso || '';
  useEffect(() => {
    if (!activeExpectedStartIso) {
      setCountdownStr('');
      return;
    }

    const updateCountdown = () => {
      const diffSec = Math.floor((new Date(activeExpectedStartIso).getTime() - Date.now()) / 1000);
      if (diffSec > 0) {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        setCountdownStr(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else if (diffSec > -90) {
        setCountdownStr('EN DIRECT');
        if (triggeredZeroIsoRef.current !== activeExpectedStartIso && autoSyncEnabled) {
          triggeredZeroIsoRef.current = activeExpectedStartIso;
          handleSyncAll(true, true);
        }
      } else {
        setCountdownStr('Nouvelle J.');
        if (triggeredEndIsoRef.current !== activeExpectedStartIso && autoSyncEnabled) {
          triggeredEndIsoRef.current = activeExpectedStartIso;
          customRoundLockedRef.current = false;
          handleSyncAll(false, true);
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeExpectedStartIso, autoSyncEnabled, handleSyncAll]);

  // Save history to localStorage whenever updated
  const saveHistoryToStorage = (updatedHistory: PredictionResult[]) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  };

  // Handle OCR scan completion
  const handleCompleteScanAnalysis = (data: {
    homeTeamName: string;
    awayTeamName: string;
    homeTeamObj?: Team;
    awayTeamObj?: Team;
    odds: MatchOdds | null;
    homeRank?: number | null;
    awayRank?: number | null;
    homeFormStr?: string | null;
    awayFormStr?: string | null;
    matchId?: string;
  }) => {
    const pred = runVirtualAnalysis({
      homeTeamName: data.homeTeamName,
      awayTeamName: data.awayTeamName,
      homeTeamObj: data.homeTeamObj,
      awayTeamObj: data.awayTeamObj,
      homeRank: data.homeRank,
      awayRank: data.awayRank,
      homeFormStr: data.homeFormStr,
      awayFormStr: data.awayFormStr,
      odds: data.odds,
      matchId: data.matchId
    });

    setCurrentPrediction(pred);
    setActiveTab('dashboard');
    handleSavePrediction(pred);
  };

  // Handle Manual Form Submission
  const handleManualFormSubmit = (data: {
    homeTeamName: string;
    awayTeamName: string;
    homeTeamObj?: Team;
    awayTeamObj?: Team;
    homeRank?: number | null;
    awayRank?: number | null;
    homeFormStr?: string | null;
    awayFormStr?: string | null;
    odds: MatchOdds | null;
  }) => {
    const pred = runVirtualAnalysis({
      homeTeamName: data.homeTeamName,
      awayTeamName: data.awayTeamName,
      homeTeamObj: data.homeTeamObj,
      awayTeamObj: data.awayTeamObj,
      homeRank: data.homeRank,
      awayRank: data.awayRank,
      homeFormStr: data.homeFormStr,
      awayFormStr: data.awayFormStr,
      odds: data.odds
    });

    setCurrentPrediction(pred);
    setActiveTab('dashboard');
    handleSavePrediction(pred);
  };

  // Handle H2H analysis from ranking table
  const handleAnalyzeH2H = (homeTeam: Team, awayTeam: Team) => {
    // Check if there is a scheduled match between these two teams in the current round to include live odds
    const scheduledMatch = matches.find(
      m =>
        (m.homeTeam.toLowerCase() === homeTeam.name.toLowerCase() &&
          m.awayTeam.toLowerCase() === awayTeam.name.toLowerCase())
    );

    const pred = runVirtualAnalysis({
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamObj: homeTeam,
      awayTeamObj: awayTeam,
      homeRank: homeTeam.rank,
      awayRank: awayTeam.rank,
      homeFormStr: homeTeam.recentForm.join('-'),
      awayFormStr: awayTeam.recentForm.join('-'),
      odds: scheduledMatch?.odds,
      matchId: scheduledMatch?.matchNumber
    });

    setCurrentPrediction(pred);
    setActiveTab('dashboard');
  };

  // History Actions
  const handleSavePrediction = (pred: PredictionResult) => {
    setHistory((prev) => {
      if (prev.some(p => p.id === pred.id)) return prev;
      const updated = [pred, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Save history failed', e);
      }
      return updated;
    });
  };

  const handleUpdateActualResult = (id: string, result: '1' | 'X' | '2') => {
    const updated = history.map(item => {
      if (item.id === id) {
        return {
          ...item,
          actualResult: result,
          isCorrect: result === item.mostLikelyChoice
        };
      }
      return item;
    });
    saveHistoryToStorage(updated);

    if (currentPrediction && currentPrediction.id === id) {
      setCurrentPrediction(prev => prev ? {
        ...prev,
        actualResult: result,
        isCorrect: result === prev.mostLikelyChoice
      } : null);
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    saveHistoryToStorage(updated);
  };

  const handleClearHistory = () => {
    saveHistoryToStorage([]);
  };

  // Combiné History Actions
  const saveCombineHistoryToStorage = (updated: SavedCombineTicket[]) => {
    setCombineHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY_COMBINE_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save combine history', e);
    }
  };

  const handleSaveCombineTicket = (ticket: SavedCombineTicket) => {
    setCombineHistory(prev => {
      const reconciled = reconcileCombineTicketWithResults(ticket, recentResults).ticket;
      const filtered = prev.filter(item => item.id !== reconciled.id);
      const updated = [reconciled, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY_COMBINE_HISTORY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateCombineStatus = (ticketId: string, status: CombineStatus) => {
    setCombineHistory(prev => {
      const updated = prev.map(item => {
        if (item.id !== ticketId) return item;
        if (status === 'pending') {
          const resetTicket: SavedCombineTicket = {
            ...item,
            status: 'pending',
            manualOverride: false,
            selections: item.selections.map(s => ({
              ...s,
              status: 'pending',
              manualOverride: false
            }))
          };
          return autoMarkCombinesRef.current
            ? reconcileCombineTicketWithResults(resetTicket, recentResults, true).ticket
            : resetTicket;
        }
        return {
          ...item,
          status,
          manualOverride: true,
          selections: item.selections.map(s => ({
            ...s,
            status: status === 'won' ? 'won' : s.status === 'won' ? 'won' : 'lost',
            manualOverride: true
          }))
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_COMBINE_HISTORY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleToggleCombineSelectionStatus = (ticketId: string, selectionIndex: number) => {
    setCombineHistory(prev => {
      const updated = prev.map(item => {
        if (item.id !== ticketId) return item;
        const newSelections = item.selections.map((sel, idx) => {
          if (idx !== selectionIndex) return sel;
          const nextStatus: CombineStatus =
            sel.status === 'won' ? 'lost' : sel.status === 'lost' ? 'pending' : 'won';
          return {
            ...sel,
            status: nextStatus,
            manualOverride: nextStatus !== 'pending'
          };
        });
        const anyLost = newSelections.some(s => s.status === 'lost');
        const allWon = newSelections.length > 0 && newSelections.every(s => s.status === 'won');
        const newTicketStatus: CombineStatus = allWon ? 'won' : anyLost ? 'lost' : 'pending';
        return {
          ...item,
          selections: newSelections,
          status: newTicketStatus,
          manualOverride: newTicketStatus !== 'pending'
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_COMBINE_HISTORY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleToggleAutoMarkCombines = () => {
    setAutoMarkCombinesEnabled(prev => {
      const next = !prev;
      autoMarkCombinesRef.current = next;
      if (next) {
        setCombineHistory(curr => {
          const reconciled = curr.map(
            t => reconcileCombineTicketWithResults(t, recentResults, false).ticket
          );
          try {
            localStorage.setItem(STORAGE_KEY_COMBINE_HISTORY, JSON.stringify(reconciled));
          } catch {
            // ignore
          }
          return reconciled;
        });
      }
      return next;
    });
  };

  const handleDeleteCombineTicket = (ticketId: string) => {
    const updated = combineHistory.filter(c => c.id !== ticketId);
    saveCombineHistoryToStorage(updated);
  };

  const handleClearCombineHistory = () => {
    saveCombineHistoryToStorage([]);
  };

  const handleManualImportSubmit = async (text: string) => {
    try {
      const res = await fetch('/api/sync/manual-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text })
      });
      const data = await res.json();
      if (data.lastSyncTime) setLastSyncTime(data.lastSyncTime);
      handleSyncAll(false);
    } catch (e) {
      console.warn('Import failed', e);
    }
  };

  // Heartbeat to keep current user registered as "Utilisateur Actif" on server
  useEffect(() => {
    const sendHeartbeat = async () => {
      if (!currentUser) return;
      try {
        const res = await fetch('/api/vip/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.userId,
            userName: currentUser.userName,
            phone: currentUser.phone,
            currentTab: activeTab
          })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          try {
            localStorage.setItem(STORAGE_KEY_VIP_USER, JSON.stringify(data.user));
          } catch {
            // ignore
          }
          if (typeof data.activeUsersCount === 'number') {
            setActiveUsersCount(data.activeUsersCount);
          }
        }
      } catch {
        // ignore
      }
    };

    sendHeartbeat();
    const hbTimer = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(hbTimer);
  }, [currentUser?.userId, activeTab]);

  const handleUnlockAdmin = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        setIsAdminUnlocked(true);
        try {
          localStorage.setItem(STORAGE_KEY_ADMIN_UNLOCKED, 'true');
        } catch {
          // ignore
        }
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setCurrentUser(prev => {
      if (!prev) return prev;
      const lockedUser: ActiveUserRecord = {
        ...prev,
        planId: 'free',
        planLabel: 'Verrouillé (Code requis)',
        priceAriary: 0,
        expiresAt: undefined
      };
      try {
        localStorage.setItem(STORAGE_KEY_VIP_USER, JSON.stringify(lockedUser));
      } catch {
        // ignore
      }
      return lockedUser;
    });
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_UNLOCKED);
    } catch {
      // ignore
    }
    if (currentUser?.userId) {
      fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId, action: 'revoke' })
      }).catch(() => {});
    }
  };

  const handleRedeemVipCode = async (payload: {
    code: string;
    userName: string;
    phone: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/vip/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId,
          userName: payload.userName,
          phone: payload.phone,
          code: payload.code
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        try {
          localStorage.setItem(STORAGE_KEY_VIP_USER, JSON.stringify(data.user));
        } catch {
          // ignore
        }
        if (data.isAdmin) {
          setIsAdminUnlocked(true);
          try {
            localStorage.setItem(STORAGE_KEY_ADMIN_UNLOCKED, 'true');
          } catch {
            // ignore
          }
        }
        return { success: true, message: data.message };
      }
      return {
        success: false,
        message: data.message || "Code d'Accès VIP invalide."
      };
    } catch {
      return {
        success: false,
        message: 'Erreur de connexion au serveur lors de la vérification du code.'
      };
    }
  };

  const isAppUnlocked =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.planId === 'admin' ||
          currentUser.planId === 'vip1' ||
          currentUser.planId === 'vip2' ||
          currentUser.planId === 'vip3')
    );

  if (!isAppUnlocked) {
    return (
      <AppLockScreen
        currentUser={currentUser}
        activeUsersCount={activeUsersCount}
        onUnlockWithCode={handleRedeemVipCode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onQuickSync={() => handleSyncAll(false, false)}
        savedPredictionsCount={history.length + combineHistory.length}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={() => setAutoSyncEnabled(prev => !prev)}
        syncSpeedSec={syncSpeedSec}
        onChangeSyncSpeed={setSyncSpeedSec}
        activeRoundNumber={activeRoundNumber}
        countdownStr={countdownStr}
        syncDurationMs={syncDurationMs}
        isRealTimeSynced={isRealTimeSynced}
        currentVipPlan={currentUser?.planId || 'free'}
        activeUsersCount={activeUsersCount}
        onLockApp={handleLockAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            onOpenScanner={() => setActiveTab('scan')}
            onOpenSync={() => {
              handleSyncAll(false, false);
              setActiveTab('sync');
            }}
            onOpenRanking={() => {
              handleSyncAll(true, false);
              setActiveTab('ranking');
            }}
            currentPrediction={currentPrediction}
            onTriggerAnalysis={() => {
              if (selectedMatch) {
                runPredictionForMatch(selectedMatch, teams);
              } else if (matches[0]) {
                runPredictionForMatch(matches[0], teams);
              }
            }}
            selectedMatch={selectedMatch}
            onSelectMatch={(m) => {
              setSelectedMatch(m);
              runPredictionForMatch(m, teams);
            }}
            matches={matches}
            teams={teams}
            onSavePrediction={handleSavePrediction}
            onUpdateActualResult={handleUpdateActualResult}
            recentResults={recentResults}
            combineHistory={combineHistory}
            autoMarkCombinesEnabled={autoMarkCombinesEnabled}
            onToggleAutoMarkCombines={handleToggleAutoMarkCombines}
            onSaveCombineTicket={handleSaveCombineTicket}
            onUpdateCombineStatus={handleUpdateCombineStatus}
            onToggleCombineSelectionStatus={handleToggleCombineSelectionStatus}
            onDeleteCombineTicket={handleDeleteCombineTicket}
            onOpenFullHistory={() => setActiveTab('history')}
          />
        )}

        {/* Tab 2: Scanner Capture (Modules 1 & 6) */}
        {activeTab === 'scan' && (
          <ImageScannerModal
            teams={teams}
            onCompleteAnalysis={handleCompleteScanAnalysis}
            onClose={() => setActiveTab('dashboard')}
          />
        )}

        {/* Tab 3: Matchs Sync (Module 2) */}
        {activeTab === 'sync' && (
          <MatchesSyncView
            matches={matches}
            teams={teams}
            rounds={rounds}
            recentResults={recentResults}
            activeRoundNumber={activeRoundNumber}
            isRealTimeSynced={isRealTimeSynced}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            syncDurationMs={syncDurationMs}
            autoSyncEnabled={autoSyncEnabled}
            onToggleAutoSync={() => setAutoSyncEnabled(prev => !prev)}
            syncSpeedSec={syncSpeedSec}
            onChangeSyncSpeed={setSyncSpeedSec}
            onSync={() => handleSyncAll(false, false)}
            onSelectRound={handleSelectRound}
            onSelectMatchToAnalyze={(m) => {
              setSelectedMatch(m);
              runPredictionForMatch(m, teams);
              setActiveTab('dashboard');
            }}
            onManualImportSubmit={handleManualImportSubmit}
            combineHistory={combineHistory}
            autoMarkCombinesEnabled={autoMarkCombinesEnabled}
            onToggleAutoMarkCombines={handleToggleAutoMarkCombines}
            onSaveCombineTicket={handleSaveCombineTicket}
            onUpdateCombineStatus={handleUpdateCombineStatus}
            onToggleCombineSelectionStatus={handleToggleCombineSelectionStatus}
            onDeleteCombineTicket={handleDeleteCombineTicket}
            onOpenFullHistory={() => setActiveTab('history')}
          />
        )}

        {/* Tab 4: Classement & Forme (Module 3) */}
        {activeTab === 'ranking' && (
          <RankingView
            teams={teams}
            lastSyncTime={lastSyncTime}
            isSyncing={isSyncing}
            isRealTimeSynced={isRealTimeSynced}
            activeRoundNumber={activeRoundNumber}
            onSyncRanking={() => handleSyncAll(true)}
            onAnalyzeH2H={handleAnalyzeH2H}
          />
        )}

        {/* Tab 5: Saisie Manuelle (Module 7) */}
        {activeTab === 'manual' && (
          <ManualEntryForm
            teams={teams}
            onSubmitAnalysis={handleManualFormSubmit}
          />
        )}

        {/* Tab 6: Historique & Performance du Modèle (Module 8) */}
        {activeTab === 'history' && (
          <HistoryAndStatsView
            history={history}
            combineHistory={combineHistory}
            autoMarkCombinesEnabled={autoMarkCombinesEnabled}
            onToggleAutoMarkCombines={handleToggleAutoMarkCombines}
            onUpdateActualResult={handleUpdateActualResult}
            onUpdateCombineStatus={handleUpdateCombineStatus}
            onToggleCombineSelectionStatus={handleToggleCombineSelectionStatus}
            onDeleteCombineTicket={handleDeleteCombineTicket}
            onClearCombineHistory={handleClearCombineHistory}
            onDeleteEntry={handleDeleteHistoryEntry}
            onClearHistory={handleClearHistory}
            onImportHistory={(imported) => saveHistoryToStorage(imported)}
            onSelectPrediction={(p) => {
              setCurrentPrediction(p);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* Tab 7 & 8: Espace VIP (5.000Ar / 10.000Ar / 15.000Ar) & Panel Admin */}
        {(activeTab === 'vip' || activeTab === 'admin') && (
          <VipAndAdminView
            key={activeTab}
            currentUser={currentUser}
            isAdminUnlocked={isAdminUnlocked}
            adminCodeInput=""
            onUnlockAdmin={handleUnlockAdmin}
            onLockAdmin={handleLockAdmin}
            onRedeemVipCode={handleRedeemVipCode}
            initialMode={activeTab === 'admin' ? 'admin' : 'vip'}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#060911] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-400">VIRTUAL PREDICTOR SCAN</span> • INSTANT LEAGUE 8035 • BET261
          </div>
          <div className="text-[11px] text-slate-600">
            Outil statistique d'aide à la décision • Générateur probabiliste indépendant • Jouez avec modération
          </div>
        </div>
      </footer>
    </div>
  );
}
