import React, { useMemo, useState } from 'react';
import {
  Trophy,
  ShieldCheck,
  Zap,
  Flame,
  Copy,
  Check,
  Sparkles,
  Calculator,
  BookmarkPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  History,
  RotateCcw
} from 'lucide-react';
import {
  VirtualMatch,
  Team,
  SavedCombineTicket,
  CombineStatus,
  VirtualMatchResult
} from '../types/league';
import {
  CombineTicket,
  CombineSelectionItem,
  generateTopCombinesForRound,
  findMatchResultForSelection,
  evaluatePickWithMatchResult,
  buildSavedCombineTicket
} from '../utils/combineGenerator';
import { TeamBadge, LeagueBadge } from './TeamBadge';

export type { CombineTicket, CombineSelectionItem };

interface TopCombineSectionProps {
  matches: VirtualMatch[];
  teams: Team[];
  recentResults?: VirtualMatchResult[];
  activeRoundNumber?: number;
  onSelectMatch?: (match: VirtualMatch) => void;
  combineHistory?: SavedCombineTicket[];
  autoMarkCombinesEnabled?: boolean;
  onToggleAutoMarkCombines?: () => void;
  onSaveCombineTicket?: (ticket: SavedCombineTicket) => void;
  onUpdateCombineStatus?: (ticketId: string, status: CombineStatus) => void;
  onToggleCombineSelectionStatus?: (ticketId: string, selectionIndex: number) => void;
  onDeleteCombineTicket?: (ticketId: string) => void;
  onOpenFullHistory?: () => void;
}

