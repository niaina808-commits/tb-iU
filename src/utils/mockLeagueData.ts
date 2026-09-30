import { Team, VirtualMatch, FormResult } from '../types/league';

export const INITIAL_TEAMS_8035: Team[] = [
  {
    id: 'mci',
    name: 'Manchester Blue',
    shortName: 'Man Blue',
    code: 'MNC',
    aliases: ['manchester blue', 'manchester city', 'man city', 'mnc', 'mc', 'man blue'],
    rank: 1,
    played: 12,
    won: 9,
    drawn: 2,
    lost: 1,
    points: 29,
    goalsFor: 28,
    goalsAgainst: 9,
    goalDiff: 19,
    recentForm: ['V', 'V', 'N', 'V', 'V'],
    homeRecord: { won: 5, drawn: 1, lost: 0 },
    awayRecord: { won: 4, drawn: 1, lost: 1 }
  },
  {
    id: 'liv',
    name: 'Liverpool',
    shortName: 'Liverpool',
    code: 'LIV',
    aliases: ['liverpool', 'liv', 'lfc', 'reds'],
    rank: 2,
    played: 12,
    won: 8,
    drawn: 3,
    lost: 1,
    points: 27,
    goalsFor: 25,
    goalsAgainst: 10,
    goalDiff: 15,
    recentForm: ['V', 'V', 'N', 'V', 'V'],
    homeRecord: { won: 5, drawn: 1, lost: 0 },
    awayRecord: { won: 3, drawn: 2, lost: 1 }
  },
  {
    id: 'ars',
    name: 'London Reds',
    shortName: 'London Reds',
    code: 'ARS',
    aliases: ['london reds', 'london red', 'arsenal', 'ars', 'gunners', 'london r'],
    rank: 3,
    played: 12,
    won: 8,
    drawn: 2,
    lost: 2,
    points: 26,
    goalsFor: 24,
    goalsAgainst: 11,
    goalDiff: 13,
    recentForm: ['V', 'N', 'V', 'V', 'D'],
    homeRecord: { won: 5, drawn: 1, lost: 0 },
    awayRecord: { won: 3, drawn: 1, lost: 2 }
  },
  {
    id: 'tot',
    name: 'Spurs',
    shortName: 'Spurs',
    code: 'TOT',
    aliases: ['spurs', 'london white', 'tottenham', 'tot', 'london w', 'tottenham hotspur'],
    rank: 4,
    played: 12,
    won: 7,
    drawn: 3,
    lost: 2,
    points: 24,
    goalsFor: 22,
    goalsAgainst: 13,
    goalDiff: 9,
    recentForm: ['V', 'V', 'V', 'N', 'V'],
    homeRecord: { won: 4, drawn: 2, lost: 0 },
    awayRecord: { won: 3, drawn: 1, lost: 2 }
  },
  {
    id: 'mun',
    name: 'Manchester Red',
    shortName: 'Man Red',
    code: 'MUN',
    aliases: ['manchester red', 'manchester united', 'man utd', 'mun', 'mu', 'man red'],
    rank: 5,
    played: 12,
    won: 7,
    drawn: 2,
    lost: 3,
    points: 23,
    goalsFor: 20,
    goalsAgainst: 14,
    goalDiff: 6,
    recentForm: ['V', 'N', 'D', 'V', 'V'],
    homeRecord: { won: 4, drawn: 1, lost: 1 },
    awayRecord: { won: 3, drawn: 1, lost: 2 }
  },
  {
    id: 'ast',
    name: 'A. Villa',
    shortName: 'A. Villa',
    code: 'AVL',
    aliases: ['a. villa', 'a villa', 'aston villa', 'birmingham', 'villa', 'avl', 'bir'],
    rank: 6,
    played: 12,
    won: 6,
    drawn: 3,
    lost: 3,
    points: 21,
    goalsFor: 19,
    goalsAgainst: 14,
    goalDiff: 5,
    recentForm: ['D', 'V', 'V', 'N', 'V'],
    homeRecord: { won: 4, drawn: 1, lost: 1 },
    awayRecord: { won: 2, drawn: 2, lost: 2 }
  },
  {
    id: 'che',
    name: 'London Blues',
    shortName: 'London Blues',
    code: 'CHE',
    aliases: ['london blues', 'london blue', 'chelsea', 'che', 'blues', 'cfc', 'london b'],
    rank: 7,
    played: 12,
    won: 6,
    drawn: 2,
    lost: 4,
    points: 20,
    goalsFor: 19,
    goalsAgainst: 15,
    goalDiff: 4,
    recentForm: ['N', 'V', 'V', 'D', 'N'],
    homeRecord: { won: 4, drawn: 1, lost: 1 },
    awayRecord: { won: 2, drawn: 1, lost: 3 }
  },
  {
    id: 'new',
    name: 'Newcastle',
    shortName: 'Newcastle',
    code: 'NEW',
    aliases: ['newcastle', 'newcastle united', 'new', 'magpies', 'nufc'],
    rank: 8,
    played: 12,
    won: 6,
    drawn: 2,
    lost: 4,
    points: 20,
    goalsFor: 18,
    goalsAgainst: 15,
    goalDiff: 3,
    recentForm: ['D', 'V', 'V', 'D', 'V'],
    homeRecord: { won: 4, drawn: 1, lost: 1 },
    awayRecord: { won: 2, drawn: 1, lost: 3 }
  },
  {
    id: 'bou',
    name: 'Bournemouth',
    shortName: 'Bournemouth',
    code: 'BOU',
    aliases: ['bournemouth', 'cherries', 'bou', 'afc bournemouth'],
    rank: 9,
    played: 12,
    won: 5,
    drawn: 3,
    lost: 4,
    points: 18,
    goalsFor: 16,
    goalsAgainst: 15,
    goalDiff: 1,
    recentForm: ['V', 'D', 'V', 'N', 'V'],
    homeRecord: { won: 3, drawn: 2, lost: 1 },
    awayRecord: { won: 2, drawn: 1, lost: 3 }
  },
  {
    id: 'bha',
    name: 'Brighton',
    shortName: 'Brighton',
    code: 'BHA',
    aliases: ['brighton', 'seagulls', 'bha', 'brighton & hove'],
    rank: 10,
    played: 12,
    won: 5,
    drawn: 3,
    lost: 4,
    points: 18,
    goalsFor: 17,
    goalsAgainst: 16,
    goalDiff: 1,
    recentForm: ['V', 'N', 'D', 'V', 'N'],
    homeRecord: { won: 3, drawn: 2, lost: 1 },
    awayRecord: { won: 2, drawn: 1, lost: 3 }
  },
  {
    id: 'eve',
    name: 'Everton',
    shortName: 'Everton',
    code: 'EVE',
    aliases: ['everton', 'toffees', 'eve'],
    rank: 11,
    played: 12,
    won: 5,
    drawn: 2,
    lost: 5,
    points: 17,
    goalsFor: 15,
    goalsAgainst: 16,
    goalDiff: -1,
    recentForm: ['V', 'V', 'D', 'N', 'V'],
    homeRecord: { won: 3, drawn: 1, lost: 2 },
    awayRecord: { won: 2, drawn: 1, lost: 3 }
  },
  {
    id: 'wol',
    name: 'Wolverhampton',
    shortName: 'Wolves',
    code: 'WOL',
    aliases: ['wolverhampton', 'wolves', 'wol'],
    rank: 12,
    played: 12,
    won: 4,
    drawn: 4,
    lost: 4,
    points: 16,
    goalsFor: 14,
    goalsAgainst: 15,
    goalDiff: -1,
    recentForm: ['N', 'N', 'V', 'D', 'V'],
    homeRecord: { won: 3, drawn: 2, lost: 1 },
    awayRecord: { won: 1, drawn: 2, lost: 3 }
  },
  {
    id: 'nfo',
    name: 'N. Forest',
    shortName: 'N. Forest',
    code: 'NFO',
    aliases: ['n. forest', 'n forest', 'nottingham', 'forest', 'nottingham forest', 'nfo'],
    rank: 13,
    played: 12,
    won: 4,
    drawn: 3,
    lost: 5,
    points: 15,
    goalsFor: 14,
    goalsAgainst: 16,
    goalDiff: -2,
    recentForm: ['V', 'N', 'D', 'V', 'D'],
    homeRecord: { won: 3, drawn: 1, lost: 2 },
    awayRecord: { won: 1, drawn: 2, lost: 3 }
  },
  {
    id: 'cry',
    name: 'C. Palace',
    shortName: 'C. Palace',
    code: 'CRY',
    aliases: ['c. palace', 'c palace', 'crystal palace', 'palace', 'cry'],
    rank: 14,
    played: 12,
    won: 4,
    drawn: 3,
    lost: 5,
    points: 15,
    goalsFor: 13,
    goalsAgainst: 16,
    goalDiff: -3,
    recentForm: ['V', 'N', 'D', 'N', 'D'],
    homeRecord: { won: 2, drawn: 2, lost: 2 },
    awayRecord: { won: 2, drawn: 1, lost: 3 }
  },
  {
    id: 'lee',
    name: 'Leeds',
    shortName: 'Leeds',
    code: 'LEE',
    aliases: ['leeds', 'leeds united', 'lee', 'lufc'],
    rank: 15,
    played: 12,
    won: 4,
    drawn: 2,
    lost: 6,
    points: 14,
    goalsFor: 14,
    goalsAgainst: 18,
    goalDiff: -4,
    recentForm: ['D', 'N', 'V', 'D', 'V'],
    homeRecord: { won: 3, drawn: 1, lost: 2 },
    awayRecord: { won: 1, drawn: 1, lost: 4 }
  },
  {
    id: 'ful',
    name: 'Fulham',
    shortName: 'Fulham',
    code: 'FUL',
    aliases: ['fulham', 'cottagers', 'ful'],
    rank: 16,
    played: 12,
    won: 3,
    drawn: 3,
    lost: 6,
    points: 12,
    goalsFor: 12,
    goalsAgainst: 18,
    goalDiff: -6,
    recentForm: ['D', 'V', 'D', 'N', 'D'],
    homeRecord: { won: 2, drawn: 2, lost: 2 },
    awayRecord: { won: 1, drawn: 1, lost: 4 }
  },
  {
    id: 'bre',
    name: 'Brentford',
    shortName: 'Brentford',
    code: 'BRE',
    aliases: ['brentford', 'bees', 'bre'],
    rank: 17,
    played: 12,
    won: 3,
    drawn: 2,
    lost: 7,
    points: 11,
    goalsFor: 11,
    goalsAgainst: 19,
    goalDiff: -8,
    recentForm: ['D', 'N', 'D', 'D', 'V'],
    homeRecord: { won: 2, drawn: 1, lost: 3 },
    awayRecord: { won: 1, drawn: 1, lost: 4 }
  },
  {
    id: 'whu',
    name: 'West Ham',
    shortName: 'West Ham',
    code: 'WHU',
    aliases: ['west ham', 'west ham united', 'hammers', 'whu'],
    rank: 18,
    played: 12,
    won: 2,
    drawn: 3,
    lost: 7,
    points: 9,
    goalsFor: 10,
    goalsAgainst: 20,
    goalDiff: -10,
    recentForm: ['D', 'D', 'D', 'N', 'V'],
    homeRecord: { won: 2, drawn: 1, lost: 3 },
    awayRecord: { won: 0, drawn: 2, lost: 4 }
  },
  {
    id: 'sun',
    name: 'Sunderland',
    shortName: 'Sunderland',
    code: 'SUN',
    aliases: ['sunderland', 'black cats', 'sun', 'southampton', 'sou'],
    rank: 19,
    played: 12,
    won: 2,
    drawn: 2,
    lost: 8,
    points: 8,
    goalsFor: 9,
    goalsAgainst: 22,
    goalDiff: -13,
    recentForm: ['D', 'D', 'D', 'N', 'D'],
    homeRecord: { won: 1, drawn: 2, lost: 3 },
    awayRecord: { won: 1, drawn: 0, lost: 5 }
  },
  {
    id: 'bur',
    name: 'Burnley',
    shortName: 'Burnley',
    code: 'BUR',
    aliases: ['burnley', 'clarets', 'bur', 'ipswich', 'ips', 'leicester', 'lei'],
    rank: 20,
    played: 12,
    won: 1,
    drawn: 3,
    lost: 8,
    points: 6,
    goalsFor: 8,
    goalsAgainst: 23,
    goalDiff: -15,
    recentForm: ['D', 'D', 'D', 'N', 'D'],
    homeRecord: { won: 1, drawn: 2, lost: 3 },
    awayRecord: { won: 0, drawn: 1, lost: 5 }
  }
];

