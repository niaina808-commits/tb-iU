import React from 'react';
import { Camera, RefreshCw, BarChart2, Edit3, History, Activity, Zap, Radio, Crown, Shield, Users, Lock } from 'lucide-react';
import { LeagueBadge } from './TeamBadge';
import { VipPlanId } from '../types/league';

export type ActiveTab = 'dashboard' | 'scan' | 'sync' | 'ranking' | 'manual' | 'history' | 'vip' | 'admin';
export type SyncSpeedSec = 3 | 5 | 10;

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lastSyncTime: string;
  isSyncing: boolean;
  onQuickSync: () => void;
  savedPredictionsCount: number;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  syncSpeedSec: SyncSpeedSec;
  onChangeSyncSpeed: (speed: SyncSpeedSec) => void;
  activeRoundNumber?: number;
  countdownStr?: string;
  syncDurationMs?: number;
  isRealTimeSynced?: boolean;
  currentVipPlan?: VipPlanId;
  activeUsersCount?: number;
  onLockApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lastSyncTime,
  isSyncing,
  onQuickSync,
  savedPredictionsCount,
  autoSyncEnabled,
  onToggleAutoSync,
  syncSpeedSec,
  onChangeSyncSpeed,
  activeRoundNumber = 1,
  countdownStr = '',
  syncDurationMs = 0,
  isRealTimeSynced = true,
  currentVipPlan = 'free',
  activeUsersCount = 1,
  onLockApp
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5">
          {/* Logo & Live Auto-Sync Status Bar */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900/90 flex items-center justify-center shadow-md shadow-blue-500/20 border border-emerald-500/30 shrink-0">
                <LeagueBadge size="lg" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black tracking-wide text-white uppercase font-sans">
                    Virtual Predictor Scan
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-blue-950/90 border border-blue-700/50 text-[10px] font-mono font-bold text-blue-300">
                    Journée #{activeRoundNumber}
                  </span>
                  {countdownStr && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black border ${
                      countdownStr === 'EN DIRECT'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                        : 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300'
                    }`}>
                      {countdownStr === 'EN DIRECT' ? '🔴 EN DIRECT' : `⏱ ${countdownStr}`}
                    </span>
                  )}
                  <span
                    onClick={() => setActiveTab('admin')}
                    title="Utilisateurs actifs en ligne"
                    className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3 h-3" />
                    <span>{Math.max(1, activeUsersCount)} Actif{activeUsersCount > 1 ? 's' : ''}</span>
                  </span>
                  {currentVipPlan && currentVipPlan !== 'free' && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/50 text-[10px] font-mono font-black text-amber-300 uppercase">
                      👑 {currentVipPlan.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-semibold text-blue-400">BET261 8035</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      autoSyncEnabled && isRealTimeSynced
                        ? 'bg-emerald-400 animate-ping'
                        : isRealTimeSynced
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}></span>
                    <span className={`inline-block w-2 h-2 rounded-full -ml-3 ${
                      isRealTimeSynced ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></span>
                    <span className="text-slate-300 font-mono">
                      {lastSyncTime ? `Sync ${lastSyncTime}` : 'Connecté'}
                    </span>
                  </span>
                  {syncDurationMs > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400/90 hidden sm:inline">
                      ({syncDurationMs}ms)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Auto-Sync Turbo Controls (Mobile & Desktop) */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={onToggleAutoSync}
                  title={autoSyncEnabled ? 'Synchronisation automatique Turbo active' : 'Activer la synchronisation automatique'}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    autoSyncEnabled
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className={`w-3 h-3 ${autoSyncEnabled ? 'fill-current animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">Auto</span>
                  <span>{autoSyncEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {autoSyncEnabled && (
                  <select
                    value={syncSpeedSec}
                    onChange={(e) => onChangeSyncSpeed(Number(e.target.value) as SyncSpeedSec)}
                    aria-label="Vitesse de synchronisation automatique"
                    className="bg-transparent text-emerald-300 text-[11px] font-mono font-bold px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value={3} className="bg-slate-900 text-white">⚡ 3s Turbo</option>
                    <option value={5} className="bg-slate-900 text-white">🚀 5s Rapide</option>
                    <option value={10} className="bg-slate-900 text-white">🔄 10s Normal</option>
                  </select>
                )}
              </div>

              <button
                onClick={onQuickSync}
                disabled={isSyncing}
                title="Forcer la synchronisation immédiate"
                className="p-2 text-slate-200 hover:text-white bg-blue-600/20 hover:bg-blue-600/40 rounded-lg border border-blue-500/40 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
              </button>
            </div>
          </div>

          {/* Navigation Bar / Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto p-1 bg-slate-900/90 rounded-xl border border-slate-800 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>Matchs Live</span>
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ranking'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Classement & Forme</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Saisie</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique ({savedPredictionsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('vip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                activeTab === 'vip'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>👑 VIP</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-500/30'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>🛡️ Admin</span>
            </button>

            {onLockApp && (
              <button
                onClick={onLockApp}
                title="Verrouiller l'application et l'accès VIP"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Verrouiller</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
