import React from 'react';
import { Camera, RefreshCw, BarChart2, Search, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { VirtualMatch, Team, PredictionResult, SavedCombineTicket, CombineStatus, VirtualMatchResult } from '../types/league';
import { PredictionResultCard } from './PredictionResultCard';
import { TeamBadge, LeagueBadge } from './TeamBadge';
import { TopCombineSection } from './TopCombineSection';

interface DashboardOverviewProps {
  onOpenScanner: () => void;
  onOpenSync: () => void;
  onOpenRanking: () => void;
  currentPrediction: PredictionResult | null;
  onTriggerAnalysis: () => void;
  selectedMatch: VirtualMatch | null;
  onSelectMatch: (match: VirtualMatch) => void;
  matches: VirtualMatch[];
  teams: Team[];
  onSavePrediction: (pred: PredictionResult) => void;
  onUpdateActualResult: (id: string, res: '1' | 'X' | '2') => void;
  recentResults?: VirtualMatchResult[];
  combineHistory?: SavedCombineTicket[];
  autoMarkCombinesEnabled?: boolean;
  onToggleAutoMarkCombines?: () => void;
  onSaveCombineTicket?: (ticket: SavedCombineTicket) => void;
  onUpdateCombineStatus?: (ticketId: string, status: CombineStatus) => void;
  onToggleCombineSelectionStatus?: (ticketId: string, selectionIndex: number) => void;
  onDeleteCombineTicket?: (ticketId: string) => void;
  onOpenFullHistory?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenScanner,
  onOpenSync,
  onOpenRanking,
  currentPrediction,
  onTriggerAnalysis,
  selectedMatch,
  onSelectMatch,
  matches,
  teams,
  onSavePrediction,
  onUpdateActualResult,
  recentResults = [],
  combineHistory = [],
  autoMarkCombinesEnabled = true,
  onToggleAutoMarkCombines,
  onSaveCombineTicket,
  onUpdateCombineStatus,
  onToggleCombineSelectionStatus,
  onDeleteCombineTicket,
  onOpenFullHistory
}) => {
  const activeMatch = selectedMatch || matches[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Header & 3 Main Buttons requested on Main Screen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl text-center space-y-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <LeagueBadge size="sm" />
            <span className="text-xs font-bold text-blue-400 font-mono tracking-widest uppercase">
              INSTANT LEAGUE 8035 • BET261
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            VIRTUAL PREDICTOR
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1">
            Outil d'analyse probabiliste et de scan OCR pour les matchs de football virtuel
          </p>
        </div>

        {/* The 3 Main Primary Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>📷 SCANNER CAPTURE</span>
          </button>

          <button
            onClick={onOpenSync}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wide border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>🔄 SYNCHRONISER MATCHS</span>
          </button>

          <button
            onClick={onOpenRanking}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wide border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span>📊 CLASSEMENT & FORME</span>
          </button>
        </div>
      </div>

      {/* TOP COMBINÉ DE LA JOURNÉE (Auto-Generated Live Parlay Tickets) */}
      <TopCombineSection
        matches={matches}
        teams={teams}
        recentResults={recentResults}
        activeRoundNumber={activeMatch?.round || 1}
        onSelectMatch={onSelectMatch}
        combineHistory={combineHistory}
        autoMarkCombinesEnabled={autoMarkCombinesEnabled}
        onToggleAutoMarkCombines={onToggleAutoMarkCombines}
        onSaveCombineTicket={onSaveCombineTicket}
        onUpdateCombineStatus={onUpdateCombineStatus}
        onToggleCombineSelectionStatus={onToggleCombineSelectionStatus}
        onDeleteCombineTicket={onDeleteCombineTicket}
        onOpenFullHistory={onOpenFullHistory}
      />

      {/* MATCH DÉTECTÉ CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              MATCH DÉTECTÉ / SÉLECTIONNÉ
            </h3>
          </div>
          {activeMatch && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeMatch.scheduledTime}</span>
              <span className="font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/60">
                {activeMatch.matchNumber}
              </span>
            </div>
          )}
        </div>

        {/* Quick Carousel / Fixture Selector (all 10 matches of the round) */}
        {matches.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {matches.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                  activeMatch?.id === m.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-[10px] opacity-70 font-mono">M{idx + 1}</span>
                <TeamBadge teamName={m.homeTeam} size="xs" />
                <span>{m.homeTeam.split(' ')[0]}</span>
                <span className="opacity-60">vs</span>
                <TeamBadge teamName={m.awayTeam} size="xs" />
                <span>{m.awayTeam.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Teams Big Visual Display */}
        {activeMatch ? (
          <div className="p-4 sm:p-6 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
              {/* Home */}
              <div className="flex sm:flex-row-reverse items-center justify-between sm:justify-start gap-3.5 text-left sm:text-right">
                <TeamBadge teamName={activeMatch.homeTeam} size="xl" />
                <div>
                  <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block">Équipe Domicile</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{activeMatch.homeTeam}</span>
                  {activeMatch.odds && (
                    <span className="block text-xs font-mono text-slate-400 mt-1">
                      Cote : <strong className="text-blue-400 font-bold">{activeMatch.odds.home.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center justify-center">
                <span className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                  VS
                </span>
                {activeMatch.odds && (
                  <span className="text-[11px] font-mono text-slate-500 mt-1">
                    Nul : <strong className="text-slate-300 font-bold">{activeMatch.odds.draw.toFixed(2)}</strong>
                  </span>
                )}
              </div>

              {/* Away */}
              <div className="flex items-center justify-between sm:justify-start gap-3.5 text-left">
                <TeamBadge teamName={activeMatch.awayTeam} size="xl" />
                <div>
                  <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider block">Équipe Extérieure</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{activeMatch.awayTeam}</span>
                  {activeMatch.odds && (
                    <span className="block text-xs font-mono text-slate-400 mt-1">
                      Cote : <strong className="text-purple-400 font-bold">{activeMatch.odds.away.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            Aucun match sélectionné. Cliquez sur "Synchroniser Matchs" ou "Scanner une Capture".
          </div>
        )}

        {/* PROBABILITÉS DISPLAY */}
        {currentPrediction ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                PROBABILITÉS ESTIMÉES (NORMALISÉES 100%)
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Analyse Prête
              </span>
            </div>

            {/* 3 Large Boxes */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-xl">
                <span className="text-xs font-bold text-blue-400 block mb-1">1</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">{currentPrediction.prob1}%</span>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl">
                <span className="text-xs font-bold text-amber-400 block mb-1">X</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">{currentPrediction.probX}%</span>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-900/60 rounded-xl">
                <span className="text-xs font-bold text-purple-400 block mb-1">2</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">{currentPrediction.prob2}%</span>
              </div>
            </div>

            {/* Most Likely & Confidence summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400">Choix 1X2 le plus probable : </span>
                <strong className="text-white font-bold ml-1">{currentPrediction.mostLikelyChoice}</strong>
              </div>
              {currentPrediction.topExactScores?.[0] && (
                <div>
                  <span className="text-slate-400">Score Exact favori : </span>
                  <strong className="text-emerald-400 font-black font-mono ml-1">
                    {currentPrediction.topExactScores[0].score} ({currentPrediction.topExactScores[0].normalizedProb ?? currentPrediction.topExactScores[0].probability}%)
                  </strong>
                </div>
              )}
              <div>
                <span className="text-slate-400">Confiance : </span>
                <strong className="text-blue-400 font-bold uppercase ml-1">{currentPrediction.confidenceIndex}</strong>
              </div>
            </div>

            {/* PROBABILITÉS ESTIMÉES (NORMALISÉES 73%) — LE SCORE EXACT */}
            {currentPrediction.topExactScores && currentPrediction.topExactScores.length >= 3 && (() => {
              const top3 = currentPrediction.topExactScores.slice(0, 3);
              const rawSum = top3.reduce((acc, s) => acc + (s.probability || 10), 0) || 1;
              const nProbs = top3.map((s) =>
                Number(((s.probability / rawSum) * 73.0).toFixed(1))
              );
              const diff = Number((73.0 - (nProbs[0] + nProbs[1] + nProbs[2])).toFixed(1));
              if (diff !== 0) nProbs[0] = Number((nProbs[0] + diff).toFixed(1));

              return (
                <div className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-3 shadow-lg shadow-emerald-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      PROBABILITÉS ESTIMÉES (NORMALISÉES 73%) — LE SCORE EXACT
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Somme Top 3 = <strong className="text-emerald-400">73%</strong>
                    </span>
                  </div>

                  {/* 3 Normalized Exact Score Cards */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {top3.map((sc, idx) => {
                      const normVal = nProbs[idx];
                      const cardStyle =
                        idx === 0
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                          : idx === 1
                          ? 'bg-blue-950/35 border-blue-800/70'
                          : 'bg-purple-950/35 border-purple-800/70';
                      const badgeStyle =
                        idx === 0
                          ? 'bg-emerald-500 text-slate-950'
                          : idx === 1
                          ? 'bg-blue-600/80 text-white'
                          : 'bg-purple-600/80 text-white';

                      return (
                        <div key={sc.score} className={`p-3 rounded-xl border ${cardStyle}`}>
                          <span
                            className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mb-1 ${badgeStyle}`}
                          >
                            {idx === 0 ? '★ SCORE #1' : `SCORE #${idx + 1}`}
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider">
                            {sc.score}
                          </div>
                          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                            {normVal}%
                          </div>
                          <div className="text-[10px] text-slate-300 truncate mt-0.5">{sc.label}</div>
                          <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Matrice: {sc.probability}%</span>
                            {sc.odds && (
                              <strong className="text-amber-400">@{sc.odds.toFixed(2)}</strong>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 73% Normalized Progress Bar for Exact Score */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        style={{ width: `${(nProbs[0] / 73) * 100}%` }}
                        className="h-full bg-emerald-500 transition-all duration-500"
                        title={`Score ${top3[0].score}: ${nProbs[0]}%`}
                      />
                      <div
                        style={{ width: `${(nProbs[1] / 73) * 100}%` }}
                        className="h-full bg-blue-500 transition-all duration-500"
                        title={`Score ${top3[1].score}: ${nProbs[1]}%`}
                      />
                      <div
                        style={{ width: `${(nProbs[2] / 73) * 100}%` }}
                        className="h-full bg-purple-500 transition-all duration-500"
                        title={`Score ${top3[2].score}: ${nProbs[2]}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span className="text-emerald-400 font-bold">
                        {top3[0].score} = {nProbs[0]}%
                      </span>
                      <span className="text-blue-400 font-bold">
                        {top3[1].score} = {nProbs[1]}%
                      </span>
                      <span className="text-purple-400 font-bold">
                        {top3[2].score} = {nProbs[2]}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4 New Goal & Score Markets Quick Summary */}
            {currentPrediction.topExactScores && currentPrediction.totalGoals && currentPrediction.overUnder && currentPrediction.ggNg && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {/* 1. Top 2 Score Exact */}
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    Top 2 Score Exact (73%)
                  </span>
                  <div className="flex items-center justify-between mt-1 font-mono">
                    {currentPrediction.topExactScores.slice(0, 2).map((sc) => (
                      <span
                        key={sc.score}
                        className="px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800/60 text-xs font-black text-white"
                      >
                        {sc.score}{' '}
                        <span className="text-[10px] text-emerald-400 font-normal">
                          ({sc.normalizedProb ?? sc.probability}%)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Total Nombre de Buts */}
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Total Nombre de Buts
                  </span>
                  <div className="text-xs font-black text-white font-mono mt-1 flex items-center justify-between">
                    <span>{currentPrediction.totalGoals.mostLikelyRange}</span>
                    <span className="text-emerald-400">{currentPrediction.totalGoals.mostLikelyRangeProb}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Exact favori : <strong className="text-slate-200">{currentPrediction.totalGoals.mostLikelyExactGoals}</strong> ({currentPrediction.totalGoals.mostLikelyExactProb}%)
                  </div>
                </div>

                {/* 3. Plus ou Moins (+/-) */}
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Plus ou Moins (+/-)
                  </span>
                  <div className="text-xs font-black text-white font-mono mt-1 flex items-center justify-between">
                    <span>{currentPrediction.overUnder.mainPick}</span>
                    <span className="text-emerald-400">{currentPrediction.overUnder.mainPickProb}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    +1.5: {currentPrediction.overUnder.lines.line15.probOver}% · +2.5: {currentPrediction.overUnder.over25Prob}%
                  </div>
                </div>

                {/* 4. GG / NG */}
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                    GG / NG (Les 2 Marquent)
                  </span>
                  <div className="text-xs font-black text-white font-mono mt-1 flex items-center justify-between">
                    <span className={currentPrediction.ggNg.recommended === 'GG' ? 'text-emerald-400' : 'text-rose-400'}>
                      Choix : {currentPrediction.ggNg.recommended}
                    </span>
                    <span className="text-white">
                      {currentPrediction.ggNg.recommended === 'GG' ? currentPrediction.ggNg.probGG : currentPrediction.ggNg.probNG}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    GG: {currentPrediction.ggNg.probGG}% · NG: {currentPrediction.ggNg.probNG}%
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Primary Action Button: [ 🔍 LANCER ANALYSE ] */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onTriggerAnalysis}
            className="w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wide shadow-xl shadow-blue-500/25 transition active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>🔍 LANCER ANALYSE</span>
          </button>
        </div>

        {/* DONNÉES UTILISÉES & DONNÉES MANQUANTES */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Used Data */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-300 uppercase tracking-wide block">
              DONNÉES UTILISÉES
            </span>
            <ul className="space-y-1 text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <span>✓</span>
                <span>Rang & Classement</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <span>✓</span>
                <span>Forme récente (5 derniers matchs)</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <span>✓</span>
                <span>Cotes du marché Bet261</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <span>✓</span>
                <span>Données du match & avantage terrain</span>
              </li>
            </ul>
          </div>

          {/* Missing Data */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-amber-400 uppercase tracking-wide block">
              DONNÉES MANQUANTES
            </span>
            {currentPrediction?.missingData && currentPrediction.missingData.length > 0 ? (
              <ul className="space-y-1 text-slate-400">
                {currentPrediction.missingData.map((m, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-400">⚠️</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-slate-400 text-xs italic">
                Profil complet synchronisé. Aucune donnée critique absente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Detailed Prediction Card if generated */}
      {currentPrediction && (
        <PredictionResultCard
          prediction={currentPrediction}
          onSaveToHistory={onSavePrediction}
          onRecordActualResult={onUpdateActualResult}
        />
      )}
    </div>
  );
};
