import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Bookmark,
  Check,
  RefreshCw,
  BarChart2,
  Target,
  Flame,
  TrendingUp,
  Zap
} from 'lucide-react';
import { PredictionResult } from '../types/league';
import { TeamBadge, LeagueBadge } from './TeamBadge';

interface PredictionResultCardProps {
  prediction: PredictionResult;
  onSaveToHistory: (prediction: PredictionResult) => void;
  onRecordActualResult: (predictionId: string, result: '1' | 'X' | '2') => void;
  onNewAnalysis?: () => void;
  isSaved?: boolean;
}

export const PredictionResultCard: React.FC<PredictionResultCardProps> = ({
  prediction,
  onSaveToHistory,
  onRecordActualResult,
  onNewAnalysis,
  isSaved = false
}) => {
  const [selectedActual, setSelectedActual] = useState<'1' | 'X' | '2' | undefined>(prediction.actualResult);
  const [savedLocally, setSavedLocally] = useState<boolean>(isSaved);

  const handleSelectActual = (choice: '1' | 'X' | '2') => {
    setSelectedActual(choice);
    onRecordActualResult(prediction.id, choice);
  };

  const handleSave = () => {
    onSaveToHistory(prediction);
    setSavedLocally(true);
  };

  const confidenceConfig = {
    'élevé': {
      text: 'ÉLEVÉ',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      description: 'Données complètes et signal statistique fort.'
    },
    'moyen': {
      text: 'MOYEN',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      description: 'Données fiables avec confrontation équilibrée.'
    },
    'faible': {
      text: 'FAIBLE',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      description: 'Données partielles ou variabilité virtuelle élevée.'
    }
  }[prediction.confidenceIndex] || {
    text: 'MOYEN',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    description: 'Niveau moyen'
  };

  const choiceLabel = {
    '1': `1 — Victoire ${prediction.homeTeam}`,
    'X': 'X — Match Nul',
    '2': `2 — Victoire ${prediction.awayTeam}`
  }[prediction.mostLikelyChoice];

  const top2Scores = prediction.topExactScores ? prediction.topExactScores.slice(0, 2) : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 font-mono">
            {prediction.matchId ? `MATCH ID: ${prediction.matchId}` : 'ANALYSE STATISTIQUE'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
            Prédiction Analysée • Multi-Marchés 8035
          </h2>
          <div className="text-xs text-slate-400 mt-1">
            Généré le {new Date(prediction.timestamp).toLocaleString('fr-FR')} • Instant League 8035
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={savedLocally}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
              savedLocally
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 cursor-pointer'
            }`}
          >
            {savedLocally ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{savedLocally ? 'Enregistré' : 'Sauvegarder'}</span>
          </button>

          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Nouveau</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Fixture Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl p-4 sm:p-6 border border-slate-800/90 text-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          {/* Home */}
          <div className="flex sm:flex-row-reverse items-center justify-between sm:justify-start gap-3 text-left sm:text-right">
            <TeamBadge teamName={prediction.homeTeam} size="xl" />
            <div>
              <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block">DOMICILE (1)</span>
              <span className="text-lg sm:text-2xl font-black text-white">{prediction.homeTeam}</span>
              {prediction.odds && (
                <span className="block text-xs font-mono text-slate-400 mt-0.5">
                  Cote Bet261 : <strong className="text-blue-400">{prediction.odds.home.toFixed(2)}</strong>
                </span>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shadow-inner">
              VS
            </div>
            {prediction.odds && (
              <span className="text-[11px] font-mono text-slate-500 mt-1">
                Nul : <strong className="text-slate-300">{prediction.odds.draw.toFixed(2)}</strong>
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center justify-between sm:justify-start gap-3 text-left">
            <TeamBadge teamName={prediction.awayTeam} size="xl" />
            <div>
              <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider block">EXTÉRIEUR (2)</span>
              <span className="text-lg sm:text-2xl font-black text-white">{prediction.awayTeam}</span>
              {prediction.odds && (
                <span className="block text-xs font-mono text-slate-400 mt-0.5">
                  Cote Bet261 : <strong className="text-purple-400">{prediction.odds.away.toFixed(2)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Probabilities 1 / X / 2 Block */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Probabilités 1 / X / 2 Normalisées (Somme = 100%)
          </span>
          <span className="text-[11px] text-slate-400">Modèle Multi-Facteurs 8035</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className={`p-4 rounded-xl border transition ${
            prediction.mostLikelyChoice === '1'
              ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-blue-400 block mb-1">1 (DOMICILE)</span>
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">
              {prediction.prob1}%
            </div>
            {prediction.mostLikelyChoice === '1' && (
              <span className="inline-block mt-1 text-[10px] font-bold text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded">
                Plus probable
              </span>
            )}
          </div>

          <div className={`p-4 rounded-xl border transition ${
            prediction.mostLikelyChoice === 'X'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-amber-400 block mb-1">X (MATCH NUL)</span>
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">
              {prediction.probX}%
            </div>
            {prediction.mostLikelyChoice === 'X' && (
              <span className="inline-block mt-1 text-[10px] font-bold text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded">
                Plus probable
              </span>
            )}
          </div>

          <div className={`p-4 rounded-xl border transition ${
            prediction.mostLikelyChoice === '2'
              ? 'bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-500/10'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-purple-400 block mb-1">2 (EXTÉRIEUR)</span>
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">
              {prediction.prob2}%
            </div>
            {prediction.mostLikelyChoice === '2' && (
              <span className="inline-block mt-1 text-[10px] font-bold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded">
                Plus probable
              </span>
            )}
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${prediction.prob1}%` }}
              className="h-full bg-blue-500 transition-all duration-500"
              title={`1: ${prediction.prob1}%`}
            />
            <div
              style={{ width: `${prediction.probX}%` }}
              className="h-full bg-amber-500 transition-all duration-500"
              title={`X: ${prediction.probX}%`}
            />
            <div
              style={{ width: `${prediction.prob2}%` }}
              className="h-full bg-purple-500 transition-all duration-500"
              title={`2: ${prediction.prob2}%`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>P(1) = {prediction.prob1}%</span>
            <span>P(X) = {prediction.probX}%</span>
            <span>P(2) = {prediction.prob2}%</span>
          </div>
        </div>
      </div>

      {/* Most Likely Choice & Confidence Index */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            CHOIX STATISTIQUEMENT LE PLUS PROBABLE :
          </span>
          <div className="flex items-center gap-3 pt-1">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/30">
              {prediction.mostLikelyChoice}
            </span>
            <div>
              <div className="text-sm font-bold text-white">{choiceLabel}</div>
              <div className="text-xs text-slate-400">
                Probabilité modèle : {
                  prediction.mostLikelyChoice === '1' ? prediction.prob1 :
                  prediction.mostLikelyChoice === 'X' ? prediction.probX : prediction.prob2
                }%
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            INDICE DE CONFIANCE :
          </span>
          <div className="flex items-center gap-3 pt-1">
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${confidenceConfig.badgeClass}`}>
              {confidenceConfig.text}
            </span>
            <div className="text-xs text-slate-300">
              {confidenceConfig.description}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          NEW MULTI-MARKETS BLOCK:
          1) Top 2 Score Exact
          2) Total Nombre de Buts
          3) Plus ou Moins (+/-)
          4) GG / NG (Les 2 équipes marquent)
         ===================================================================== */}
      {prediction.topExactScores && prediction.totalGoals && prediction.overUnder && prediction.ggNg && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Marchés Buts & Scores • Bet261 Instant League 8035
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Moyenne attendue : <strong className="text-emerald-400">{prediction.totalGoals.expectedGoals} buts</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. SCORE EXACT (PROBABILITÉS ESTIMÉES NORMALISÉES 73%) */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  1. Le Score Exact (Normalisé 73%)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Somme Top 3 = 73%
                </span>
              </div>

              {(() => {
                const top3 = prediction.topExactScores.slice(0, 3);
                const rawSum = top3.reduce((acc, s) => acc + (s.probability || 10), 0) || 1;
                const nProbs = top3.map((s) =>
                  Number(((s.probability / rawSum) * 73.0).toFixed(1))
                );
                const diff = Number((73.0 - (nProbs[0] + nProbs[1] + nProbs[2])).toFixed(1));
                if (diff !== 0 && nProbs.length === 3) {
                  nProbs[0] = Number((nProbs[0] + diff).toFixed(1));
                }

                return (
                  <>
                    <div className="grid grid-cols-3 gap-2.5">
                      {top3.map((sc, i) => {
                        const normVal = nProbs[i] ?? sc.normalizedProb ?? sc.probability;
                        return (
                          <div
                            key={sc.score}
                            className={`p-2.5 rounded-xl border text-center relative ${
                              i === 0
                                ? 'bg-blue-950/40 border-blue-500/70 shadow-md shadow-blue-500/10'
                                : 'bg-slate-900/90 border-slate-700/80'
                            }`}
                          >
                            <span
                              className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mb-1 ${
                                i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              Choix #{sc.rank}
                            </span>
                            <div className="text-2xl font-black text-white font-mono tracking-wider my-0.5">
                              {sc.score}
                            </div>
                            <div className="text-base font-black text-emerald-400 font-mono">
                              {normVal}%
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium truncate">
                              {sc.label}
                            </div>
                            <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-400">Réel: {sc.probability}%</span>
                              {sc.odds && (
                                <strong className="text-amber-400">@{sc.odds.toFixed(2)}</strong>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 73% Normalized Bar for Top 3 Exact Scores */}
                    {top3.length >= 3 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            style={{
                              width: `${(nProbs[0] / 73) * 100}%`
                            }}
                            className="h-full bg-emerald-500"
                          />
                          <div
                            style={{
                              width: `${(nProbs[1] / 73) * 100}%`
                            }}
                            className="h-full bg-blue-500"
                          />
                          <div
                            style={{
                              width: `${(nProbs[2] / 73) * 100}%`
                            }}
                            className="h-full bg-purple-500"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>
                            {top3[0].score} ({nProbs[0]}%)
                          </span>
                          <span>
                            {top3[1].score} ({nProbs[1]}%)
                          </span>
                          <span>
                            {top3[2].score} ({nProbs[2]}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* 2. TOTAL NOMBRE DE BUTS */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  2. Total Nombre de Buts
                </span>
                <span className="text-[10px] font-mono text-slate-500">Multi-Buts & Exact</span>
              </div>

              {/* Highlighted Primary Range & Exact Goal */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/50 text-center">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Intervalle Probable</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {prediction.totalGoals.mostLikelyRange}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                    <strong className="text-emerald-400">{prediction.totalGoals.mostLikelyRangeProb}%</strong>
                    {prediction.totalGoals.mostLikelyRangeOdds && (
                      <span> · Cote {prediction.totalGoals.mostLikelyRangeOdds.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Exact Favori</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {prediction.totalGoals.mostLikelyExactGoals}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                    <strong className="text-blue-400">{prediction.totalGoals.mostLikelyExactProb}%</strong>
                    {prediction.totalGoals.mostLikelyExactOdds && (
                      <span> · Cote {prediction.totalGoals.mostLikelyExactOdds.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Exact Goals Distribution Mini-Bars */}
              <div className="grid grid-cols-6 gap-1.5 pt-1 text-center">
                {prediction.totalGoals.exactDistribution.map((d) => (
                  <div key={d.goals} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/90">
                    <div className="text-[10px] font-bold text-slate-400">{d.goals.replace(' buts', 'b').replace(' but', 'b')}</div>
                    <div className="text-xs font-black text-white font-mono">{d.probability}%</div>
                    {d.odds && (
                      <div className="text-[9px] font-mono text-slate-500">@{d.odds.toFixed(1)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. PLUS OU MOINS (OVER / UNDER 1.5, 2.5, 3.5) */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  3. Plus ou Moins (+/- Buts)
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                  Recommandé : {prediction.overUnder.mainPick}
                </span>
              </div>

              <div className="space-y-2">
                {(['line15', 'line25', 'line35'] as const).map((key) => {
                  const lineObj = prediction.overUnder.lines[key];
                  const isMain = key === 'line25';
                  return (
                    <div
                      key={lineObj.line}
                      className={`p-2.5 rounded-lg border text-xs ${
                        isMain
                          ? 'bg-slate-900 border-emerald-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white font-mono">
                          Seuil +/- {lineObj.line} Buts
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400">
                          Choix : {lineObj.pick} ({lineObj.recommendedProb}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className={`px-2.5 py-1 rounded flex items-center justify-between border ${
                          lineObj.probOver >= lineObj.probUnder
                            ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}>
                          <span>+ {lineObj.line} : {lineObj.probOver}%</span>
                          {lineObj.oddsOver && <span className="text-[10px] opacity-85">@{lineObj.oddsOver.toFixed(2)}</span>}
                        </div>
                        <div className={`px-2.5 py-1 rounded flex items-center justify-between border ${
                          lineObj.probUnder > lineObj.probOver
                            ? 'bg-blue-950/40 border-blue-600/50 text-blue-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}>
                          <span>- {lineObj.line} : {lineObj.probUnder}%</span>
                          {lineObj.oddsUnder && <span className="text-[10px] opacity-85">@{lineObj.oddsUnder.toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. GG / NG (LES DEUX ÉQUIPES MARQUENT) */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    4. GG / NG (Les 2 Équipes Marquent)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Marché G/NG Bet261</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center pt-1">
                  {/* GG (Oui) */}
                  <div className={`p-3.5 rounded-xl border transition ${
                    prediction.ggNg.recommended === 'GG'
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <span className="text-xs font-bold text-emerald-400 block">GG (OUI)</span>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono my-1">
                      {prediction.ggNg.probGG}%
                    </div>
                    {prediction.ggNg.oddsGG && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Cote Bet261 : <strong className="text-white">{prediction.ggNg.oddsGG.toFixed(2)}</strong>
                      </div>
                    )}
                  </div>

                  {/* NG (Non) */}
                  <div className={`p-3.5 rounded-xl border transition ${
                    prediction.ggNg.recommended === 'NG'
                      ? 'bg-rose-950/40 border-rose-500/80 shadow-md shadow-rose-500/10'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <span className="text-xs font-bold text-rose-400 block">NG (NON)</span>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono my-1">
                      {prediction.ggNg.probNG}%
                    </div>
                    {prediction.ggNg.oddsNG && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Cote Bet261 : <strong className="text-white">{prediction.ggNg.oddsNG.toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GG/NG Visual Bar & Recommendation */}
              <div className="space-y-2 pt-2">
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${prediction.ggNg.probGG}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${prediction.ggNg.probNG}%` }}
                    className="h-full bg-rose-500 transition-all duration-500"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Choix GG/NG :</span>
                  <strong className={prediction.ggNg.recommended === 'GG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {prediction.ggNg.recommendedLabel}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Used & Missing Data Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Données utilisées
          </span>
          <ul className="space-y-1 text-slate-300">
            {prediction.usedData.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
          <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Données manquantes ou par défaut
          </span>
          {prediction.missingData.length > 0 ? (
            <ul className="space-y-1 text-slate-300">
              {prediction.missingData.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400">⚠️</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-slate-400 text-xs italic">
              Aucune donnée critique manquante. Profil complet synchronisé.
            </div>
          )}
        </div>
      </div>

      {/* Key Factors Influencing the Calculation */}
      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          Facteurs ayant influencé le calcul statistique
        </span>
        <div className="space-y-2">
          {prediction.factors.map((f, i) => (
            <div key={i} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white block">{f.label}</span>
                <span className="text-slate-400 text-[11px]">{f.description}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 ${
                f.impact === 'positive' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                f.impact === 'negative' ? 'bg-purple-950 text-purple-400 border border-purple-800/50' :
                'bg-slate-800 text-slate-400'
              }`}>
                {f.impact === 'positive' ? `+${f.score} DOM` : f.impact === 'negative' ? `${f.score} EXT` : 'Neutre'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Interactive Actual Result Logging */}
      <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Renseigner le Résultat Réel du Match (Pour évaluer la précision du modèle) :
          </span>
          {selectedActual && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              selectedActual === prediction.mostLikelyChoice
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {selectedActual === prediction.mostLikelyChoice ? '✅ Prédiction Validée' : '❌ Prédiction Différente'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSelectActual('1')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
              selectedActual === '1'
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            1 (Victoire Domicile)
          </button>
          <button
            onClick={() => handleSelectActual('X')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
              selectedActual === 'X'
                ? 'bg-amber-600 border-amber-400 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            X (Match Nul)
          </button>
          <button
            onClick={() => handleSelectActual('2')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
              selectedActual === '2'
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            2 (Victoire Extérieur)
          </button>
        </div>
      </div>

      {/* Mandatory Uncertainty Disclaimer */}
      <div className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-400 font-semibold uppercase tracking-wider block mb-0.5">
            Avertissement Obligatoire — Nature Aléatoire des Matchs Virtuels
          </strong>
          Le système est un outil d'analyse statistique probabiliste. Les matchs virtuels de l'Instant League 8035 comportent une part d'aléatoire inhérente au générateur de nombres (RNG).
          Aucune prédiction ne peut être présentée comme une certitude, un résultat garanti ou « sécurisé ». Jouez de manière responsable.
        </div>
      </div>
    </div>
  );
};
