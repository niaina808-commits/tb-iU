import React, { useState } from 'react';
import { 
  History, Award, TrendingUp, CheckCircle2, XCircle, Clock, 
  Trash2, Download, Upload, Filter, BarChart2, ShieldCheck, ChevronRight, Trophy
} from 'lucide-react';
import { PredictionResult, ModelPerformanceStats, SavedCombineTicket, CombineStatus } from '../types/league';
import { TeamBadge, LeagueBadge } from './TeamBadge';

interface HistoryAndStatsViewProps {
  history: PredictionResult[];
  combineHistory?: SavedCombineTicket[];
  autoMarkCombinesEnabled?: boolean;
  onToggleAutoMarkCombines?: () => void;
  onUpdateActualResult: (predictionId: string, result: '1' | 'X' | '2') => void;
  onUpdateCombineStatus?: (ticketId: string, status: CombineStatus) => void;
  onToggleCombineSelectionStatus?: (ticketId: string, selectionIndex: number) => void;
  onDeleteCombineTicket?: (ticketId: string) => void;
  onClearCombineHistory?: () => void;
  onDeleteEntry: (predictionId: string) => void;
  onClearHistory: () => void;
  onImportHistory: (imported: PredictionResult[]) => void;
  onSelectPrediction: (prediction: PredictionResult) => void;
}

