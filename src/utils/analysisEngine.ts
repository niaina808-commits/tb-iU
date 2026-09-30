import {
  Team,
  MatchOdds,
  PredictionResult,
  AnalysisFactor,
  FormResult,
  VirtualMatchResult,
  ExactScorePrediction,
  TotalGoalsPrediction,
  OverUnderPrediction,
  OverUnderLinePrediction,
  GgNgPrediction
} from '../types/league';

export interface AnalysisInput {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamObj?: Team;
  awayTeamObj?: Team;
  homeRank?: number | null;
  awayRank?: number | null;
  homeFormStr?: string | null;
  awayFormStr?: string | null;
  odds?: MatchOdds | null;
  matchId?: string;
  recentResults?: VirtualMatchResult[];
}

// Convert form string like "V,V,N,D,V" or "W,W,D,L,W" to array
export function parseFormString(form?: string | null): FormResult[] {
  if (!form) return [];
  const clean = form.toUpperCase().replace(/[^VNDWL]/g, '');
  const res: FormResult[] = [];
  for (const char of clean) {
    if (char === 'V' || char === 'W') res.push('V');
    else if (char === 'N' || char === 'D') {
      if (clean.includes('W') || clean.includes('L')) {
        res.push(char === 'D' ? 'N' : 'D');
      } else {
        res.push(char === 'N' ? 'N' : 'D');
      }
    } else if (char === 'L') {
      res.push('D');
    }
  }
  return res.slice(-5);
}

