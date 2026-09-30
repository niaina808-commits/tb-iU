export type FormResult = 'V' | 'N' | 'D';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  code: string;
  aliases: string[];
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  recentForm: FormResult[];
  homeRecord?: { won: number; drawn: number; lost: number };
  awayRecord?: { won: number; drawn: number; lost: number };
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
  halfTimeHome?: number;
  halfTimeDraw?: number;
  halfTimeAway?: number;
  doubleChance1X?: number;
  doubleChanceX2?: number;
  doubleChance12?: number;
  // GG / NG (betTypeId: 30091)
  bttsYes?: number;
  bttsNo?: number;
  // Plus / Moins (betTypeId: 30087)
  over15?: number;
  under15?: number;
  over25?: number;
  under25?: number;
  over35?: number;
  under35?: number;
  // Score exact (betTypeId: 30081) e.g. { "1-0": 7.5, "2-1": 8.2 }
  exactScores?: Record<string, number>;
  // Total de buts exact (betTypeId: 30090) e.g. { "0": 14.8, "1": 6.5, "2": 3.8, "3": 3.4, "4": 4.7, "5": 8.9, "6": 35.4 }
  totalGoalsExact?: Record<string, number>;
  // Multi-Buts (betTypeId: 30102)
  multiGoals0to2?: number;
  multiGoals1to3?: number;
  multiGoals2to4?: number;
  multiGoals4Plus?: number;
}

export interface ExactScorePrediction {
  rank: number;
  score: string;
  probability: number;
  normalizedProb: number;
  odds?: number;
  label: string;
  outcome?: '1' | 'X' | '2';
}

export interface TotalGoalsPrediction {
  expectedGoals: number;
  mostLikelyRange: string;
  mostLikelyRangeProb: number;
  mostLikelyRangeOdds?: number;
  mostLikelyExactGoals: string;
  mostLikelyExactProb: number;
  mostLikelyExactOdds?: number;
  exactDistribution: Array<{
    goals: string;
    probability: number;
    odds?: number;
  }>;
  multiGoalsRanges: Array<{
    range: string;
    probability: number;
    odds?: number;
  }>;
}

export interface OverUnderLinePrediction {
  line: '1.5' | '2.5' | '3.5';
  probOver: number;
  probUnder: number;
  oddsOver?: number;
  oddsUnder?: number;
  pick: string;
  recommendedProb: number;
}

export interface OverUnderPrediction {
  mainPick: string;
  mainPickProb: number;
  mainPickOdds?: number;
  over25Prob: number;
  under25Prob: number;
  lines: {
    line15: OverUnderLinePrediction;
    line25: OverUnderLinePrediction;
    line35: OverUnderLinePrediction;
  };
}

export interface GgNgPrediction {
  probGG: number;
  probNG: number;
  recommended: 'GG' | 'NG';
  recommendedLabel: string;
  oddsGG?: number;
  oddsNG?: number;
}

export interface VirtualRoundSummary {
  id: number;
  roundNumber: number;
  expectedStart: string;
  scheduledTime: string;
  eventCategoryId: number;
  matchesCount?: number;
}

export interface VirtualMatchResult {
  id: string;
  roundNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  score: string;
  halfTimeScore?: string;
  outcome: '1' | 'X' | '2';
  expectedStart?: string;
}

export interface VirtualMatch {
  id: string;
  matchNumber: string;
  homeTeam: string;
  awayTeam: string;
  scheduledTime: string;
  expectedStartIso?: string;
  status: 'scheduled' | 'live' | 'finished';
  odds?: MatchOdds;
  round?: number;
  roundId?: number;
  eventCategoryId?: number;
  isSynced: boolean;
  isLiveApi?: boolean;
  source: 'synced' | 'scanned' | 'manual';
  lastSyncTime?: string;
  actualResult?: '1' | 'X' | '2';
  actualScore?: string;
}