export function findTeamByName(query: string, teams: Team[] = INITIAL_TEAMS_8035): Team | undefined {
  if (!query) return undefined;
  const rawLower = query.trim().toLowerCase();
  const clean = rawLower.replace(/[^a-z0-9]/g, '');

  // 1. Exact match on name, shortName, ID or Code
  const byExact = teams.find(t =>
    t.name.toLowerCase() === rawLower ||
    t.shortName.toLowerCase() === rawLower ||
    t.id.toLowerCase() === clean ||
    t.code.toLowerCase() === clean
  );
  if (byExact) return byExact;

  // 2. Exact match on aliases
  const byAlias = teams.find(t =>
    t.aliases.some(a => a.replace(/[^a-z0-9]/g, '') === clean)
  );
  if (byAlias) return byAlias;

  // 3. Partial substring match
  const bySub = teams.find(t => {
    const cleanName = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanShort = t.shortName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanName.includes(clean) || clean.includes(cleanName) ||
           cleanShort.includes(clean) || clean.includes(cleanShort) ||
           t.aliases.some(a => {
             const ca = a.replace(/[^a-z0-9]/g, '');
             return ca.length >= 4 && (ca.includes(clean) || clean.includes(ca));
           });
  });
  if (bySub) return bySub;

  // 4. Word boundary check
  const words = rawLower.split(/\s+/);
  for (const w of words) {
    const cw = w.replace(/[^a-z0-9]/g, '');
    if (cw.length >= 3 && cw !== 'london' && cw !== 'manchester') {
      const match = teams.find(t =>
        t.aliases.some(a => a.toLowerCase().includes(cw)) ||
        t.name.toLowerCase().includes(cw)
      );
      if (match) return match;
    }
  }

  return undefined;
}

