import React, { useState, useEffect } from 'react';
import { BarChart2, ExternalLink, ArrowRight, Zap, RefreshCw, Radio } from 'lucide-react';
import { Team, FormResult } from '../types/league';
import { calculateFormPoints } from '../utils/analysisEngine';
import { TeamBadge, LeagueBadge } from './TeamBadge';

interface RankingViewProps {
  teams: Team[];
  lastSyncTime: string;
  isSyncing?: boolean;
  isRealTimeSynced?: boolean;
  activeRoundNumber?: number;
  onSyncRanking?: () => void;
  onAnalyzeH2H: (homeTeam: Team, awayTeam: Team) => void;
}

export const RankingView: React.FC<RankingViewProps> = ({
  teams,
  lastSyncTime,
  isSyncing = false,
  isRealTimeSynced = true,
  activeRoundNumber = 1,
  onSyncRanking,
  onAnalyzeH2H
}) => {
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string>(teams[0]?.id || 'mci');
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string>(teams[1]?.id || 'liv');

  useEffect(() => {
    if (teams.length >= 2) {
      if (!teams.some(t => t.id === selectedHomeTeamId)) {
        setSelectedHomeTeamId(teams[0].id);
      }
      if (!teams.some(t => t.id === selectedAwayTeamId)) {
        setSelectedAwayTeamId(teams[1].id);
      }
    }
  }, [teams]);

  const homeTeam = teams.find(t => t.id === selectedHomeTeamId) || teams[0];
  const awayTeam = teams.find(t => t.id === selectedAwayTeamId) || teams[1];

  const homeFormPts = homeTeam ? calculateFormPoints(homeTeam.recentForm) : 7.5;
  const awayFormPts = awayTeam ? calculateFormPoints(awayTeam.recentForm) : 7.5;

  const renderFormBadge = (form: FormResult, idx: number) => {
    let bg = 'bg-slate-700 text-slate-300';
    if (form === 'V') bg = 'bg-emerald-600/90 text-white border-emerald-500/50';
    else if (form === 'N') bg = 'bg-amber-600/80 text-white border-amber-500/50';
    else if (form === 'D') bg = 'bg-rose-600/80 text-white border-rose-500/50';

    return (
      <span
        key={idx}
        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${bg}`}
      >
        {form}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-950 rounded-xl border border-emerald-500/30 flex items-center justify-center">
              <LeagueBadge size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Classement, Rang & Forme • Instant League 8035
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                  isRealTimeSynced
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  <Radio className="w-3 h-3" />
                  {isRealTimeSynced ? 'SYNCHRO BET261 LIVE' : 'CACHE LOCAL'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Source officielle :</span>
                <a
                  href="https://bet261.mg/virtual/category/instant-league/8035/ranking"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>bet261.mg/virtual/category/instant-league/8035/ranking</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs text-slate-400">
              Synchro : <strong className="text-white">{lastSyncTime || 'Synchronisé'}</strong>
            </div>
            {onSyncRanking && (
              <button
                onClick={onSyncRanking}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchro...' : '🔄 SYNCHRONISER RANG & FORME'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparative Tool */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Comparateur Automatique Face-à-Face (Head-to-Head)
            </h3>
          </div>
          <button
            onClick={() => onAnalyzeH2H(homeTeam, awayTeam)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer"
          >
            <span>Analyser ce Face-à-Face</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Team Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <label className="text-xs font-semibold text-blue-400 block mb-1">
              Équipe Domicile (1)
            </label>
            <select
              value={selectedHomeTeamId}
              onChange={(e) => setSelectedHomeTeamId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === selectedAwayTeamId}>
                  #{t.rank} - {t.name} ({t.points} pts · {t.won}V-{t.drawn}N-{t.lost}D)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <label className="text-xs font-semibold text-purple-400 block mb-1">
              Équipe Extérieure (2)
            </label>
            <select
              value={selectedAwayTeamId}
              onChange={(e) => setSelectedAwayTeamId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm focus:border-purple-500 focus:outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === selectedHomeTeamId}>
                  #{t.rank} - {t.name} ({t.points} pts · {t.won}V-{t.drawn}N-{t.lost}D)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparative Stats Visual Grid */}
        {homeTeam && awayTeam && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-center">
            {/* Home stats */}
            <div className="space-y-2.5 text-left sm:text-center">
              <div className="flex items-center justify-start sm:justify-center gap-2">
                <TeamBadge teamName={homeTeam.name} size="md" />
                <span className="text-base sm:text-lg font-black text-blue-400 truncate">{homeTeam.name}</span>
              </div>
              <div className="text-xs text-slate-300">Rang : <strong className="text-white">#{homeTeam.rank}</strong></div>
              <div className="text-xs text-slate-300">Points : <strong className="text-white">{homeTeam.points} pts</strong> ({homeTeam.played}m)</div>
              <div className="text-xs text-slate-300">Bilan : <strong className="text-emerald-400">{homeTeam.won}V</strong>-<strong className="text-amber-400">{homeTeam.drawn}N</strong>-<strong className="text-rose-400">{homeTeam.lost}D</strong></div>
              <div className="text-xs text-slate-300">Forme : <strong className="text-emerald-400">{homeFormPts.toFixed(1)}/15</strong></div>
              <div className="flex gap-1 justify-start sm:justify-center">
                {homeTeam.recentForm.length > 0 ? homeTeam.recentForm.map((f, i) => renderFormBadge(f, i)) : <span className="text-xs text-slate-500">Début de saison</span>}
              </div>
            </div>

            {/* Metric labels */}
            <div className="space-y-2.5 font-semibold text-xs text-slate-400 flex flex-col justify-center">
              <div className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">COMPARATIF</div>
              <div className="py-0.5 border-y border-slate-800">RANG / POSITION</div>
              <div className="py-0.5 border-y border-slate-800">POINTS & JOUÉS</div>
              <div className="py-0.5 border-y border-slate-800">V / N / D</div>
              <div className="py-0.5 border-y border-slate-800">INDICE FORME</div>
              <div className="py-0.5 border-y border-slate-800">HISTORIQUE FORME</div>
            </div>

            {/* Away stats */}
            <div className="space-y-2.5 text-right sm:text-center">
              <div className="flex items-center justify-end sm:justify-center gap-2">
                <TeamBadge teamName={awayTeam.name} size="md" />
                <span className="text-base sm:text-lg font-black text-purple-400 truncate">{awayTeam.name}</span>
              </div>
              <div className="text-xs text-slate-300">Rang : <strong className="text-white">#{awayTeam.rank}</strong></div>
              <div className="text-xs text-slate-300">Points : <strong className="text-white">{awayTeam.points} pts</strong> ({awayTeam.played}m)</div>
              <div className="text-xs text-slate-300">Bilan : <strong className="text-emerald-400">{awayTeam.won}V</strong>-<strong className="text-amber-400">{awayTeam.drawn}N</strong>-<strong className="text-rose-400">{awayTeam.lost}D</strong></div>
              <div className="text-xs text-slate-300">Forme : <strong className="text-emerald-400">{awayFormPts.toFixed(1)}/15</strong></div>
              <div className="flex gap-1 justify-end sm:justify-center">
                {awayTeam.recentForm.length > 0 ? awayTeam.recentForm.map((f, i) => renderFormBadge(f, i)) : <span className="text-xs text-slate-500">Début de saison</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <LeagueBadge size="sm" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tableau Officiel Bet261 Instant League 8035 (Journée #{activeRoundNumber})
            </h3>
          </div>
          <span className="text-xs text-slate-400">{teams.length} équipes synchronisées</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center">Rang</th>
                <th className="py-3 px-4">Équipe</th>
                <th className="py-3 px-2 text-center">J</th>
                <th className="py-3 px-2 text-center">V</th>
                <th className="py-3 px-2 text-center">N</th>
                <th className="py-3 px-2 text-center">D</th>
                <th className="py-3 px-2 text-center">BP:BC</th>
                <th className="py-3 px-2 text-center">Diff</th>
                <th className="py-3 px-3 text-center font-bold text-white">Pts</th>
                <th className="py-3 px-4 text-center">Forme récente (Bet261)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {teams.map((t) => {
                const isLeader = t.rank <= 4;
                const isRelegation = t.rank >= 18;

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isLeader ? 'bg-blue-950/15' : isRelegation ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${
                        t.rank === 1 ? 'bg-amber-500 text-slate-950 font-black' :
                        t.rank === 2 ? 'bg-slate-300 text-slate-950 font-black' :
                        t.rank === 3 ? 'bg-amber-700 text-white font-bold' :
                        isLeader ? 'text-blue-400 font-bold' :
                        isRelegation ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {t.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <TeamBadge teamName={t.name} size="sm" />
                        <span>{t.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{t.code}]</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{t.played}</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400 font-medium font-mono">{t.won}</td>
                    <td className="py-2.5 px-2 text-center text-amber-400 font-medium font-mono">{t.drawn}</td>
                    <td className="py-2.5 px-2 text-center text-rose-400 font-medium font-mono">{t.lost}</td>
                    <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                      {t.goalsFor}:{t.goalsAgainst}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">
                      <span className={t.goalDiff > 0 ? 'text-emerald-400' : t.goalDiff < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {t.goalDiff > 0 ? `+${t.goalDiff}` : t.goalDiff}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-white font-mono text-sm bg-slate-950/40">
                      {t.points}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {t.recentForm.length > 0 ? (
                          t.recentForm.map((f, i) => renderFormBadge(f, i))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