export interface OCRScanResult {
  homeTeamName: string;
  awayTeamName: string;
  odds1?: number | null;
  oddsX?: number | null;
  odds2?: number | null;
  matchTime?: string;
  matchId?: string;
  homeRank?: number | null;
  awayRank?: number | null;
  homeForm?: string;
  awayForm?: string;
  confidenceScores: Record<string, number>;
  needsConfirmation: Record<string, boolean>;
  rawExtractedText?: string;
}

export interface AnalysisFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  score: number;
}

export interface PredictionResult {
  id: string;
  matchId?: string;
  timestamp: string;
  homeTeam: string;
  awayTeam: string;
  prob1: number;
  probX: number;
  prob2: number;
  mostLikelyChoice: '1' | 'X' | '2';
  confidenceIndex: 'faible' | 'moyen' | 'élevé';
  // New markets requested by user: Top 2 score exact, Total Nombre de Buts, Plus ou Moins, GG/NG
  topExactScores: ExactScorePrediction[];
  totalGoals: TotalGoalsPrediction;
  overUnder: OverUnderPrediction;
  ggNg: GgNgPrediction;
  usedData: string[];
  missingData: string[];
  factors: AnalysisFactor[];
  actualResult?: '1' | 'X' | '2';
  isCorrect?: boolean;
  notes?: string;
  odds?: MatchOdds;
}

export interface ModelPerformanceStats {
  total: number;
  evaluated: number;
  correct: number;
  accuracyPercent: number;
  byChoice: {
    '1': { total: number; correct: number; rate: number };
    'X': { total: number; correct: number; rate: number };
    '2': { total: number; correct: number; rate: number };
  };
  byConfidence: {
    'faible': { total: number; correct: number; rate: number };
    'moyen': { total: number; correct: number; rate: number };
    'élevé': { total: number; correct: number; rate: number };
  };
}

export type CombineStatus = 'pending' | 'won' | 'lost';

export interface SavedCombineSelection {
  matchId: string;
  matchNumber: string;
  roundNumber: number;
  homeTeam: string;
  awayTeam: string;
  marketLabel: string;
  pickLabel: string;
  pickCode: string;
  odds: number;
  probability: number;
  status: CombineStatus;
  actualScore?: string;
  manualOverride?: boolean;
}

export interface SavedCombineTicket {
  id: string;
  createdAt: string;
  roundNumber: number;
  seasonId?: number;
  ticketType: 'safe' | 'value' | 'jackpot';
  title: string;
  selections: SavedCombineSelection[];
  totalOdds: number;
  confidenceScore: number;
  stakeAriary: number;
  potentialWinAriary: number;
  status: CombineStatus;
  manualOverride?: boolean;
}

export type VipPlanId = 'free' | 'vip1' | 'vip2' | 'vip3' | 'admin';

export interface VipPlanOffer {
  id: 'vip1' | 'vip2' | 'vip3';
  name: string;
  durationLabel: string;
  durationDays: number;
  priceAriary: number;
  priceFormatted: string;
  badge: string;
  features: string[];
}

export interface VipAccessCode {
  code: string;
  planId: 'vip1' | 'vip2' | 'vip3';
  planLabel: string;
  durationDays: number;
  priceAriary: number;
  createdAt: string;
  note?: string;
  isUsed: boolean;
  usedByUserName?: string;
  usedByPhone?: string;
  usedAt?: string;
  expiresAt?: string;
}

export interface ActiveUserRecord {
  userId: string;
  userName: string;
  phone: string;
  planId: VipPlanId;
  planLabel: string;
  priceAriary: number;
  accessCodeUsed?: string;
  activatedAt?: string;
  expiresAt?: string;
  lastSeenAt: string;
  lastSeenEpochMs: number;
  isOnline: boolean;
  currentTab?: string;
  deviceInfo?: string;
}

export interface VipSubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  planId: 'vip1' | 'vip2' | 'vip3';
  planLabel: string;
  priceAriary: number;
  paymentRef: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedCode?: string;
}