// Convert Bet261 history item ("Won", "Draw", "Lost") to FormResult ('V' | 'N' | 'D')
export function mapBet261HistoryToForm(history?: string[]): FormResult[] {
  if (!Array.isArray(history) || history.length === 0) return [];
  return history.map((h) => {
    const lower = String(h).toLowerCase();
    if (lower.startsWith('w') || lower.startsWith('v')) return 'V';
    if (lower.startsWith('d') || lower.startsWith('n')) return 'N';
    return 'D';
  });
}

// Generate fallback Instant League fixtures based on current teams if offline
export function generateInstantLeagueFixtures(teams: Team[] = INITIAL_TEAMS_8035): VirtualMatch[] {
  const now = new Date();
  const matches: VirtualMatch[] = [];

  const pairings: [number, number][] = [
    [0, 5],   // 1 vs 6
    [1, 6],   // 2 vs 7
    [2, 7],   // 3 vs 8
    [3, 4],   // 4 vs 5
    [8, 11],  // 9 vs 12
    [9, 10],  // 10 vs 11
    [12, 15], // 13 vs 16
    [13, 14], // 14 vs 15
    [16, 17], // 17 vs 18
    [18, 19], // 19 vs 20
  ];

  const matchTime = new Date(now.getTime() + 90 * 1000);
  const timeStr = matchTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  pairings.forEach((pair, index) => {
    const home = teams[pair[0]] || teams[0];
    const away = teams[pair[1]] || teams[1];

    const rankDiff = away.rank - home.rank;
    let rawHomeP = 0.44 + (rankDiff * 0.022);
    let rawAwayP = 0.28 - (rankDiff * 0.018);
    rawHomeP = Math.max(0.18, Math.min(0.72, rawHomeP));
    rawAwayP = Math.max(0.12, Math.min(0.62, rawAwayP));
    let rawDrawP = 1 - rawHomeP - rawAwayP;
    if (rawDrawP < 0.15) {
      rawDrawP = 0.18;
      const factor = (1 - rawDrawP) / (rawHomeP + rawAwayP);
      rawHomeP *= factor;
      rawAwayP *= factor;
    }

    const margin = 1.08;
    const o1 = Number((1 / (rawHomeP * margin)).toFixed(2));
    const ox = Number((1 / (rawDrawP * margin)).toFixed(2));
    const o2 = Number((1 / (rawAwayP * margin)).toFixed(2));

    matches.push({
      id: `IL8035-${1000 + index}`,
      matchNumber: `#8035-${String(index + 1).padStart(2, '0')}`,
      homeTeam: home.name,
      awayTeam: away.name,
      scheduledTime: timeStr,
      expectedStartIso: matchTime.toISOString(),
      status: 'scheduled',
      round: (home.played || 0) + 1,
      isSynced: true,
      isLiveApi: false,
      source: 'synced',
      lastSyncTime: new Date().toLocaleTimeString('fr-FR'),
      odds: {
        home: o1,
        draw: ox,
        away: o2,
        over15: 1.28,
        under15: 3.45,
        over25: 1.88,
        under25: 1.85,
        over35: 3.10,
        under35: 1.33,
        bttsYes: 1.76,
        bttsNo: 1.96,
        multiGoals0to2: 1.85,
        multiGoals1to3: 1.42,
        multiGoals2to4: 1.55,
        multiGoals4Plus: 3.15
      }
    });
  });

  return matches;
}
