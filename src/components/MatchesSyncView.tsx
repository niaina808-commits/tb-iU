import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  ExternalLink,
  ArrowRight,
  FileText,
  Radio,
  CheckCircle2,
  Layers,
  Trophy,
  Zap
} from 'lucide-react';
import {
  VirtualMatch,
  Team,
  VirtualRoundSummary,
  VirtualMatchResult,
  SavedCombineTicket,
  CombineStatus
} from '../types/league';
import { findTeamByName } from '../utils/mockLeagueData';
import { SyncSpeedSec } from './Header';
import { TeamBadge, LeagueBadge } from './TeamBadge';
import { TopCombineSection } from './TopCombineSection';

interface MatchesSyncViewProps {
  matches: VirtualMatch[];
  teams: Team[];
  rounds?: VirtualRoundSummary[];
  recentResults?: VirtualMatchResult[];
  activeRoundNumber?: number;
  isRealTimeSynced?: boolean;
  isSyncing: boolean;
  lastSyncTime: string;
  syncDurationMs?: number;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  syncSpeedSec?: SyncSpeedSec;
  onChangeSyncSpeed?: (speed: SyncSpeedSec) => void;
  onSync: () => void;
  onSelectRound?: (roundId: number, eventCategoryId: number) => void;
  onSelectMatchToAnalyze: (match: VirtualMatch) => void;
  onManualImportSubmit: (text: string) => void;
  combineHistory?: SavedCombineTicket[];
  autoMarkCombinesEnabled?: boolean;
  onToggleAutoMarkCombines?: () => void;
  onSaveCombineTicket?: (ticket: SavedCombineTicket) => void;
  onUpdateCombineStatus?: (ticketId: string, status: CombineStatus) => void;
  onToggleCombineSelectionStatus?: (ticketId: string, selectionIndex: number) => void;
  onDeleteCombineTicket?: (ticketId: string) => void;
  onOpenFullHistory?: () => void;
}

