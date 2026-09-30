import React, { useState } from 'react';
import { Edit3, Search, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { Team, MatchOdds } from '../types/league';
import { findTeamByName } from '../utils/mockLeagueData';
import { TeamBadge } from './TeamBadge';

interface ManualEntryFormProps {
  teams: Team[];
  onSubmitAnalysis: (data: {
    homeTeamName: string;
    awayTeamName: string;
    homeTeamObj?: Team;
    awayTeamObj?: Team;
    homeRank?: number | null;
    awayRank?: number | null;
    homeFormStr?: string | null;
    awayFormStr?: string | null;
    odds: MatchOdds | null;
  }) => void;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  teams,
  onSubmitAnalysis
}) => {
  const [homeTeamInput, setHomeTeamInput] = useState<string>('Manchester Blue');
  const [awayTeamInput, setAwayTeamInput] = useState<string>('London Red');

  const [homeRank, setHomeRank] = useState<string>('1');
  const [awayRank, setAwayRank] = useState<string>('3');

  const [homeForm, setHomeForm] = useState<string>('V-V-V-N-V');
  const [awayForm, setAwayForm] = useState<string>('V-N-V-V-D');

  const [odds1, setOdds1] = useState<string>('2.05');
  const [oddsX, setOddsX] = useState<string>('3.30');
  const [odds2, setOdds2] = useState<string>('3.60');
  const [oddsOver25, setOddsOver25] = useState<string>('1.88');
  const [oddsUnder25, setOddsUnder25] = useState<string>('1.85');
  const [oddsGG, setOddsGG] = useState<string>('1.75');
  const [oddsNG, setOddsNG] = useState<string>('1.98');

  // Handle preset selection
  const handleSelectHomePreset = (teamName: string) => {
    setHomeTeamInput(teamName);
    const found = findTeamByName(teamName, teams);
    if (found) {
      setHomeRank(String(found.rank));
      setHomeForm(found.recentForm.join('-'));
    }
  };

  const handleSelectAwayPreset = (teamName: string) => {
    setAwayTeamInput(teamName);
    const found = findTeamByName(teamName, teams);
    if (found) {
      setAwayRank(String(found.rank));
      setAwayForm(found.recentForm.join('-'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const homeObj = findTeamByName(homeTeamInput, teams);
    const awayObj = findTeamByName(awayTeamInput, teams);

    const parsedOdds: MatchOdds | null = (odds1 && oddsX && odds2 && Number(odds1) > 1 && Number(oddsX) > 1 && Number(odds2) > 1)
      ? {
          home: Number(odds1),
          draw: Number(oddsX),
          away: Number(odds2),
          over25: oddsOver25 && Number(oddsOver25) > 1 ? Number(oddsOver25) : undefined,
          under25: oddsUnder25 && Number(oddsUnder25) > 1 ? Number(oddsUnder25) : undefined,
          bttsYes: oddsGG && Number(oddsGG) > 1 ? Number(oddsGG) : undefined,
          bttsNo: oddsNG && Number(oddsNG) > 1 ? Number(oddsNG) : undefined
        }
      : null;

    onSubmitAnalysis({
      homeTeamName: homeTeamInput.trim(),
      awayTeamName: awayTeamInput.trim(),
      homeTeamObj: homeObj,
      awayTeamObj: awayObj,
      homeRank: homeRank ? parseInt(homeRank, 10) : null,
      awayRank: awayRank ? parseInt(awayRank, 10) : null,
      homeFormStr: homeForm,
      awayFormStr: awayForm,
      odds: parsedOdds
    });
  };

  const handleReset = () => {
    setHomeTeamInput('Manchester Blue');
    setAwayTeamInput('London Red');
    setHomeRank('1');
    setAwayRank('3');
    setHomeForm('V-V-V-N-V');
    setAwayForm('V-N-V-V-D');
    setOdds1('2.05');
    setOddsX('3.30');
    setOdds2('3.60');
    setOddsOver25('1.88');
    setOddsUnder25('1.85');
    setOddsGG('1.75');
    setOddsNG('1.98');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Saisie Manuelle d'un Match (Module 7)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Renseignez manuellement les équipes, rangs, formes et cotes 1X2 pour analyse instantanée
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Teams & Standings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* HOME TEAM */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamBadge teamName={homeTeamInput} size="sm" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Équipe Domicile (1)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Instant League 8035</span>
            </div>

            {/* Quick selector */}
            <select
              onChange={(e) => handleSelectHomePreset(e.target.value)}
              value={homeTeamInput}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sélectionner une équipe de la ligue 8035...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  #{t.rank} · {t.name} ({t.points} pts)
                </option>
              ))}
            </select>

            {/* Custom input */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nom personnalisé ou alias :</label>
              <input
                type="text"
                required
                value={homeTeamInput}
                onChange={(e) => setHomeTeamInput(e.target.value)}
                placeholder="ex: Manchester Blue"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Rang Domicile :</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={homeRank}
                  onChange={(e) => setHomeRank(e.target.value)}
                  placeholder="ex: 1"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Forme Domicile (5 m) :</label>
                <input
                  type="text"
                  value={homeForm}
                  onChange={(e) => setHomeForm(e.target.value)}
                  placeholder="ex: V-V-N-D-V"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* AWAY TEAM */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamBadge teamName={awayTeamInput} size="sm" />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Équipe Extérieure (2)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Instant League 8035</span>
            </div>

            {/* Quick selector */}
            <select
              onChange={(e) => handleSelectAwayPreset(e.target.value)}
              value={awayTeamInput}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:border-purple-500 focus:outline-none"
            >
              <option value="">Sélectionner une équipe de la ligue 8035...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  #{t.rank} · {t.name} ({t.points} pts)
                </option>
              ))}
            </select>

            {/* Custom input */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nom personnalisé ou alias :</label>
              <input
                type="text"
                required
                value={awayTeamInput}
                onChange={(e) => setAwayTeamInput(e.target.value)}
                placeholder="ex: London Red"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Rang Extérieur :</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={awayRank}
                  onChange={(e) => setAwayRank(e.target.value)}
                  placeholder="ex: 3"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Forme Extérieur (5 m) :</label>
                <input
                  type="text"
                  value={awayForm}
                  onChange={(e) => setAwayForm(e.target.value)}
                  placeholder="ex: V-D-V-N-V"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Odds 1X2 Section */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cotes 1 / X / 2 (Optionnelles ou recommandées)
            </span>
            <span className="text-[11px] text-slate-500">Marché Bet261</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-blue-400 font-semibold block mb-1">Cote 1</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={odds1}
                onChange={(e) => setOdds1(e.target.value)}
                placeholder="ex: 2.05"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-amber-400 font-semibold block mb-1">Cote X</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={oddsX}
                onChange={(e) => setOddsX(e.target.value)}
                placeholder="ex: 3.30"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-purple-400 font-semibold block mb-1">Cote 2</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={odds2}
                onChange={(e) => setOdds2(e.target.value)}
                placeholder="ex: 3.60"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-2 text-sm focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Secondary Markets Odds (+/- 2.5 & GG/NG) */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-emerald-400 font-semibold block mb-1">Cote +2.5 (Plus)</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={oddsOver25}
                onChange={(e) => setOddsOver25(e.target.value)}
                placeholder="ex: 1.88"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-blue-400 font-semibold block mb-1">Cote -2.5 (Moins)</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={oddsUnder25}
                onChange={(e) => setOddsUnder25(e.target.value)}
                placeholder="ex: 1.85"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-1.5 text-xs focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-purple-400 font-semibold block mb-1">Cote GG (Oui)</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={oddsGG}
                onChange={(e) => setOddsGG(e.target.value)}
                placeholder="ex: 1.75"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-1.5 text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-rose-400 font-semibold block mb-1">Cote NG (Non)</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={oddsNG}
                onChange={(e) => setOddsNG(e.target.value)}
                placeholder="ex: 1.98"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-lg py-1.5 text-xs focus:border-rose-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button: MODULE 7 exact requirement: "Puis bouton : 🔍 ANALYSER" */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wide shadow-xl shadow-blue-500/30 transition active:scale-95 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>🔍 ANALYSER</span>
          </button>
        </div>
      </form>
    </div>
  );
};