// Form score: weights recent games more heavily: [g1, g2, g3, g4, g5] (g5 = most recent)
export function calculateFormPoints(form: FormResult[]): number {
  if (form.length === 0) return 7.5;
  const weights = [1, 1.2, 1.4, 1.7, 2.0].slice(-form.length);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let weightedSum = 0;
  form.forEach((f, idx) => {
    const pts = f === 'V' ? 3 : f === 'N' ? 1 : 0;
    weightedSum += pts * weights[idx];
  });

  return (weightedSum / totalWeight) * 5;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function blendTwoWay(modelP1: number, odds1?: number, odds2?: number): [number, number] {
  const m1 = Math.max(0.02, Math.min(0.98, modelP1));
  const m2 = 1 - m1;
  if (odds1 && odds2 && odds1 > 1.01 && odds2 > 1.01) {
    const inv1 = 1 / odds1;
    const inv2 = 1 / odds2;
    const sum = inv1 + inv2;
    const o1 = inv1 / sum;
    const o2 = inv2 / sum;
    const b1 = m1 * 0.45 + o1 * 0.55;
    const b2 = m2 * 0.45 + o2 * 0.55;
    const p1 = Number(((b1 / (b1 + b2)) * 100).toFixed(1));
    const p2 = Number((100 - p1).toFixed(1));
    return [p1, p2];
  }
  const p1 = Number((m1 * 100).toFixed(1));
  const p2 = Number((100 - p1).toFixed(1));
  return [p1, p2];
}

export function runVirtualAnalysis(input: AnalysisInput): PredictionResult {
  const usedData: string[] = [];
  const missingData: string[] = [];
  const factors: AnalysisFactor[] = [];

  const homeRank = input.homeRank ?? input.homeTeamObj?.rank ?? null;
  const awayRank = input.awayRank ?? input.awayTeamObj?.rank ?? null;

  const homeForm = input.homeFormStr ? parseFormString(input.homeFormStr) : (input.homeTeamObj?.recentForm || []);
  const awayForm = input.awayFormStr ? parseFormString(input.awayFormStr) : (input.awayTeamObj?.recentForm || []);

  const odds = input.odds;

  // Track data usage
  if (homeRank !== null && awayRank !== null) {
    const hPts = input.homeTeamObj ? ` (${input.homeTeamObj.points} pts)` : '';
    const aPts = input.awayTeamObj ? ` (${input.awayTeamObj.points} pts)` : '';
    usedData.push(`Classement & Rang Bet261 (${homeRank}e${hPts} vs ${awayRank}e${aPts})`);
  } else {
    missingData.push('Rang/Classement exact non disponible');
  }

  if (homeForm.length > 0 && awayForm.length > 0) {
    usedData.push(`Forme récente 8035 (${homeForm.join('-')} vs ${awayForm.join('-')})`);
  } else {
    missingData.push('Historique forme récente incomplet');
  }

  if (odds && odds.home > 1 && odds.draw > 1 && odds.away > 1) {
    usedData.push(`Cotes 1X2 Bet261 (${odds.home.toFixed(2)} / ${odds.draw.toFixed(2)} / ${odds.away.toFixed(2)})`);
    if (odds.over25 && odds.under25) {
      usedData.push(`Cotes +/- 2.5 (${odds.over25.toFixed(2)} / ${odds.under25.toFixed(2)}) & GG/NG (${odds.bttsYes?.toFixed(2) ?? '-'} / ${odds.bttsNo?.toFixed(2) ?? '-'})`);
    }
  } else {
    missingData.push('Cotes officielles non fournies');
  }

  if (input.homeTeamObj && input.awayTeamObj) {
    usedData.push(`Bilan V/N/D & Buts (${input.homeTeamObj.goalsFor}:${input.homeTeamObj.goalsAgainst} vs ${input.awayTeamObj.goalsFor}:${input.awayTeamObj.goalsAgainst})`);
  } else {
    missingData.push('Équipe non synchronisée au répertoire officiel');
  }

  let logit1 = 0;
  let logitX = 0;
  let logit2 = 0;

  // 1. Home Field Advantage in Virtual League
  logit1 += 0.24;
  factors.push({
    label: 'Avantage Terrain Domicile',
    impact: 'positive',
    description: 'Bonus structurel appliqué aux équipes recevantes dans le moteur Instant League (+4.5%).',
    score: 4.5
  });

  // 2. Rank & Points difference factor
  if (homeRank !== null && awayRank !== null) {
    const diff = awayRank - homeRank;
    let rankInfluence = diff * 0.055;

    if (input.homeTeamObj && input.awayTeamObj && input.homeTeamObj.played > 0 && input.awayTeamObj.played > 0) {
      const hPpg = input.homeTeamObj.points / input.homeTeamObj.played;
      const aPpg = input.awayTeamObj.points / input.awayTeamObj.played;
      rankInfluence += (hPpg - aPpg) * 0.15;
    }

    logit1 += rankInfluence;
    logit2 -= rankInfluence * 0.9;
    if (Math.abs(diff) <= 3) {
      logitX += 0.15;
    }

    factors.push({
      label: 'Écart de Classement & Points Bet261',
      impact: diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral',
      description: diff > 0
        ? `${input.homeTeamName} (${homeRank}e, ${input.homeTeamObj?.points ?? '-'} pts) devance ${input.awayTeamName} (${awayRank}e, ${input.awayTeamObj?.points ?? '-'} pts) de ${diff} places.`
        : diff < 0
        ? `${input.awayTeamName} (${awayRank}e, ${input.awayTeamObj?.points ?? '-'} pts) devance ${input.homeTeamName} (${homeRank}e, ${input.homeTeamObj?.points ?? '-'} pts) de ${Math.abs(diff)} places.`
        : 'Équipes au coude-à-coude au classement général.',
      score: Number((rankInfluence * 10).toFixed(1))
    });
  }

  // 3. Form Difference Factor
  if (homeForm.length > 0 && awayForm.length > 0) {
    const hPts = calculateFormPoints(homeForm);
    const aPts = calculateFormPoints(awayForm);
    const formDiff = hPts - aPts;
    const formInfluence = formDiff * 0.045;
    logit1 += formInfluence;
    logit2 -= formInfluence * 0.85;

    factors.push({
      label: 'Dynamique de Forme Récente',
      impact: formDiff > 0.5 ? 'positive' : formDiff < -0.5 ? 'negative' : 'neutral',
      description: `Indice de forme pondéré : ${input.homeTeamName} [${homeForm.join('-')}] (${hPts.toFixed(1)}/15) vs ${input.awayTeamName} [${awayForm.join('-')}] (${aPts.toFixed(1)}/15).`,
      score: Number((formInfluence * 10).toFixed(1))
    });
  }

  // 4. Home / Away Specific Performance
  if (input.homeTeamObj?.homeRecord && input.awayTeamObj?.awayRecord) {
    const hr = input.homeTeamObj.homeRecord;
    const ar = input.awayTeamObj.awayRecord;
    const hGames = hr.won + hr.drawn + hr.lost;
    const aGames = ar.won + ar.drawn + ar.lost;
    if (hGames > 0 && aGames > 0) {
      const hRate = (hr.won * 3 + hr.drawn) / (hGames * 3);
      const aRate = (ar.won * 3 + ar.drawn) / (aGames * 3);
      const haDiff = (hRate - aRate) * 0.35;
      logit1 += haDiff;
      logit2 -= haDiff;

      factors.push({
        label: 'Rendement Domicile vs Extérieur',
        impact: haDiff > 0.03 ? 'positive' : haDiff < -0.03 ? 'negative' : 'neutral',
        description: `Domicile (${hr.won}V-${hr.drawn}N-${hr.lost}D) face à l'Extérieur (${ar.won}V-${ar.drawn}N-${ar.lost}D).`,
        score: Number((haDiff * 10).toFixed(1))
      });
    }
  }

  // 5. Implied Probabilities from Bet261 Market Odds
  let oddsProb1: number | null = null;
  let oddsProbX: number | null = null;
  let oddsProb2: number | null = null;

  if (odds && odds.home > 1.01 && odds.draw > 1.01 && odds.away > 1.01) {
    const rawInv1 = 1 / odds.home;
    const rawInvX = 1 / odds.draw;
    const rawInv2 = 1 / odds.away;
    const totalInv = rawInv1 + rawInvX + rawInv2;

    oddsProb1 = rawInv1 / totalInv;
    oddsProbX = rawInvX / totalInv;
    oddsProb2 = rawInv2 / totalInv;

    const bookmakerFav = odds.home < odds.away ? input.homeTeamName : input.awayTeamName;
    factors.push({
      label: 'Marché des Cotes Bet261 (1X2)',
      impact: odds.home < odds.away ? 'positive' : 'negative',
      description: `Probabilités implicites dé-margées : P(1)=${(oddsProb1 * 100).toFixed(1)}%, P(X)=${(oddsProbX * 100).toFixed(1)}%, P(2)=${(oddsProb2 * 100).toFixed(1)}%. Favori cotes : ${bookmakerFav}.`,
      score: Number(((oddsProb1 - oddsProb2) * 20).toFixed(1))
    });
  }

  // 6. Goal difference & Stat level difference
  if (input.homeTeamObj && input.awayTeamObj) {
    const hDiff = input.homeTeamObj.goalDiff;
    const aDiff = input.awayTeamObj.goalDiff;
    const gdDiff = hDiff - aDiff;
    const gdInfluence = Math.max(-0.4, Math.min(0.4, gdDiff * 0.015));
    logit1 += gdInfluence;
    logit2 -= gdInfluence;

    factors.push({
      label: 'Différence de Buts & Niveau Statistique',
      impact: gdDiff > 0 ? 'positive' : gdDiff < 0 ? 'negative' : 'neutral',
      description: `Différence de buts : ${input.homeTeamName} (${hDiff > 0 ? '+' : ''}${hDiff}) vs ${input.awayTeamName} (${aDiff > 0 ? '+' : ''}${aDiff}).`,
      score: Number((gdInfluence * 10).toFixed(1))
    });
  }

  // 7. Convert statistical logits to probabilities using Softmax
  const exp1 = Math.exp(logit1);
  const expX = Math.exp(logitX);
  const exp2 = Math.exp(logit2);
  const sumExp = exp1 + expX + exp2;

  const modelProb1 = exp1 / sumExp;
  const modelProbX = expX / sumExp;
  const modelProb2 = exp2 / sumExp;

  let finalProb1 = modelProb1;
  let finalProbX = modelProbX;
  let finalProb2 = modelProb2;

  if (oddsProb1 !== null && oddsProbX !== null && oddsProb2 !== null) {
    finalProb1 = (modelProb1 * 0.50) + (oddsProb1 * 0.50);
    finalProbX = (modelProbX * 0.50) + (oddsProbX * 0.50);
    finalProb2 = (modelProb2 * 0.50) + (oddsProb2 * 0.50);
  }

  const variabilityFactor = 0.09;
  finalProb1 = (finalProb1 * (1 - variabilityFactor)) + ((1 / 3) * variabilityFactor);
  finalProbX = (finalProbX * (1 - variabilityFactor)) + ((1 / 3) * variabilityFactor);
  finalProb2 = (finalProb2 * (1 - variabilityFactor)) + ((1 / 3) * variabilityFactor);

  factors.push({
    label: 'Facteur de Variabilité Virtuelle (RNG 8035)',
    impact: 'neutral',
    description: 'Ajustement de prudence lié à la variance algorithmique propre aux matchs virtuels Instant League.',
    score: 0
  });

  // Strict normalization: sum to exactly 100.0%
  const total = finalProb1 + finalProbX + finalProb2;
  let p1 = Number(((finalProb1 / total) * 100).toFixed(1));
  const pX = Number(((finalProbX / total) * 100).toFixed(1));
  const p2 = Number(((finalProb2 / total) * 100).toFixed(1));

  const diff100 = Number((100.0 - (p1 + pX + p2)).toFixed(1));
  if (diff100 !== 0) {
    p1 = Number((p1 + diff100).toFixed(1));
  }

  let mostLikelyChoice: '1' | 'X' | '2' = '1';
  if (pX > p1 && pX >= p2) mostLikelyChoice = 'X';
  else if (p2 > p1 && p2 > pX) mostLikelyChoice = '2';
  else mostLikelyChoice = '1';

  // ============================================================================
  // POISSON & MARKET GOAL MODEL FOR:
  // 1) Top 2 Score Exact
  // 2) Total Nombre de Buts
  // 3) Plus ou Moins (+/- 1.5, 2.5, 3.5)
  // 4) GG / NG (Goal / No Goal)
  // ============================================================================

  // Estimate expected total goals (lambdaTotal)
  let baseTotalGoals = 2.62; // Typical Instant League 8035 average goals per match
  if (input.homeTeamObj && input.awayTeamObj && input.homeTeamObj.played > 0 && input.awayTeamObj.played > 0) {
    const hAvgGoals = (input.homeTeamObj.goalsFor + input.homeTeamObj.goalsAgainst) / input.homeTeamObj.played;
    const aAvgGoals = (input.awayTeamObj.goalsFor + input.awayTeamObj.goalsAgainst) / input.awayTeamObj.played;
    if (hAvgGoals > 0.5 && aAvgGoals > 0.5) {
      baseTotalGoals = (baseTotalGoals * 0.45) + (((hAvgGoals + aAvgGoals) / 2) * 0.55);
    }
  }

  // Adjust total goals expectation using market Over/Under 2.5 odds if available
  if (odds?.over25 && odds?.under25 && odds.over25 > 1.01 && odds.under25 > 1.01) {
    const invO = 1 / odds.over25;
    const invU = 1 / odds.under25;
    const mktOver25 = invO / (invO + invU);
    // Calibrate lambdaTotal towards market Over 2.5 implied rate
    // In Poisson, P(Total >= 3) = 0.50 corresponds to lambdaTotal ~ 2.67
    const marketImpliedLambda = 1.65 + mktOver25 * 2.05;
    baseTotalGoals = (baseTotalGoals * 0.40) + (marketImpliedLambda * 0.60);
  }

  const lambdaTotal = Math.max(1.65, Math.min(3.85, baseTotalGoals));

  // Split lambdaTotal into lambdaHome and lambdaAway using p1 and p2 share
  const winShareHome = (p1 + pX * 0.5) / 100;
  const lambdaHome = Math.max(0.45, Math.min(2.65, lambdaTotal * (0.32 + winShareHome * 0.36)));
  const lambdaAway = Math.max(0.35, Math.min(2.45, lambdaTotal - lambdaHome));

  // Compute 6x6 Score Matrix (0..5 goals each) with Dixon-Coles low-score correlation adjustment
  const rawScoreProbs: Record<string, number> = {};
  let matrixSum = 0;

  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      let p = poissonPmf(h, lambdaHome) * poissonPmf(a, lambdaAway);
      // Slight Dixon-Coles adjustment for realistic football draws (1-1, 0-0)
      if (h === 1 && a === 1) p *= 1.08;
      if (h === 0 && a === 0) p *= 0.96;
      const key = `${h}-${a}`;
      rawScoreProbs[key] = p;
      matrixSum += p;
    }
  }

  // Normalize Poisson score probabilities
  for (const k of Object.keys(rawScoreProbs)) {
    rawScoreProbs[k] = rawScoreProbs[k] / matrixSum;
  }

  // Blend with Bet261 Exact Score odds (30081) if available
  const blendedScoreProbs: Record<string, number> = {};
  if (odds?.exactScores && Object.keys(odds.exactScores).length >= 6) {
    let sumInv = 0;
    for (const oddVal of Object.values(odds.exactScores)) {
      if (oddVal > 1) sumInv += 1 / oddVal;
    }
    let blendSum = 0;
    for (const k of Object.keys(rawScoreProbs)) {
      const mktOdd = odds.exactScores[k];
      const mktProb = mktOdd && mktOdd > 1 && sumInv > 0 ? (1 / mktOdd) / sumInv : rawScoreProbs[k];
      blendedScoreProbs[k] = (rawScoreProbs[k] * 0.45) + (mktProb * 0.55);
      blendSum += blendedScoreProbs[k];
    }
    for (const k of Object.keys(blendedScoreProbs)) {
      blendedScoreProbs[k] /= blendSum;
    }
  } else {
    Object.assign(blendedScoreProbs, rawScoreProbs);
  }

  // Calibrate the 6x6 exact score matrix so Home Win scores sum to p1%, Draw scores sum to pX%, Away Win scores sum to p2% (Total = 100%)
  let rawSum1 = 0;
  let rawSumX = 0;
  let rawSum2 = 0;
  for (const [score, prob] of Object.entries(blendedScoreProbs)) {
    const [h, a] = score.split('-').map(Number);
    if (h > a) rawSum1 += prob;
    else if (h === a) rawSumX += prob;
    else rawSum2 += prob;
  }

  const target1 = p1 / 100;
  const targetX = pX / 100;
  const target2 = p2 / 100;

  for (const [score, prob] of Object.entries(blendedScoreProbs)) {
    const [h, a] = score.split('-').map(Number);
    if (h > a && rawSum1 > 0) {
      blendedScoreProbs[score] = prob * (target1 / rawSum1);
    } else if (h === a && rawSumX > 0) {
      blendedScoreProbs[score] = prob * (targetX / rawSumX);
    } else if (h < a && rawSum2 > 0) {
      blendedScoreProbs[score] = prob * (target2 / rawSum2);
    }
  }

  // Sort exact scores descending by probability, ensuring #1 aligns with mostLikelyChoice when it has a clear edge
  const allCandidateScores = Object.entries(blendedScoreProbs)
    .map(([score, prob]) => {
      const [hStr, aStr] = score.split('-');
      const h = parseInt(hStr, 10);
      const a = parseInt(aStr, 10);
      const outcome: '1' | 'X' | '2' = h > a ? '1' : h < a ? '2' : 'X';
      const label =
        h > a
          ? `Victoire ${input.homeTeamName}`
          : h < a
          ? `Victoire ${input.awayTeamName}`
          : 'Match Nul';
      const exactOdd =
        odds?.exactScores?.[score] ||
        Number(Math.max(4.5, Math.min(85, (1 / Math.max(0.012, prob)) * 0.86)).toFixed(2));
      return {
        score,
        rawProb: prob,
        probability: Number((prob * 100).toFixed(1)),
        odds: exactOdd,
        label,
        outcome
      };
    })
    .sort((a, b) => b.rawProb - a.rawProb);

  // Ensure the #1 Exact Score matches mostLikelyChoice so 1X2 and Score Exact #1 are 100% coherent
  const bestForChoiceIdx = allCandidateScores.findIndex((s) => s.outcome === mostLikelyChoice);
  if (bestForChoiceIdx > 0) {
    const [bestForChoice] = allCandidateScores.splice(bestForChoiceIdx, 1);
    allCandidateScores.unshift(bestForChoice);
  }

  const top6Raw = allCandidateScores.slice(0, 6);
  const top3RawSum = top6Raw.slice(0, 3).reduce((acc, s) => acc + s.rawProb, 0) || 1;
  const top6RawSum = top6Raw.reduce((acc, s) => acc + s.rawProb, 0) || 1;

  // Compute strict 73.0% normalized probabilities for Top 3 Exact Scores
  const TARGET_NORM_PERCENT = 73.0;
  const normTop3 = top6Raw
    .slice(0, 3)
    .map((s) => Number(((s.rawProb / top3RawSum) * TARGET_NORM_PERCENT).toFixed(1)));
  const normDiff = Number(
    (TARGET_NORM_PERCENT - (normTop3[0] + normTop3[1] + normTop3[2])).toFixed(1)
  );
  if (normDiff !== 0) {
    normTop3[0] = Number((normTop3[0] + normDiff).toFixed(1));
  }

  const topExactScores: ExactScorePrediction[] = top6Raw.map((item, idx) => ({
    rank: idx + 1,
    score: item.score,
    probability: item.probability,
    normalizedProb:
      idx < 3
        ? normTop3[idx]
        : Number(((item.rawProb / top6RawSum) * TARGET_NORM_PERCENT).toFixed(1)),
    odds: item.odds,
    label: item.label,
    outcome: item.outcome
  }));

  // 2) TOTAL NOMBRE DE BUTS (0, 1, 2, 3, 4, 5+) & Multi-Buts (0-2, 1-3, 2-4, 4+)
  const goalsBuckets: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
  for (const [score, prob] of Object.entries(blendedScoreProbs)) {
    const [h, a] = score.split('-').map(Number);
    const sumG = h + a;
    if (sumG === 0) goalsBuckets['0'] += prob;
    else if (sumG === 1) goalsBuckets['1'] += prob;
    else if (sumG === 2) goalsBuckets['2'] += prob;
    else if (sumG === 3) goalsBuckets['3'] += prob;
    else if (sumG === 4) goalsBuckets['4'] += prob;
    else goalsBuckets['5+'] += prob;
  }

  // Blend exact goal buckets with Bet261 30090 Total de buts odds if available
  if (odds?.totalGoalsExact && Object.keys(odds.totalGoalsExact).length >= 4) {
    let sumInv = 0;
    for (const v of Object.values(odds.totalGoalsExact)) {
      if (v > 1) sumInv += 1 / v;
    }
    if (sumInv > 0) {
      const mkt5Plus =
        ((odds.totalGoalsExact['5'] ? 1 / odds.totalGoalsExact['5'] : 0) +
          (odds.totalGoalsExact['6'] ? 1 / odds.totalGoalsExact['6'] : 0)) /
        sumInv;
      for (const gKey of ['0', '1', '2', '3', '4']) {
        const mktOdd = odds.totalGoalsExact[gKey];
        if (mktOdd && mktOdd > 1) {
          const mktP = (1 / mktOdd) / sumInv;
          goalsBuckets[gKey] = goalsBuckets[gKey] * 0.45 + mktP * 0.55;
        }
      }
      if (mkt5Plus > 0) {
        goalsBuckets['5+'] = goalsBuckets['5+'] * 0.45 + mkt5Plus * 0.55;
      }
    }
  }

  // Normalize exactDistribution to 100%
  const bucketSum = Object.values(goalsBuckets).reduce((a, b) => a + b, 0) || 1;
  const exactDistribution = Object.entries(goalsBuckets).map(([goals, rawP]) => {
    const probPct = Number(((rawP / bucketSum) * 100).toFixed(1));
    const mktOdd =
      goals === '5+'
        ? odds?.totalGoalsExact?.['5']
        : odds?.totalGoalsExact?.[goals];
    return {
      goals: goals === '0' ? '0 but' : goals === '1' ? '1 but' : `${goals} buts`,
      probability: probPct,
      odds: mktOdd || Number((1 / Math.max(0.03, (rawP / bucketSum) * 1.12)).toFixed(2))
    };
  });

  const bestExactGoal = [...exactDistribution].sort((a, b) => b.probability - a.probability)[0];

  // Multi-buts ranges (0-2, 1-3, 2-4, 4+)
  const p0 = goalsBuckets['0'] / bucketSum;
  const p1g = goalsBuckets['1'] / bucketSum;
  const p2g = goalsBuckets['2'] / bucketSum;
  const p3g = goalsBuckets['3'] / bucketSum;
  const p4g = goalsBuckets['4'] / bucketSum;
  const p5p = goalsBuckets['5+'] / bucketSum;

  const multiGoalsRanges = [
    {
      range: '0 - 2 Buts',
      probability: Number(((p0 + p1g + p2g) * 100).toFixed(1)),
      odds: odds?.multiGoals0to2 || Number((1 / Math.max(0.1, (p0 + p1g + p2g) * 1.1)).toFixed(2))
    },
    {
      range: '1 - 3 Buts',
      probability: Number(((p1g + p2g + p3g) * 100).toFixed(1)),
      odds: odds?.multiGoals1to3 || Number((1 / Math.max(0.1, (p1g + p2g + p3g) * 1.1)).toFixed(2))
    },
    {
      range: '2 - 4 Buts',
      probability: Number(((p2g + p3g + p4g) * 100).toFixed(1)),
      odds: odds?.multiGoals2to4 || Number((1 / Math.max(0.1, (p2g + p3g + p4g) * 1.1)).toFixed(2))
    },
    {
      range: '4+ Buts',
      probability: Number(((p4g + p5p) * 100).toFixed(1)),
      odds: odds?.multiGoals4Plus || Number((1 / Math.max(0.05, (p4g + p5p) * 1.1)).toFixed(2))
    }
  ];

  // Pick the most informative multi-goals range (comparing 0-2, 1-3, 2-4)
  const bestRange = [...multiGoalsRanges].sort((a, b) => b.probability - a.probability)[0];

  const totalGoals: TotalGoalsPrediction = {
    expectedGoals: Number(lambdaTotal.toFixed(2)),
    mostLikelyRange: bestRange.range,
    mostLikelyRangeProb: bestRange.probability,
    mostLikelyRangeOdds: bestRange.odds,
    mostLikelyExactGoals: bestExactGoal.goals,
    mostLikelyExactProb: bestExactGoal.probability,
    mostLikelyExactOdds: bestExactGoal.odds,
    exactDistribution,
    multiGoalsRanges
  };

  // 3) PLUS OU MOINS (Over / Under 1.5, 2.5, 3.5)
  const rawOver15 = 1 - (p0 + p1g);
  const rawOver25 = 1 - (p0 + p1g + p2g);
  const rawOver35 = p4g + p5p;

  const [probOver15, probUnder15] = blendTwoWay(rawOver15, odds?.over15, odds?.under15);
  const [probOver25, probUnder25] = blendTwoWay(rawOver25, odds?.over25, odds?.under25);
  const [probOver35, probUnder35] = blendTwoWay(rawOver35, odds?.over35, odds?.under35);

  const line15: OverUnderLinePrediction = {
    line: '1.5',
    probOver: probOver15,
    probUnder: probUnder15,
    oddsOver: odds?.over15 || Number((1 / Math.max(0.1, (probOver15 / 100) * 1.08)).toFixed(2)),
    oddsUnder: odds?.under15 || Number((1 / Math.max(0.05, (probUnder15 / 100) * 1.08)).toFixed(2)),
    pick: probOver15 >= probUnder15 ? 'Plus de 1.5 (+1.5)' : 'Moins de 1.5 (-1.5)',
    recommendedProb: Math.max(probOver15, probUnder15)
  };

  const line25: OverUnderLinePrediction = {
    line: '2.5',
    probOver: probOver25,
    probUnder: probUnder25,
    oddsOver: odds?.over25 || Number((1 / Math.max(0.1, (probOver25 / 100) * 1.08)).toFixed(2)),
    oddsUnder: odds?.under25 || Number((1 / Math.max(0.1, (probUnder25 / 100) * 1.08)).toFixed(2)),
    pick: probOver25 >= probUnder25 ? 'Plus de 2.5 (+2.5)' : 'Moins de 2.5 (-2.5)',
    recommendedProb: Math.max(probOver25, probUnder25)
  };

  const line35: OverUnderLinePrediction = {
    line: '3.5',
    probOver: probOver35,
    probUnder: probUnder35,
    oddsOver: odds?.over35 || Number((1 / Math.max(0.05, (probOver35 / 100) * 1.08)).toFixed(2)),
    oddsUnder: odds?.under35 || Number((1 / Math.max(0.1, (probUnder35 / 100) * 1.08)).toFixed(2)),
    pick: probOver35 >= probUnder35 ? 'Plus de 3.5 (+3.5)' : 'Moins de 3.5 (-3.5)',
    recommendedProb: Math.max(probOver35, probUnder35)
  };

  const overUnder: OverUnderPrediction = {
    mainPick: line25.pick,
    mainPickProb: line25.recommendedProb,
    mainPickOdds: probOver25 >= probUnder25 ? line25.oddsOver : line25.oddsUnder,
    over25Prob: probOver25,
    under25Prob: probUnder25,
    lines: {
      line15,
      line25,
      line35
    }
  };

  // 4) GG / NG (Les 2 équipes marquent : Oui / Non)
  let rawGG = 0;
  for (const [score, prob] of Object.entries(blendedScoreProbs)) {
    const [h, a] = score.split('-').map(Number);
    if (h >= 1 && a >= 1) {
      rawGG += prob;
    }
  }
  const [probGG, probNG] = blendTwoWay(rawGG, odds?.bttsYes, odds?.bttsNo);
  const recommendedGGNG: 'GG' | 'NG' = probGG >= probNG ? 'GG' : 'NG';

  const ggNg: GgNgPrediction = {
    probGG,
    probNG,
    recommended: recommendedGGNG,
    recommendedLabel: recommendedGGNG === 'GG' ? 'GG — Oui (Les 2 marquent)' : 'NG — Non (Au moins 1 clean sheet)',
    oddsGG: odds?.bttsYes || Number((1 / Math.max(0.1, (probGG / 100) * 1.08)).toFixed(2)),
    oddsNG: odds?.bttsNo || Number((1 / Math.max(0.1, (probNG / 100) * 1.08)).toFixed(2))
  };

  // Confidence Index algorithm
  const sortedProbs = [p1, pX, p2].sort((a, b) => b - a);
  const gap = sortedProbs[0] - sortedProbs[1];
  const completeness = usedData.length / (usedData.length + missingData.length);

  let confidenceIndex: 'faible' | 'moyen' | 'élevé' = 'moyen';
  if (completeness >= 0.75 && gap >= 18) {
    confidenceIndex = 'élevé';
  } else if (completeness < 0.5 || gap <= 7) {
    confidenceIndex = 'faible';
  } else {
    confidenceIndex = 'moyen';
  }

  return {
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    matchId: input.matchId || `VIRT-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    homeTeam: input.homeTeamName || 'Équipe Domicile',
    awayTeam: input.awayTeamName || 'Équipe Extérieure',
    prob1: p1,
    probX: pX,
    prob2: p2,
    mostLikelyChoice,
    confidenceIndex,
    topExactScores,
    totalGoals,
    overUnder,
    ggNg,
    usedData,
    missingData,
    factors,
    odds: odds || undefined
  };
}