export const MatchesSyncView: React.FC<MatchesSyncViewProps> = ({
  matches,
  teams,
  rounds = [],
  recentResults = [],
  activeRoundNumber = 1,
  isRealTimeSynced = true,
  isSyncing,
  lastSyncTime,
  syncDurationMs = 0,
  autoSyncEnabled = true,
  onToggleAutoSync,
  syncSpeedSec = 3,
  onChangeSyncSpeed,
  onSync,
  onSelectRound,
  onSelectMatchToAnalyze,
  onManualImportSubmit,
  combineHistory = [],
  autoMarkCombinesEnabled = true,
  onToggleAutoMarkCombines,
  onSaveCombineTicket,
  onUpdateCombineStatus,
  onToggleCombineSelectionStatus,
  onDeleteCombineTicket,
  onOpenFullHistory
}) => {
  const [showImportBox, setShowImportBox] = useState(false);
  const [importText, setImportText] = useState('');
  const [filterText, setFilterText] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [countdownStr, setCountdownStr] = useState<string>('');

  // Keep selectedRoundId aligned with active round when Bet261 advances rounds
  useEffect(() => {
    if (rounds.length > 0 && selectedRoundId) {
      const stillExists = rounds.some(r => r.id === selectedRoundId);
      if (!stillExists) {
        setSelectedRoundId(null);
      }
    }
  }, [rounds, selectedRoundId]);

  // Live countdown to active match expectedStartIso
  useEffect(() => {
    const targetIso = matches[0]?.expectedStartIso;
    if (!targetIso) {
      setCountdownStr('');
      return;
    }

    const updateTimer = () => {
      const diffSec = Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000);
      if (diffSec > 0) {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        setCountdownStr(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else if (diffSec > -90) {
        setCountdownStr('EN DIRECT');
      } else {
        setCountdownStr('Terminé');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [matches]);

  const filteredMatches = matches.filter(m =>
    m.homeTeam.toLowerCase().includes(filterText.toLowerCase()) ||
    m.awayTeam.toLowerCase().includes(filterText.toLowerCase()) ||
    m.matchNumber.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    onManualImportSubmit(importText);
    setImportText('');
    setShowImportBox(false);
  };

  const currentRoundDisplay = matches[0]?.round || activeRoundNumber;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-slate-950 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                <LeagueBadge size="lg" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Synchronisation Matchs Instant League 8035
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                    isRealTimeSynced
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    <Radio className="w-3 h-3" />
                    {isRealTimeSynced ? 'API BET261 DIRECT' : 'MODE SECOURS'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                  <a
                    href="https://bet261.mg/virtual/category/instant-league/8035/matches"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Matchs : bet261.mg/.../8035/matches</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://bet261.mg/virtual/category/instant-league/8035/ranking"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Classement : bet261.mg/.../8035/ranking</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Trigger & Auto-Sync Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {onToggleAutoSync && (
              <div className="flex items-center bg-slate-950 border border-emerald-500/40 rounded-xl p-1">
                <button
                  onClick={onToggleAutoSync}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    autoSyncEnabled
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                  title="Actualisation automatique ultra-rapide Bet261"
                >
                  <Zap className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'fill-current animate-bounce' : ''}`} />
                  <span>Auto-Sync {autoSyncEnabled ? 'TURBO ON' : 'OFF'}</span>
                </button>
                {autoSyncEnabled && onChangeSyncSpeed && (
                  <select
                    value={syncSpeedSec}
                    onChange={(e) => onChangeSyncSpeed(Number(e.target.value) as SyncSpeedSec)}
                    className="bg-transparent text-emerald-300 text-xs font-mono font-bold px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value={3} className="bg-slate-900 text-white">⚡ 3s (Max)</option>
                    <option value={5} className="bg-slate-900 text-white">🚀 5s (Rapide)</option>
                    <option value={10} className="bg-slate-900 text-white">🔄 10s (Eco)</option>
                  </select>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedRoundId(null);
                onSync();
              }}
              disabled={isSyncing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation...' : '🔄 SYNCHRONISER MAINTENANT'}</span>
            </button>

            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition cursor-pointer"
              title="Import manuel de données Bet261"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Info Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-200 font-semibold">Journée #{currentRoundDisplay}</span>
            </span>
            <span>
              Dernière synchro : <strong className="text-white font-mono">{lastSyncTime || 'À l\'instant'}</strong>
              {syncDurationMs > 0 && (
                <span className="ml-1.5 text-[11px] font-mono text-emerald-400">({syncDurationMs}ms)</span>
              )}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 font-mono text-[11px] font-bold">
              {autoSyncEnabled ? `⚡ Flux Direct SSE + ${syncSpeedSec}s` : 'Manuel'}
            </span>
            {countdownStr && (
              <span className="px-2.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/70 text-blue-300 font-mono font-bold">
                Départ : {countdownStr}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>Matchs journée : <strong className="text-blue-400">{matches.length}</strong></span>
            <span>Équipes classées : <strong className="text-emerald-400">{teams.length}</strong></span>
          </div>
        </div>

        {/* Round Picker from Bet261 Instant League 8035 */}
        {rounds.length > 1 && onSelectRound && (
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Journées Programmées sur Bet261 (Cliquez pour charger une journée) :</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {rounds.map((r, idx) => {
                const isSelected = selectedRoundId ? selectedRoundId === r.id : idx === 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRoundId(r.id);
                      onSelectRound(r.id, r.eventCategoryId);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Journée {r.roundNumber}</span>
                    <span className="text-[10px] opacity-80 font-mono">({r.scheduledTime.slice(0, 5)})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Import Drawer if opened */}
        {showImportBox && (
          <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Importation Manuelle de Données Bet261 (Fallback)
              </span>
              <span className="text-[11px] text-slate-500">
                Collez le texte brut ou le tableau copié de bet261.mg
              </span>
            </div>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Exemple : 1 Spurs 3 3 0 0 9..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportBox(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleImportSubmit}
                className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Intégrer les données
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Combiné de la Journée sélectionnée */}
      <TopCombineSection
        matches={matches}
        teams={teams}
        recentResults={recentResults}
        activeRoundNumber={currentRoundDisplay}
        onSelectMatch={onSelectMatchToAnalyze}
        combineHistory={combineHistory}
        autoMarkCombinesEnabled={autoMarkCombinesEnabled}
        onToggleAutoMarkCombines={onToggleAutoMarkCombines}
        onSaveCombineTicket={onSaveCombineTicket}
        onUpdateCombineStatus={onUpdateCombineStatus}
        onToggleCombineSelectionStatus={onToggleCombineSelectionStatus}
        onDeleteCombineTicket={onDeleteCombineTicket}
        onOpenFullHistory={onOpenFullHistory}
      />

      {/* Filter / Search */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Matchs Disponibles — Journée #{currentRoundDisplay} ({filteredMatches.length})
        </h3>
        <input
          type="text"
          placeholder="Filtrer par équipe..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none w-48"
        />
      </div>

      {/* Match Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.map((m) => {
          const homeTeam = findTeamByName(m.homeTeam, teams);
          const awayTeam = findTeamByName(m.awayTeam, teams);

          return (
            <div
              key={m.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/80">
                    {m.matchNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{m.scheduledTime}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {m.isLiveApi && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
                      BET261 LIVE
                    </span>
                  )}
                  {m.status === 'live' ? (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      EN DIRECT
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">À venir</span>
                  )}
                </div>
              </div>

              {/* Teams Display (with official Bet261 Instant League 8035 badges) */}
              <div className="space-y-2.5 mb-4">
                {/* Home */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TeamBadge teamName={m.homeTeam} size="md" />
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                        {m.homeTeam}
                      </span>
                      {homeTeam && (
                        <div className="text-[11px] text-slate-400">
                          Rang #{homeTeam.rank} · {homeTeam.points} pts ({homeTeam.won}V-{homeTeam.drawn}N-{homeTeam.lost}D) · Forme: {homeTeam.recentForm.slice(-5).join('-') || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                  {m.odds && (
                    <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                      {m.odds.home.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TeamBadge teamName={m.awayTeam} size="md" />
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                        {m.awayTeam}
                      </span>
                      {awayTeam && (
                        <div className="text-[11px] text-slate-400">
                          Rang #{awayTeam.rank} · {awayTeam.points} pts ({awayTeam.won}V-{awayTeam.drawn}N-{awayTeam.lost}D) · Forme: {awayTeam.recentForm.slice(-5).join('-') || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                  {m.odds && (
                    <span className="font-mono text-xs font-bold text-purple-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                      {m.odds.away.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Extra Market Odds Row (Double Chance / +/- 2.5 / GG-NG) */}
              {m.odds && (m.odds.doubleChance1X || m.odds.over25 || m.odds.bttsYes) && (
                <div className="mb-3 px-2.5 py-2 rounded-lg bg-slate-950/70 border border-slate-800/70 space-y-1.5 text-[11px] text-slate-400 font-mono">
                  {m.odds.doubleChance1X && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>DC 1X: <strong className="text-slate-200">{m.odds.doubleChance1X.toFixed(2)}</strong></span>
                      <span>DC X2: <strong className="text-slate-200">{m.odds.doubleChanceX2?.toFixed(2)}</strong></span>
                      <span>DC 12: <strong className="text-slate-200">{m.odds.doubleChance12?.toFixed(2)}</strong></span>
                    </div>
                  )}
                  {(m.odds.over25 || m.odds.bttsYes) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/70">
                      {m.odds.over25 && m.odds.under25 && (
                        <span>
                          +/- 2.5: <strong className="text-emerald-400">+{m.odds.over25.toFixed(2)}</strong> / <strong className="text-blue-400">-{m.odds.under25.toFixed(2)}</strong>
                        </span>
                      )}
                      {m.odds.bttsYes && m.odds.bttsNo && (
                        <span>
                          GG/NG: <strong className="text-emerald-400">{m.odds.bttsYes.toFixed(2)}</strong> / <strong className="text-rose-400">{m.odds.bttsNo.toFixed(2)}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Odds Footer & Action */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {m.odds && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Nul (X) :</span>
                    <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {m.odds.draw.toFixed(2)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => onSelectMatchToAnalyze(m)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer ml-auto"
                >
                  <span>Analyser ce match</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Official Results from Bet261 Instant League 8035 */}
      {recentResults.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Derniers Résultats Officiels Synchronisés (Instant League 8035)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Journée #{recentResults[0]?.roundNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {recentResults.slice(0, 10).map((res) => (
              <div
                key={res.id}
                className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col justify-between text-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Journée {res.roundNumber}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    res.outcome === '1' ? 'bg-blue-950 text-blue-400' :
                    res.outcome === '2' ? 'bg-purple-950 text-purple-400' :
                    'bg-amber-950 text-amber-400'
                  }`}>
                    Issue : {res.outcome}
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold text-white gap-1">
                  <span className="flex items-center gap-1 truncate max-w-[95px]">
                    <TeamBadge teamName={res.homeTeam} size="xs" />
                    <span className="truncate">{res.homeTeam}</span>
                  </span>
                  <span className="font-mono font-black text-emerald-400 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 shrink-0">
                    {res.score}
                  </span>
                  <span className="flex items-center justify-end gap-1 truncate max-w-[95px] text-right">
                    <span className="truncate">{res.awayTeam}</span>
                    <TeamBadge teamName={res.awayTeam} size="xs" />
                  </span>
                </div>
                {res.halfTimeScore && (
                  <div className="text-[10px] text-slate-500 text-center mt-1 font-mono">
                    Mi-temps : {res.halfTimeScore}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