export const TopCombineSection: React.FC<TopCombineSectionProps> = ({
  matches,
  teams,
  recentResults = [],
  activeRoundNumber = 1,
  onSelectMatch,
  combineHistory = [],
  autoMarkCombinesEnabled = true,
  onToggleAutoMarkCombines,
  onSaveCombineTicket,
  onUpdateCombineStatus,
  onToggleCombineSelectionStatus,
  onDeleteCombineTicket,
  onOpenFullHistory
}) => {
  const [activeTicketId, setActiveTicketId] = useState<'safe' | 'value' | 'jackpot'>('safe');
  const [stakeAriary, setStakeAriary] = useState<number>(2000);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');

  const tickets = useMemo<CombineTicket[]>(() => {
    return generateTopCombinesForRound(matches, teams);
  }, [matches, teams]);

  const currentTicket = tickets.find((t) => t.id === activeTicketId) || tickets[0];

  const handleCopyTicket = (ticket: CombineTicket) => {
    const lines = [
      `🏆 BET261 INSTANT LEAGUE 8035 - ${ticket.title.toUpperCase()} (Journée #${activeRoundNumber})`,
      ...ticket.selections.map(
        (s, idx) =>
          `${idx + 1}. ${s.match.homeTeam} vs ${s.match.awayTeam} ➔ ${s.pickLabel} (@${s.odds.toFixed(2)} | ${s.probability}%)`
      ),
      `📊 Cote Totale : ${ticket.totalOdds.toFixed(2)} | Confiance Moyenne : ${ticket.confidenceScore}%`,
      `💰 Gain potentiel pour ${stakeAriary.toLocaleString('fr-FR')} Ar : ${Math.round(
        stakeAriary * ticket.totalOdds
      ).toLocaleString('fr-FR')} Ar`
    ];
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveTicket = (ticket: CombineTicket) => {
    if (!onSaveCombineTicket) return;
    const savedTicket = buildSavedCombineTicket(
      ticket,
      activeRoundNumber,
      stakeAriary,
      recentResults,
      undefined,
      matches[0]?.eventCategoryId
    );
    onSaveCombineTicket({
      ...savedTicket,
      id: `COMB-J${activeRoundNumber}-${ticket.id.toUpperCase()}-${Date.now()}`
    });
    setJustSavedId(ticket.id);
    setTimeout(() => setJustSavedId(null), 2500);
  };

  if (!currentTicket || currentTicket.selections.length === 0) {
    return null;
  }

  const potentialWin = Math.round(stakeAriary * currentTicket.totalOdds);

  // Statistics for saved combinés
  const wonCount = combineHistory.filter((c) => c.status === 'won').length;
  const lostCount = combineHistory.filter((c) => c.status === 'lost').length;
  const pendingCount = combineHistory.filter((c) => c.status === 'pending').length;
  const evaluatedCombineCount = wonCount + lostCount;
  const combineWinRate =
    evaluatedCombineCount > 0 ? Math.round((wonCount / evaluatedCombineCount) * 100) : 0;

  const netProfitAriary = combineHistory.reduce((acc, c) => {
    if (c.status === 'won') return acc + (c.potentialWinAriary - c.stakeAriary);
    if (c.status === 'lost') return acc - c.stakeAriary;
    return acc;
  }, 0);

  // Find the most recently evaluated ticket matching activeTicketId (e.g. from Journée #N-1)
  const latestEvaluatedForActiveTab = combineHistory.find(
    (c) => c.ticketType === activeTicketId && c.status !== 'pending'
  );

  // Sort by newest round first (with user-saved COMB- tickets first in the same round)
  const filteredCombineHistory = [...combineHistory]
    .filter((c) => {
      if (historyFilter === 'all') return true;
      return c.status === historyFilter;
    })
    .sort((a, b) => {
      if (b.roundNumber !== a.roundNumber) return b.roundNumber - a.roundNumber;
      const aUser = a.id.startsWith('COMB-') ? 1 : 0;
      const bUser = b.id.startsWith('COMB-') ? 1 : 0;
      return bUser - aUser;
    });

  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0c1428] to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-center">
            <LeagueBadge size="md" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>TOP COMBINÉ DE LA JOURNÉE #{activeRoundNumber}</span>
              </h3>
              <button
                type="button"
                onClick={onToggleAutoMarkCombines}
                title="Activer ou désactiver le marquage automatique Gagné / Perdu des combinés"
                className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase transition cursor-pointer flex items-center gap-1.5 ${
                  autoMarkCombinesEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoMarkCombinesEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>
                  ⚡ Auto-Marquage Gagné / Perdu : {autoMarkCombinesEnabled ? 'ACTIF' : 'MANUEL'}
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Validation automatique sur les scores officiels Bet261 8035 + correction manuelle (Gagné ✅ / Perdu ❌) verrouillable
            </p>
          </div>
        </div>

        {/* Save & Copy Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onSaveCombineTicket && (
            <button
              onClick={() => handleSaveTicket(currentTicket)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {justSavedId === currentTicket.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistré dans Historique !</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>💾 Enregistrer ce Combiné</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => handleCopyTicket(currentTicket)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            {copiedId === currentTicket.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Ticket Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Ticket Mode Tabs (Safe / Value / Jackpot) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {tickets.map((t) => {
          const isActive = t.id === activeTicketId;
          const Icon = t.id === 'safe' ? ShieldCheck : t.id === 'value' ? Zap : Flame;
          const maxCapLabel = t.id === 'safe' ? '≤ 4.00' : t.id === 'value' ? '≤ 7.00' : '≤ 15.00';
          const lastRoundTicket = combineHistory.find(
            (c) => c.ticketType === t.id && c.status !== 'pending'
          );
          const accentClass =
            t.id === 'safe'
              ? isActive
                ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-500/15'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              : t.id === 'value'
              ? isActive
                ? 'bg-blue-950/80 border-blue-500 text-white shadow-lg shadow-blue-500/15'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              : isActive
              ? 'bg-amber-950/80 border-amber-500 text-white shadow-lg shadow-amber-500/15'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white';

          return (
            <button
              key={t.id}
              onClick={() => setActiveTicketId(t.id)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${accentClass}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    t.id === 'safe'
                      ? 'text-emerald-400'
                      : t.id === 'value'
                      ? 'text-blue-400'
                      : 'text-amber-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                    <span>{t.title.replace(' (Recommandé)', '')}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-900/90 text-amber-300 border border-amber-500/30">
                      Cote {maxCapLabel}
                    </span>
                    {lastRoundTicket && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${
                          lastRoundTicket.status === 'won'
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        J#{lastRoundTicket.roundNumber} {lastRoundTicket.status === 'won' ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-80 font-mono mt-0.5">
                    {t.selections.length} matchs • Fiabilité {t.confidenceScore}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold opacity-75 block">
                  Cote ({maxCapLabel})
                </span>
                <span className="text-base font-black font-mono text-amber-400">
                  {t.totalOdds.toFixed(2)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Banner showing the Auto-Marked Result of the Just-Completed Round for this Ticket Type */}
      {latestEvaluatedForActiveTab && (
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            latestEvaluatedForActiveTab.status === 'won'
              ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${
                latestEvaluatedForActiveTab.status === 'won'
                  ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                  : 'bg-rose-500/25 border-rose-400/50 text-rose-300'
              }`}
            >
              {latestEvaluatedForActiveTab.status === 'won' ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>DERNIÈRE JOURNÉE #{latestEvaluatedForActiveTab.roundNumber} : GAGNÉ ✅</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  <span>DERNIÈRE JOURNÉE #{latestEvaluatedForActiveTab.roundNumber} : PERDU ❌</span>
                </>
              )}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
              {latestEvaluatedForActiveTab.selections.map((s, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded border ${
                    s.status === 'won'
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {s.homeTeam.split(' ')[0]}-{s.awayTeam.split(' ')[0]} ({s.pickCode}){' '}
                  <strong>[{s.actualScore || '—'}]</strong> {s.status === 'won' ? '✓' : '✗'}
                </span>
              ))}
            </div>
          </div>
          {onUpdateCombineStatus && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onUpdateCombineStatus(latestEvaluatedForActiveTab.id, 'won')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                  latestEvaluatedForActiveTab.status === 'won'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-emerald-300'
                }`}
              >
                ✅ Gagné
              </button>
              <button
                onClick={() => onUpdateCombineStatus(latestEvaluatedForActiveTab.id, 'lost')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                  latestEvaluatedForActiveTab.status === 'lost'
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-rose-300'
                }`}
              >
                ❌ Perdu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selections List for Upcoming / Active Round */}
      <div className="space-y-2.5">
        {currentTicket.selections.map((item, idx) => {
          const liveResult = findMatchResultForSelection(
            {
              roundNumber: item.match.round || activeRoundNumber,
              homeTeam: item.match.homeTeam,
              awayTeam: item.match.awayTeam
            },
            recentResults
          );
          const liveStatus: CombineStatus = liveResult
            ? evaluatePickWithMatchResult(item.pickCode, liveResult)
            : 'pending';

          return (
            <div
              key={`${item.match.id}-${idx}`}
              onClick={() => onSelectMatch && onSelectMatch(item.match)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                liveStatus === 'won'
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : liveStatus === 'lost'
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : 'bg-slate-950/90 hover:bg-slate-900/90 border-slate-800/90 hover:border-blue-500/40'
              }`}
            >
              {/* Left: Match & Teams with Official Badges */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white group-hover:text-blue-300 transition">
                      <TeamBadge teamName={item.match.homeTeam} size="sm" />
                      <span>{item.match.homeTeam}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">vs</span>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white group-hover:text-purple-300 transition">
                      <TeamBadge teamName={item.match.awayTeam} size="sm" />
                      <span>{item.match.awayTeam}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                      {item.match.matchNumber}
                    </span>
                    {liveResult ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                          liveStatus === 'won'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        Score {liveResult.score} • {liveStatus === 'won' ? '✅ GAGNÉ' : '❌ PERDU'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/70 border border-blue-800/60 text-blue-300">
                        ⏳ Départ {item.match.scheduledTime}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-blue-400 font-semibold">{item.marketLabel}</span>
                    <span>•</span>
                    <span>{item.rationale}</span>
                  </div>
                </div>
              </div>

              {/* Right: Recommended Pick, Probability & Odds */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                <div className="text-left sm:text-right">
                  <div className="text-xs font-black text-emerald-400 flex items-center sm:justify-end gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{item.pickLabel}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Probabilité estimée : <strong className="text-white">{item.probability}%</strong>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-sm shrink-0">
                  @{item.odds.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Summary & Stake Calculator Footer */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Stake Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mr-1">
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>Mise (Ar) :</span>
          </div>
          {[1000, 2000, 5000, 10000, 20000].map((preset) => (
            <button
              key={preset}
              onClick={() => setStakeAriary(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                stakeAriary === preset
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {preset.toLocaleString('fr-FR')}
            </button>
          ))}
        </div>

        {/* Total Odds & Potential Payout */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          <div className="text-xs">
            <span className="text-slate-400 block">Cote Totale Combiné</span>
            <strong className="text-lg font-black font-mono text-amber-400">
              {currentTicket.totalOdds.toFixed(2)}
            </strong>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="text-xs">
            <span className="text-slate-400 block">Fiabilité Moyenne</span>
            <strong className="text-base font-black font-mono text-blue-400">
              {currentTicket.confidenceScore}%
            </strong>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-right">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Gain Potentiel Estimé
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-white">
              {potentialWin.toLocaleString('fr-FR')} Ar
            </span>
          </div>
        </div>
      </div>

      {/* Historique des Combinés (Auto-Marqué Gagné / Perdu / En cours) */}
      <div className="pt-4 border-t border-slate-800/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <History className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Historique des Combinés — Auto-Marqués (Gagné ✅ / Perdu ❌)
            </h4>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
              {autoMarkCombinesEnabled ? '⚡ AUTO-MARQUAGE ACTIF' : '✋ MODE MANUEL'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
              ✅ Gagnés : {wonCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono font-bold">
              ❌ Perdus : {lostCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono font-bold">
              ⏳ En cours : {pendingCount}
            </span>
            {evaluatedCombineCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 font-mono font-bold">
                Réussite : {combineWinRate}%
              </span>
            )}
            {evaluatedCombineCount > 0 && (
              <span
                className={`px-2.5 py-1 rounded-lg font-mono font-black border ${
                  netProfitAriary >= 0
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                }`}
              >
                Bilan : {netProfitAriary >= 0 ? '+' : ''}
                {netProfitAriary.toLocaleString('fr-FR')} Ar
              </span>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        {combineHistory.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'won', 'lost', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    historyFilter === f
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all'
                    ? `Tous (${combineHistory.length})`
                    : f === 'won'
                    ? `✅ Gagnés (${wonCount})`
                    : f === 'lost'
                    ? `❌ Perdus (${lostCount})`
                    : `⏳ En cours (${pendingCount})`}
                </button>
              ))}
            </div>

            {onOpenFullHistory && (
              <button
                onClick={onOpenFullHistory}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Voir tout l'historique détaillé ({combineHistory.length}) →
              </button>
            )}
          </div>
        )}

        {/* Saved & Auto-Tracked Combiné Tickets List */}
        {combineHistory.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
            Synchronisation des combinés en cours avec Bet261 Instant League 8035...
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredCombineHistory.slice(0, 12).map((saved) => {
              const wonSelectionsCount = saved.selections.filter((s) => s.status === 'won').length;

              return (
                <div
                  key={saved.id}
                  className={`p-3.5 rounded-xl border transition ${
                    saved.status === 'won'
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                      : saved.status === 'lost'
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : 'bg-slate-950/85 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/70">
                    <div className="flex items-center gap-2 flex-wrap">
                      {saved.status === 'won' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {saved.manualOverride ? '✋ MARQUÉ : COMBINÉ GAGNÉ ✅' : '⚡ AUTO-MARQUÉ : COMBINÉ GAGNÉ ✅'}
                        </span>
                      )}
                      {saved.status === 'lost' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/25 text-rose-300 border border-rose-400/50 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {saved.manualOverride ? '✋ MARQUÉ : COMBINÉ PERDU ❌' : '⚡ AUTO-MARQUÉ : COMBINÉ PERDU ❌'}
                        </span>
                      )}
                      {saved.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          ⏳ EN ATTENTE RÉSULTATS (Journée #{saved.roundNumber})
                        </span>
                      )}

                      <span className="text-xs font-black text-white uppercase">
                        {saved.title.replace(' (Recommandé)', '')} • Journée #{saved.roundNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({wonSelectionsCount}/{saved.selections.length} validés • {saved.createdAt})
                      </span>
                    </div>

                    {/* Manual Override Controls (Gagné / Perdu / Réinitialiser Auto) & Delete */}
                    <div className="flex items-center gap-1.5">
                      {onUpdateCombineStatus && (
                        <>
                          <button
                            onClick={() => onUpdateCombineStatus(saved.id, 'won')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              saved.status === 'won'
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-300'
                            }`}
                            title="Verrouiller ce combiné comme Gagné"
                          >
                            ✅ Gagné
                          </button>
                          <button
                            onClick={() => onUpdateCombineStatus(saved.id, 'lost')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              saved.status === 'lost'
                                ? 'bg-rose-600 border-rose-400 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-500/60 hover:text-rose-300'
                            }`}
                            title="Verrouiller ce combiné comme Perdu"
                          >
                            ❌ Perdu
                          </button>
                          {saved.manualOverride && (
                            <button
                              onClick={() => onUpdateCombineStatus(saved.id, 'pending')}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-950/60 text-blue-400 border border-slate-700 transition cursor-pointer"
                              title="Réactiver la vérification automatique Bet261"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      {onDeleteCombineTicket && (
                        <button
                          onClick={() => onDeleteCombineTicket(saved.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 transition cursor-pointer"
                          title="Supprimer ce combiné"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selections inside the saved combiné (Clickable to toggle individual match Gagné/Perdu) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-2.5">
                    {saved.selections.map((sel, sIdx) => (
                      <div
                        key={`${saved.id}-sel-${sIdx}`}
                        onClick={() =>
                          onToggleCombineSelectionStatus &&
                          onToggleCombineSelectionStatus(saved.id, sIdx)
                        }
                        title="Cliquer pour basculer le statut (Gagné / Perdu / Auto) de ce match"
                        className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition cursor-pointer ${
                          sel.status === 'won'
                            ? 'bg-emerald-950/35 border-emerald-500/40 hover:border-emerald-400'
                            : sel.status === 'lost'
                            ? 'bg-rose-950/35 border-rose-500/40 hover:border-rose-400'
                            : 'bg-slate-900/90 border-slate-800/80 hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <TeamBadge teamName={sel.homeTeam} size="xs" />
                          <span className="font-semibold text-slate-200 truncate">{sel.homeTeam}</span>
                          <span className="text-[10px] text-slate-500">vs</span>
                          <TeamBadge teamName={sel.awayTeam} size="xs" />
                          <span className="font-semibold text-slate-200 truncate">{sel.awayTeam}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono">
                          <span className="text-[11px] font-bold text-blue-300">{sel.pickCode}</span>
                          <span className="text-[10px] text-amber-400">@{sel.odds.toFixed(2)}</span>
                          {sel.actualScore && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-white font-black border border-slate-700">
                              {sel.actualScore}
                            </span>
                          )}
                          {sel.status === 'won' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                              ✓ Gagné
                            </span>
                          )}
                          {sel.status === 'lost' && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black">
                              ✗ Perdu
                            </span>
                          )}
                          {sel.status === 'pending' && (
                            <span className="text-[10px] text-amber-400">⏳</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Saved Ticket Footer Info */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      Cote Totale : <strong className="text-amber-400">{saved.totalOdds.toFixed(2)}</strong> • Mise :{' '}
                      <strong className="text-white">{saved.stakeAriary.toLocaleString('fr-FR')} Ar</strong>
                    </div>
                    <div>
                      {saved.status === 'won' ? (
                        <span className="text-emerald-400 font-black">
                          ✅ GAIN REMPORTÉ : +{saved.potentialWinAriary.toLocaleString('fr-FR')} Ar
                        </span>
                      ) : saved.status === 'lost' ? (
                        <span className="text-rose-400 font-bold">
                          ❌ PERTE : -{saved.stakeAriary.toLocaleString('fr-FR')} Ar
                        </span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