export const HistoryAndStatsView: React.FC<HistoryAndStatsViewProps> = ({
  history,
  combineHistory = [],
  autoMarkCombinesEnabled = true,
  onToggleAutoMarkCombines,
  onUpdateActualResult,
  onUpdateCombineStatus,
  onToggleCombineSelectionStatus,
  onDeleteCombineTicket,
  onClearCombineHistory,
  onDeleteEntry,
  onClearHistory,
  onImportHistory,
  onSelectPrediction
}) => {
  const [filterResult, setFilterResult] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [combineFilter, setCombineFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');

  // Combiné Stats
  const combineWon = combineHistory.filter(c => c.status === 'won').length;
  const combineLost = combineHistory.filter(c => c.status === 'lost').length;
  const combinePending = combineHistory.filter(c => c.status === 'pending').length;
  const combineEvaluated = combineWon + combineLost;
  const combineWinRate = combineEvaluated > 0 ? Number(((combineWon / combineEvaluated) * 100).toFixed(1)) : 0;
  const combineNetProfit = combineHistory.reduce((acc, c) => {
    if (c.status === 'won') return acc + (c.potentialWinAriary - c.stakeAriary);
    if (c.status === 'lost') return acc - c.stakeAriary;
    return acc;
  }, 0);

  const displayedCombineHistory = combineHistory.filter(c => {
    if (combineFilter === 'all') return true;
    return c.status === combineFilter;
  });

  // Compute model performance statistics
  const evaluatedList = history.filter(h => h.actualResult !== undefined);
  const correctList = evaluatedList.filter(h => h.actualResult === h.mostLikelyChoice);

  const totalEvaluated = evaluatedList.length;
  const totalCorrect = correctList.length;
  const accuracyPercent = totalEvaluated > 0 ? Number(((totalCorrect / totalEvaluated) * 100).toFixed(1)) : 0;

  // Breakdown by predicted choice
  const computeChoiceStats = (choice: '1' | 'X' | '2') => {
    const list = evaluatedList.filter(h => h.mostLikelyChoice === choice);
    const win = list.filter(h => h.actualResult === choice).length;
    const rate = list.length > 0 ? Number(((win / list.length) * 100).toFixed(1)) : 0;
    return { total: list.length, correct: win, rate };
  };

  const statsByChoice = {
    '1': computeChoiceStats('1'),
    'X': computeChoiceStats('X'),
    '2': computeChoiceStats('2')
  };

  // Breakdown by confidence index
  const computeConfStats = (conf: 'faible' | 'moyen' | 'élevé') => {
    const list = evaluatedList.filter(h => h.confidenceIndex === conf);
    const win = list.filter(h => h.actualResult === h.mostLikelyChoice).length;
    const rate = list.length > 0 ? Number(((win / list.length) * 100).toFixed(1)) : 0;
    return { total: list.length, correct: win, rate };
  };

  const statsByConf = {
    'élevé': computeConfStats('élevé'),
    'moyen': computeConfStats('moyen'),
    'faible': computeConfStats('faible')
  };

  // Filtered entries
  const displayedHistory = history.filter(h => {
    if (filterResult === 'evaluated') return h.actualResult !== undefined;
    if (filterResult === 'pending') return h.actualResult === undefined;
    return true;
  });

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `virtual_predictor_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Historique & Performance du Modèle (Module 8)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi des prédictions, validation des résultats réels et indicateurs de précision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-50 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter JSON</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Performance Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Accuracy rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">TAUX DE RÉUSSITE</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="py-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {accuracyPercent}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {totalCorrect} justes sur {totalEvaluated} matchs vérifiés
          </div>
        </div>

        {/* Card 2: Total Analyzed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">TOTAL PRÉDICTIONS</span>
            <BarChart2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="py-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {history.length}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {history.length - totalEvaluated} en attente de résultat
          </div>
        </div>

        {/* Card 3: Performance on High Confidence */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">CONFIANCE ÉLEVÉE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="py-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
              {statsByConf['élevé'].total > 0 ? `${statsByConf['élevé'].rate}%` : '—'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {statsByConf['élevé'].correct} / {statsByConf['élevé'].total} validés
          </div>
        </div>

        {/* Card 4: Most frequent Choice success */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">SUCCÈS PAR CHOIX</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xs space-y-1 py-1 font-mono">
            <div className="flex justify-between">
              <span className="text-blue-400">1 (Dom) :</span>
              <strong className="text-white">{statsByChoice['1'].rate}% ({statsByChoice['1'].correct}/{statsByChoice['1'].total})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400">X (Nul) :</span>
              <strong className="text-white">{statsByChoice['X'].rate}% ({statsByChoice['X'].correct}/{statsByChoice['X'].total})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">2 (Ext) :</span>
              <strong className="text-white">{statsByChoice['2'].rate}% ({statsByChoice['2'].correct}/{statsByChoice['2'].total})</strong>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIQUE DES COMBINÉS (GAGNÉ / PERDU) */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LeagueBadge size="sm" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Historique des Combinés (Gagné / Perdu)</span>
                </h3>
                {onToggleAutoMarkCombines && (
                  <button
                    type="button"
                    onClick={onToggleAutoMarkCombines}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase cursor-pointer transition ${
                      autoMarkCombinesEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    ⚡ Auto-Marquage : {autoMarkCombinesEnabled ? 'ACTIF' : 'MANUEL'}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Suivi automatique et manuel des tickets combinés Bet261 Instant League 8035
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
              ✅ Gagnés : {combineWon}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold">
              ❌ Perdus : {combineLost}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
              ⏳ En cours : {combinePending}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
              Réussite : {combineWinRate}%
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black border ${
                combineNetProfit >= 0
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
              }`}
            >
              Bilan : {combineNetProfit >= 0 ? '+' : ''}
              {combineNetProfit.toLocaleString('fr-FR')} Ar
            </span>
          </div>
        </div>

        {/* Filter bar for Combinés */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'won', 'lost', 'pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCombineFilter(f)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer border ${
                  combineFilter === f
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all'
                  ? `Tous (${combineHistory.length})`
                  : f === 'won'
                  ? `✅ Gagnés (${combineWon})`
                  : f === 'lost'
                  ? `❌ Perdus (${combineLost})`
                  : `⏳ En cours (${combinePending})`}
              </button>
            ))}
          </div>

          {combineHistory.length > 0 && onClearCombineHistory && (
            <button
              onClick={onClearCombineHistory}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider combinés</span>
            </button>
          )}
        </div>

        {/* Combiné List */}
        {displayedCombineHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun combiné dans cette catégorie. Enregistrez un ticket depuis la section{' '}
            <strong className="text-white">« Top Combiné de la Journée »</strong> sur l'Accueil ou dans Matchs Live.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {displayedCombineHistory.map((saved) => (
              <div
                key={saved.id}
                className={`p-4 transition ${
                  saved.status === 'won'
                    ? 'bg-emerald-950/15'
                    : saved.status === 'lost'
                    ? 'bg-rose-950/15'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    {saved.status === 'won' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        GAGNÉ ✅
                      </span>
                    )}
                    {saved.status === 'lost' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        PERDU ❌
                      </span>
                    )}
                    {saved.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        EN COURS ⏳
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-black text-white uppercase">
                      {saved.title.replace(' (Recommandé)', '')} • Journée #{saved.roundNumber}
                    </span>
                    <span className="text-xs font-mono text-slate-400">({saved.createdAt})</span>
                  </div>

                  {/* Action Buttons: Gagné / Perdu / En cours / Supprimer */}
                  <div className="flex items-center gap-1.5">
                    {onUpdateCombineStatus && (
                      <>
                        <button
                          onClick={() => onUpdateCombineStatus(saved.id, 'won')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            saved.status === 'won'
                              ? 'bg-emerald-600 border-emerald-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300'
                          }`}
                        >
                          ✅ Gagné
                        </button>
                        <button
                          onClick={() => onUpdateCombineStatus(saved.id, 'lost')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            saved.status === 'lost'
                              ? 'bg-rose-600 border-rose-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-rose-500/50 hover:text-rose-300'
                          }`}
                        >
                          ❌ Perdu
                        </button>
                        <button
                          onClick={() => onUpdateCombineStatus(saved.id, 'pending')}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            saved.status === 'pending'
                              ? 'bg-amber-600 border-amber-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          ⏳
                        </button>
                      </>
                    )}
                    {onDeleteCombineTicket && (
                      <button
                        onClick={() => onDeleteCombineTicket(saved.id)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Selections grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {saved.selections.map((sel, idx) => (
                    <div
                      key={`${saved.id}-${idx}`}
                      onClick={() =>
                        onToggleCombineSelectionStatus &&
                        onToggleCombineSelectionStatus(saved.id, idx)
                      }
                      title="Cliquer pour basculer le statut (Gagné / Perdu / Auto) de ce match"
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition cursor-pointer ${
                        sel.status === 'won'
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : sel.status === 'lost'
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : 'bg-slate-950 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <TeamBadge teamName={sel.homeTeam} size="xs" />
                        <span className="font-bold text-white truncate">{sel.homeTeam}</span>
                        <span className="text-slate-500 text-[10px]">vs</span>
                        <TeamBadge teamName={sel.awayTeam} size="xs" />
                        <span className="font-bold text-white truncate">{sel.awayTeam}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="text-blue-400 font-bold">{sel.pickLabel}</span>
                        <span className="text-amber-400 font-bold">@{sel.odds.toFixed(2)}</span>
                        {sel.actualScore && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[10px] font-bold">
                            {sel.actualScore}
                          </span>
                        )}
                        {sel.status === 'won' && <span className="text-emerald-400 font-black">✓</span>}
                        {sel.status === 'lost' && <span className="text-rose-400 font-black">✗</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <div>
                    Cote Totale : <strong className="text-amber-400">{saved.totalOdds.toFixed(2)}</strong> • Mise :{' '}
                    <strong className="text-white">{saved.stakeAriary.toLocaleString('fr-FR')} Ar</strong>
                  </div>
                  <div>
                    {saved.status === 'won' ? (
                      <strong className="text-emerald-400">
                        GAIN : +{saved.potentialWinAriary.toLocaleString('fr-FR')} Ar
                      </strong>
                    ) : saved.status === 'lost' ? (
                      <strong className="text-rose-400">
                        PERTE : -{saved.stakeAriary.toLocaleString('fr-FR')} Ar
                      </strong>
                    ) : (
                      <span>
                        Gain potentiel :{' '}
                        <strong className="text-emerald-300">
                          {saved.potentialWinAriary.toLocaleString('fr-FR')} Ar
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Table & List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Historique des Matchs Analysés ({displayedHistory.length})
          </h3>

          {/* Filter segment */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterResult('all')}
              className={`px-3 py-1 rounded font-medium transition ${
                filterResult === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterResult('evaluated')}
              className={`px-3 py-1 rounded font-medium transition ${
                filterResult === 'evaluated' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vérifiés ({totalEvaluated})
            </button>
            <button
              onClick={() => setFilterResult('pending')}
              className={`px-3 py-1 rounded font-medium transition ${
                filterResult === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              En attente ({history.length - totalEvaluated})
            </button>
          </div>
        </div>

        {displayedHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Aucune analyse enregistrée dans cette vue. Scannez une capture ou lancez une prédiction !
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {displayedHistory.map((item) => {
              const hasActual = item.actualResult !== undefined;
              const isWin = hasActual && item.actualResult === item.mostLikelyChoice;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-800/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left: Info & Teams */}
                  <div className="space-y-1 cursor-pointer" onClick={() => onSelectPrediction(item)}>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(item.timestamp).toLocaleString('fr-FR')}</span>
                      {item.matchId && (
                        <span className="font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded text-[10px]">
                          {item.matchId}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <TeamBadge teamName={item.homeTeam} size="xs" />
                      <span className="text-blue-300">{item.homeTeam}</span>
                      <span className="text-slate-500 text-xs">VS</span>
                      <TeamBadge teamName={item.awayTeam} size="xs" />
                      <span className="text-purple-300">{item.awayTeam}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                      <span>1: <strong className="text-blue-400">{item.prob1}%</strong></span>
                      <span>X: <strong className="text-amber-400">{item.probX}%</strong></span>
                      <span>2: <strong className="text-purple-400">{item.prob2}%</strong></span>
                    </div>
                    {item.topExactScores && item.totalGoals && item.overUnder && item.ggNg && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300">
                          Top 2 CS: <strong>{item.topExactScores.slice(0, 2).map(s => s.score).join(' / ')}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/50 text-amber-300">
                          Buts: <strong>{item.totalGoals.mostLikelyRange}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/50 text-emerald-300">
                          +/-: <strong>{item.overUnder.mainPick}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950/50 border border-purple-800/50 text-purple-300">
                          GG/NG: <strong>{item.ggNg.recommended} ({item.ggNg.recommended === 'GG' ? item.ggNg.probGG : item.ggNg.probNG}%)</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Predicted vs Actual */}
                  <div className="flex items-center gap-4">
                    {/* Predicted */}
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Estimé</span>
                      <span className="inline-block mt-0.5 w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-300 font-bold text-sm leading-7">
                        {item.mostLikelyChoice}
                      </span>
                    </div>

                    {/* Actual Result Buttons */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase text-center mb-1">
                        Résultat Réel
                      </span>
                      <div className="flex items-center gap-1">
                        {(['1', 'X', '2'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => onUpdateActualResult(item.id, opt)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              item.actualResult === opt
                                ? opt === item.mostLikelyChoice
                                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm shadow-emerald-500/30'
                                  : 'bg-rose-600 border-rose-400 text-white shadow-sm shadow-rose-500/30'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="min-w-[85px] text-right">
                      {hasActual ? (
                        isWin ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Juste
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-400 flex items-center justify-end gap-1">
                            <XCircle className="w-4 h-4" /> Différent
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium italic">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectPrediction(item)}
                      title="Afficher le détail de la prédiction"
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(item.id)}
                      title="Supprimer cette ligne"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
