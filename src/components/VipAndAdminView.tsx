import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown,
  Shield,
  Users,
  Key,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  Sparkles,
  Clock,
  UserPlus,
  Smartphone,
  CreditCard,
  Award,
  Activity
} from 'lucide-react';
import {
  VipPlanId,
  VipPlanOffer,
  VipAccessCode,
  ActiveUserRecord,
  VipSubscriptionRequest
} from '../types/league';

export const OFFICIAL_MVOLA_NUMBER = '034 988 17 19';
export const OFFICIAL_MVOLA_DISPLAY = 'Mvola - 034 988 17 19';

export const VIP_PLANS: VipPlanOffer[] = [
  {
    id: 'vip1',
    name: 'VIP 1 — 1 Semaine',
    durationLabel: '1 Semaine (7 Jours)',
    durationDays: 7,
    priceAriary: 5000,
    priceFormatted: '5.000 Ar',
    badge: 'ACCÈS 1 SEMAINE',
    features: [
      'Accès Top Combiné SAFE (Cote ≤ 4.00)',
      'Score Exact Normalisé 73% en direct',
      'Synchronisation Auto Bet261 8035 (3s Turbo)',
      'Suivi Auto-Marquage Gagné / Perdu (7 jours)'
    ]
  },
  {
    id: 'vip2',
    name: 'VIP 2 — 2 Semaines',
    durationLabel: '2 Semaines (14 Jours)',
    durationDays: 14,
    priceAriary: 10000,
    priceFormatted: '10.000 Ar',
    badge: 'POPULAIRE ★',
    features: [
      'Top Combiné SAFE (≤ 4.00) + ÉQUILIBRÉ (≤ 7.00)',
      'Score Exact Normalisé 73% + Multi-Buts',
      'Scanner IA & Synchronisation Temps Réel',
      'Garantie Bilan Positif & Historique Complet (14 jours)'
    ]
  },
  {
    id: 'vip3',
    name: 'VIP 3 — 3 Semaines',
    durationLabel: '3 Semaines (21 Jours)',
    durationDays: 21,
    priceAriary: 15000,
    priceFormatted: '15.000 Ar',
    badge: 'PACK ULTIME 👑',
    features: [
      'Pack Complet : SAFE (≤ 4) + ÉQUILIBRÉ (≤ 7) + JACKPOT (≤ 15)',
      'Score Exact 73% + Cotes Haute Valeur Bet261',
      'Scanner IA Illimité + Alertes Journées Live',
      'Accès Prioritaire VIP 3 & Support Dédié (21 jours)'
    ]
  }
];

interface VipAndAdminViewProps {
  currentUser: ActiveUserRecord | null;
  isAdminUnlocked: boolean;
  adminCodeInput: string;
  onUnlockAdmin: (code: string) => Promise<boolean>;
  onLockAdmin: () => void;
  onRedeemVipCode: (payload: {
    code: string;
    userName: string;
    phone: string;
  }) => Promise<{ success: boolean; message: string }>;
  initialMode?: 'vip' | 'admin';
}

export const VipAndAdminView: React.FC<VipAndAdminViewProps> = ({
  currentUser,
  isAdminUnlocked,
  onUnlockAdmin,
  onLockAdmin,
  onRedeemVipCode,
  initialMode = 'vip'
}) => {
  const [subTab, setSubTab] = useState<'vip' | 'admin'>(initialMode);

  // VIP Redeem Form State
  const [userName, setUserName] = useState<string>(currentUser?.userName || '');
  const [userPhone, setUserPhone] = useState<string>(currentUser?.phone || '');
  const [vipCodeToRedeem, setVipCodeToRedeem] = useState<string>('');
  const [redeemFeedback, setRedeemFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  // VIP Subscription Request Form State
  const [selectedRequestPlan, setSelectedRequestPlan] = useState<'vip1' | 'vip2' | 'vip3'>('vip1');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Admin Login & State
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [activeAdminCode, setActiveAdminCode] = useState<string>('ADMIN8035');
  const [newAdminCodeInput, setNewAdminCodeInput] = useState<string>('');
  const [adminCodeSavedMsg, setAdminCodeSavedMsg] = useState<string | null>(null);

  const [activeUsers, setActiveUsers] = useState<ActiveUserRecord[]>([]);
  const [vipCodes, setVipCodes] = useState<VipAccessCode[]>([]);
  const [vipRequests, setVipRequests] = useState<VipSubscriptionRequest[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(false);

  // Admin Code Generator Form
  const [genPlanId, setGenPlanId] = useState<'vip1' | 'vip2' | 'vip3'>('vip1');
  const [genCustomCode, setGenCustomCode] = useState<string>('');
  const [genClientNote, setGenClientNote] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Admin Manual User Creation Form
  const [manualUserName, setManualUserName] = useState<string>('');
  const [manualUserPhone, setManualUserPhone] = useState<string>('');
  const [manualUserPlan, setManualUserPlan] = useState<'vip1' | 'vip2' | 'vip3'>('vip1');

  useEffect(() => {
    if (currentUser?.userName && !userName) setUserName(currentUser.userName);
    if (currentUser?.phone && !userPhone) setUserPhone(currentUser.phone);
  }, [currentUser, userName, userPhone]);

  const fetchAdminDashboard = useCallback(async () => {
    setIsLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/state');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        if (data.adminCode) setActiveAdminCode(data.adminCode);
        if (Array.isArray(data.activeUsers)) setActiveUsers(data.activeUsers);
        if (Array.isArray(data.vipCodes)) setVipCodes(data.vipCodes);
        if (Array.isArray(data.vipRequests)) setVipRequests(data.vipRequests);
      }
    } catch {
      // ignore error
    } finally {
      setIsLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminDashboard();
    const timer = setInterval(fetchAdminDashboard, 6000);
    return () => clearInterval(timer);
  }, [fetchAdminDashboard]);

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipCodeToRedeem.trim()) return;
    setIsRedeeming(true);
    setRedeemFeedback(null);
    try {
      const res = await onRedeemVipCode({
        code: vipCodeToRedeem.trim(),
        userName: userName.trim() || 'Membre VIP',
        phone: userPhone.trim() || '034 00 000 00'
      });
      setRedeemFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
      if (res.success) {
        setVipCodeToRedeem('');
        fetchAdminDashboard();
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRequestVipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      setRequestFeedback('Veuillez renseigner votre nom et numéro de téléphone.');
      return;
    }
    try {
      const res = await fetch('/api/vip/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || `USR-${Date.now()}`,
          userName: userName.trim(),
          phone: userPhone.trim(),
          planId: selectedRequestPlan,
          paymentRef: paymentRef.trim() || 'Paiement Mobile Money'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRequestFeedback(
          `✅ Demande envoyée pour ${
            VIP_PLANS.find((p) => p.id === selectedRequestPlan)?.name
          } (${
            VIP_PLANS.find((p) => p.id === selectedRequestPlan)?.priceFormatted
          }). L'administrateur va activer votre accès.`
        );
        setPaymentRef('');
        fetchAdminDashboard();
      }
    } catch {
      setRequestFeedback("Erreur lors de l'envoi de la demande.");
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const ok = await onUnlockAdmin(adminPassword.trim());
    if (ok) {
      setAdminPassword('');
      fetchAdminDashboard();
    } else {
      setAdminError("Code d'Accès Admin incorrect. Veuillez vérifier votre code.");
    }
  };

  const handleGenerateVipCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: genPlanId,
          customCode: genCustomCode.trim() || undefined,
          note: genClientNote.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setGenCustomCode('');
        setGenClientNote('');
        fetchAdminDashboard();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteVipCode = async (code: string) => {
    try {
      await fetch('/api/admin/delete-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      fetchAdminDashboard();
    } catch {
      // ignore
    }
  };

  const handleAdminUpdateUser = async (
    userId: string,
    action: 'set_plan' | 'revoke' | 'delete',
    planId?: VipPlanId
  ) => {
    try {
      await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, planId })
      });
      fetchAdminDashboard();
    } catch {
      // ignore
    }
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserName.trim()) return;
    try {
      await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vip_user',
          userName: manualUserName.trim(),
          phone: manualUserPhone.trim() || '034 00 000 00',
          planId: manualUserPlan
        })
      });
      setManualUserName('');
      setManualUserPhone('');
      fetchAdminDashboard();
    } catch {
      // ignore
    }
  };

  const handleApproveRequest = async (reqId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'handle_request', requestId: reqId, requestStatus: status })
      });
      fetchAdminDashboard();
    } catch {
      // ignore
    }
  };

  const handleChangeAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminCodeInput.trim() || newAdminCodeInput.trim().length < 4) return;
    try {
      const res = await fetch('/api/admin/update-admin-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAdminCode: newAdminCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setActiveAdminCode(data.adminCode);
        setNewAdminCodeInput('');
        setAdminCodeSavedMsg('✅ Nouveau Code d’Accès Admin enregistré !');
        setTimeout(() => setAdminCodeSavedMsg(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  // Computed Admin KPIs
  const onlineUsersCount = activeUsers.filter((u) => u.isOnline).length;
  const vipActiveUsers = activeUsers.filter(
    (u) => u.planId === 'vip1' || u.planId === 'vip2' || u.planId === 'vip3' || u.planId === 'admin'
  );
  const totalVipRevenueAriary = activeUsers.reduce((acc, u) => acc + (u.priceAriary || 0), 0);
  const availableCodesCount = vipCodes.filter((c) => !c.isUsed).length;

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#101935] to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                ESPACE VIP & PANEL ADMIN — BET261 8035
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                { Math.max(1, onlineUsersCount) } Utilisateur{onlineUsersCount > 1 ? 's' : ''} Actif{onlineUsersCount > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Abonnements VIP 1 (5.000 Ar) • VIP 2 (10.000 Ar) • VIP 3 (15.000 Ar) & Gestion Administrateur
            </p>
          </div>
        </div>

        {/* Sub-Tabs : Accès VIP vs Panel Admin */}
        <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('vip')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              subTab === 'vip'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Offres & Accès VIP</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('admin')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              subTab === 'admin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Panel Admin</span>
            {isAdminUnlocked && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Admin Déverrouillé" />
            )}
          </button>

          <button
            type="button"
            onClick={onLockAdmin}
            title="Verrouiller immédiatement l'Application et l'Accès VIP"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Verrouiller App & VIP</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1 : OFFRES VIP (5.000Ar / 10.000Ar / 15.000Ar) & CODE D'ACCÈS   */}
      {/* =================================================================== */}
      {subTab === 'vip' && (
        <div className="space-y-6">
          {/* Current User VIP Status Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  currentUser && currentUser.planId !== 'free'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase font-bold text-slate-400">
                    Votre Statut Actuel :
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${
                      currentUser?.planId === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : currentUser?.planId === 'vip3'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : currentUser?.planId === 'vip2'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : currentUser?.planId === 'vip1'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {currentUser?.planLabel || 'MEMBRE STANDARD (GRATUIT)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {currentUser?.expiresAt
                    ? `Valide jusqu'au : ${currentUser.expiresAt} • Code : ${
                        currentUser.accessCodeUsed || 'Actif'
                      }`
                    : 'Activez un forfait VIP 1, VIP 2 ou VIP 3 ci-dessous avec votre code d’accès.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>ID Session :</span>
              <strong className="text-amber-400">{currentUser?.userId || 'EN LIGNE'}</strong>
            </div>
          </div>

          {/* 3 VIP PRICING CARDS : VIP 1 (5.000Ar), VIP 2 (10.000Ar), VIP 3 (15.000Ar) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VIP_PLANS.map((plan) => {
              const isCurrentPlan = currentUser?.planId === plan.id;
              const isVip3 = plan.id === 'vip3';
              const isVip2 = plan.id === 'vip2';

              const cardBorder = isVip3
                ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/35 via-slate-900 to-slate-950 shadow-xl shadow-amber-500/10'
                : isVip2
                ? 'border-blue-500/60 bg-gradient-to-b from-blue-950/35 via-slate-900 to-slate-950 shadow-xl shadow-blue-500/10'
                : 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-950';

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden transition hover:scale-[1.01] ${cardBorder}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isVip3
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isVip2
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-emerald-600 text-white border-emerald-400'
                        }`}
                      >
                        {plan.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {plan.durationLabel}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white uppercase tracking-wide">
                      {plan.name}
                    </h3>

                    <div className="my-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Tarif Officiel</span>
                        <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                          {plan.priceFormatted}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        /{plan.durationDays} jours
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 mb-5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequestPlan(plan.id);
                      const el = document.getElementById('vip-activation-box');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? 'bg-emerald-600 text-white'
                        : isVip3
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                        : isVip2
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>
                      {isCurrentPlan
                        ? '✅ Forfait Actif'
                        : `Choisir ${plan.id.toUpperCase()} (${plan.priceFormatted})`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* VIP CODE ACTIVATION & SUBSCRIPTION REQUEST */}
          <div id="vip-activation-box" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Enter VIP Access Code */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <Key className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase">
                    Activer un Code d&apos;Accès VIP ou Admin
                  </h3>
                  <p className="text-xs text-slate-400">
                    Entrez votre code reçu après validation (VIP 1, VIP 2, VIP 3 ou Code Admin)
                  </p>
                </div>
              </div>

              <form onSubmit={handleRedeemSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Votre Nom / Pseudo
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ex: Tahina8035"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Téléphone (Contact)
                    </label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="Ex: 034 12 345 67"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase mb-1">
                    Code d&apos;Accès VIP / Admin
                  </label>
                  <input
                    type="text"
                    value={vipCodeToRedeem}
                    onChange={(e) => setVipCodeToRedeem(e.target.value.toUpperCase())}
                    placeholder="Ex: VIP1-8035, VIP2-8035, VIP3-8035..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-base font-mono font-black text-amber-300 tracking-wider uppercase focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {redeemFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold ${
                      redeemFeedback.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {redeemFeedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRedeeming || !vipCodeToRedeem.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isRedeeming ? 'Vérification...' : 'Activer mon Accès VIP Maintenant'}</span>
                </button>
              </form>
            </div>

            {/* Right: Request a VIP Code from Admin */}
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-2.5 border-b border-slate-800 pb-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase">
                      Demander un Accès VIP (Activation Rapide)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Choisissez votre forfait (5.000Ar, 10.000Ar ou 15.000Ar) et transférez via MVola
                    </p>
                  </div>
                </div>
              </div>

              {/* Official MVola Transfer Number Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-slate-950 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    MVola
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-300 uppercase">
                      Numéro de transfert officiel :
                    </div>
                    <div className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-wider">
                      {OFFICIAL_MVOLA_DISPLAY}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(OFFICIAL_MVOLA_NUMBER, 'MVOLA-VIP')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedCode === 'MVOLA-VIP' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Numéro Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier 034 988 17 19</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleRequestVipSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Forfait VIP souhaité
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {VIP_PLANS.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setSelectedRequestPlan(p.id)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          selectedRequestPlan === p.id
                            ? 'bg-blue-600 border-blue-400 text-white font-black'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs uppercase font-black">{p.id.toUpperCase()}</div>
                        <div className="text-[11px] font-mono text-amber-300">{p.priceFormatted}</div>
                        <div className="text-[10px] opacity-80">{p.durationDays} jours</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Votre Nom / Pseudo
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ex: Rado"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Numéro Téléphone
                    </label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="Ex: 034 00 000 00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Référence Transfert ({OFFICIAL_MVOLA_DISPLAY})
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Ex: Réf transfert MVola 034 988 17 19..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {requestFeedback && (
                  <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs text-blue-200 font-semibold">
                    {requestFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Envoyer Demande{' '}
                    {VIP_PLANS.find((p) => p.id === selectedRequestPlan)?.id.toUpperCase()} (
                    {VIP_PLANS.find((p) => p.id === selectedRequestPlan)?.priceFormatted})
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2 : PANEL ADMIN (UTILISATEUR ACTIF, CODE D'ACCÈS ADMIN & VIP)   */}
      {/* =================================================================== */}
      {subTab === 'admin' && (
        <div className="space-y-6">
          {!isAdminUnlocked ? (
            <div className="max-w-md mx-auto bg-slate-900 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase">
                    Connexion Panel Admin
                  </h3>
                  <p className="text-xs text-slate-400">
                    Entrez le Code d&apos;Accès Admin pour gérer les utilisateurs actifs et les codes VIP
                  </p>
                </div>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Code d&apos;Accès Admin
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Entrez votre Code d'Accès Admin secret"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
                    🔒 Accès réservé uniquement à l&apos;administrateur principal
                  </div>
                </div>

                {adminError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 font-bold">
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Déverrouiller le Panel Admin</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* ADMIN KPI SUMMARY BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase">UTILISATEURS ACTIFS</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white font-mono my-1.5 flex items-baseline gap-2">
                    <span>{activeUsers.length}</span>
                    <span className="text-xs font-bold text-emerald-400">
                      ({Math.max(1, onlineUsersCount)} en ligne 🟢)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sessions connectées en temps réel
                  </div>
                </div>

                <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase">MEMBRES VIP ACTIFS</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 font-mono my-1.5">
                    {vipActiveUsers.length}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    VIP1: {activeUsers.filter((u) => u.planId === 'vip1').length} • VIP2:{' '}
                    {activeUsers.filter((u) => u.planId === 'vip2').length} • VIP3:{' '}
                    {activeUsers.filter((u) => u.planId === 'vip3').length}
                  </div>
                </div>

                <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase">REVENUS VIP CUMULÉS</span>
                    <CreditCard className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono my-1.5">
                    +{totalVipRevenueAriary.toLocaleString('fr-FR')} Ar
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Forfaits 5.000Ar / 10.000Ar / 15.000Ar
                  </div>
                </div>

                <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase">CODE D&apos;ACCÈS ADMIN</span>
                    <Key className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-purple-300 font-mono my-1.5 flex items-center justify-between">
                    <span>{activeAdminCode}</span>
                    <button
                      type="button"
                      onClick={() => copyText(activeAdminCode, 'ADMIN-CODE')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                      title="Copier le Code Admin"
                    >
                      {copiedCode === 'ADMIN-CODE' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{availableCodesCount} codes VIP prêts</span>
                    <button
                      type="button"
                      onClick={onLockAdmin}
                      className="text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Verrouiller
                    </button>
                  </div>
                </div>
              </div>

              {/* ADMIN CONTROLS : GENERATE VIP CODES & CHANGE ADMIN CODE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Col 1 & 2: Generate & Manage VIP Codes (VIP 1 5.000Ar, VIP 2 10.000Ar, VIP 3 15.000Ar) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm sm:text-base font-black text-white uppercase">
                        Générateur de Codes d&apos;Accès VIP (5.000Ar / 10.000Ar / 15.000Ar)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={fetchAdminDashboard}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Actualiser"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingAdmin ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <form
                    onSubmit={handleGenerateVipCode}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Niveau VIP & Tarif
                      </label>
                      <select
                        value={genPlanId}
                        onChange={(e) => setGenPlanId(e.target.value as 'vip1' | 'vip2' | 'vip3')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="vip1">VIP 1 — 1 Semaine (5.000 Ar)</option>
                        <option value="vip2">VIP 2 — 2 Semaines (10.000 Ar)</option>
                        <option value="vip3">VIP 3 — 3 Semaines (15.000 Ar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Code Personnalisé (Optionnel)
                      </label>
                      <input
                        type="text"
                        value={genCustomCode}
                        onChange={(e) => setGenCustomCode(e.target.value.toUpperCase())}
                        placeholder="Auto ex: VIP1-8035"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 uppercase focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Note / Nom Client
                      </label>
                      <input
                        type="text"
                        value={genClientNote}
                        onChange={(e) => setGenClientNote(e.target.value)}
                        placeholder="Ex: Client MVola"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Générer Code</span>
                    </button>
                  </form>

                  {/* List of Generated VIP Access Codes */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pt-2">
                    {vipCodes.map((c) => (
                      <div
                        key={c.code}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          c.isUsed
                            ? 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                            : 'bg-slate-950 border-amber-500/40 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 font-mono font-black text-sm text-amber-300">
                            {c.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              c.planId === 'vip3'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : c.planId === 'vip2'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {c.planLabel} • {c.priceAriary.toLocaleString('fr-FR')} Ar
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            ({c.durationDays} jours)
                          </span>
                          {c.note && (
                            <span className="text-[11px] text-blue-300 italic">• {c.note}</span>
                          )}
                          {c.isUsed && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold">
                              ✓ Utilisé par {c.usedByUserName || 'Client'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                `👑 CODE D'ACCÈS ${c.planLabel.toUpperCase()} (${c.priceAriary.toLocaleString(
                                  'fr-FR'
                                )} Ar - ${c.durationDays} jours) : ${c.code}`,
                                c.code
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCode === c.code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copié</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-blue-400" />
                                <span>Copier Code</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVipCode(c.code)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 cursor-pointer"
                            title="Supprimer ce code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 3: Change Admin Access Code & Direct Manual VIP User Add */}
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs sm:text-sm font-black text-white uppercase">
                        Modifier le Code d&apos;Accès Admin
                      </h3>
                    </div>
                    <form onSubmit={handleChangeAdminCode} className="space-y-2.5">
                      <div className="text-xs text-slate-400 font-mono">
                        Code Actuel : <strong className="text-purple-300">{activeAdminCode}</strong>
                      </div>
                      <input
                        type="text"
                        value={newAdminCodeInput}
                        onChange={(e) => setNewAdminCodeInput(e.target.value.toUpperCase())}
                        placeholder="Nouveau Code Admin..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white uppercase focus:border-purple-500 focus:outline-none"
                      />
                      {adminCodeSavedMsg && (
                        <div className="text-[11px] text-emerald-400 font-bold">
                          {adminCodeSavedMsg}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        Mettre à jour Code Admin
                      </button>
                    </form>
                  </div>

                  {/* Direct Manual VIP User Creation */}
                  <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs sm:text-sm font-black text-white uppercase">
                        Ajouter un Utilisateur VIP Actif
                      </h3>
                    </div>
                    <form onSubmit={handleAdminCreateUser} className="space-y-2.5">
                      <input
                        type="text"
                        value={manualUserName}
                        onChange={(e) => setManualUserName(e.target.value)}
                        placeholder="Nom / Pseudo du client"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={manualUserPhone}
                        onChange={(e) => setManualUserPhone(e.target.value)}
                        placeholder="Téléphone (ex: 034...)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <select
                        value={manualUserPlan}
                        onChange={(e) =>
                          setManualUserPlan(e.target.value as 'vip1' | 'vip2' | 'vip3')
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="vip1">VIP 1 — 1 Semaine (5.000 Ar)</option>
                        <option value="vip2">VIP 2 — 2 Semaines (10.000 Ar)</option>
                        <option value="vip3">VIP 3 — 3 Semaines (15.000 Ar)</option>
                      </select>
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        + Activer cet Utilisateur VIP
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* PENDING VIP SUBSCRIPTION REQUESTS */}
              {vipRequests.filter((r) => r.status === 'pending').length > 0 && (
                <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-black text-amber-400 uppercase flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>
                      Demandes d&apos;Activation VIP en Attente (
                      {vipRequests.filter((r) => r.status === 'pending').length})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {vipRequests
                      .filter((r) => r.status === 'pending')
                      .map((req) => (
                        <div
                          key={req.id}
                          className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <strong className="text-white text-sm">{req.userName}</strong>
                            <span className="font-mono text-slate-400">({req.phone})</span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black">
                              {req.planLabel} — {req.priceAriary.toLocaleString('fr-FR')} Ar
                            </span>
                            <span className="text-slate-400">Réf: {req.paymentRef}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {req.createdAt}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req.id, 'approved')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                            >
                              ✅ Valider & Activer VIP
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req.id, 'rejected')}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold cursor-pointer"
                            >
                              ❌ Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ACTIVE USERS & VIP SUBSCRIBERS TABLE (UTILISATEUR ACTIF) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm sm:text-base font-black text-white uppercase">
                      Utilisateurs Actifs & Membres VIP ({activeUsers.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Suivi en direct des accès VIP 1, VIP 2, VIP 3 & Sessions</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                        <th className="py-2.5 px-3">Statut</th>
                        <th className="py-2.5 px-3">Utilisateur & Contact</th>
                        <th className="py-2.5 px-3">Forfait Actif</th>
                        <th className="py-2.5 px-3">Tarif</th>
                        <th className="py-2.5 px-3">Expiration / Activité</th>
                        <th className="py-2.5 px-3 text-right">Actions Admin Rapides</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {activeUsers.map((u) => (
                        <tr key={u.userId} className="hover:bg-slate-950/60 transition">
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                u.isOnline
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                }`}
                              />
                              {u.isOnline ? 'Actif / En ligne' : 'Récent'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{u.userName}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {u.phone} • <span className="text-slate-500">{u.userId}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                u.planId === 'admin'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : u.planId === 'vip3'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : u.planId === 'vip2'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : u.planId === 'vip1'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {u.planLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">
                            {u.priceAriary > 0
                              ? `${u.priceAriary.toLocaleString('fr-FR')} Ar`
                              : 'Gratuit'}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                            <div>{u.expiresAt ? `Exp: ${u.expiresAt}` : 'Sans expiration'}</div>
                            <div className="text-[10px] text-slate-500">
                              Vu à {u.lastSeenAt} {u.currentTab ? `(${u.currentTab})` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateUser(u.userId, 'set_plan', 'vip1')}
                                className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold cursor-pointer"
                                title="Activer VIP 1 Semaine (5.000 Ar)"
                              >
                                VIP1 (5.000Ar)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateUser(u.userId, 'set_plan', 'vip2')}
                                className="px-2 py-1 rounded bg-blue-950 hover:bg-blue-800 text-blue-300 border border-blue-500/40 text-[10px] font-bold cursor-pointer"
                                title="Activer VIP 2 Semaines (10.000 Ar)"
                              >
                                VIP2 (10.000Ar)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateUser(u.userId, 'set_plan', 'vip3')}
                                className="px-2 py-1 rounded bg-amber-950 hover:bg-amber-800 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                                title="Activer VIP 3 Semaines (15.000 Ar)"
                              >
                                VIP3 (15.000Ar)
                              </button>
                              {u.planId !== 'free' && (
                                <button
                                  type="button"
                                  onClick={() => handleAdminUpdateUser(u.userId, 'revoke')}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                                >
                                  Révoquer
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAdminUpdateUser(u.userId, 'delete')}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 cursor-pointer"
                                title="Supprimer utilisateur"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface AppLockScreenProps {
  currentUser: ActiveUserRecord | null;
  activeUsersCount: number;
  onUnlockWithCode: (payload: {
    code: string;
    userName: string;
    phone: string;
  }) => Promise<{ success: boolean; message: string }>;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  currentUser,
  activeUsersCount,
  onUnlockWithCode
}) => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [userName, setUserName] = useState<string>(
    currentUser?.userName && !currentUser.userName.startsWith('Membre #')
      ? currentUser.userName
      : ''
  );
  const [userPhone, setUserPhone] = useState<string>(
    currentUser?.phone && currentUser.phone !== 'En ligne' ? currentUser.phone : ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Request VIP state on Lock Screen
  const [selectedPlan, setSelectedPlan] = useState<'vip1' | 'vip2' | 'vip3'>('vip1');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [requestSentMsg, setRequestSentMsg] = useState<string | null>(null);
  const [copiedMvola, setCopiedMvola] = useState<boolean>(false);

  const handleCopyMvola = () => {
    navigator.clipboard?.writeText(OFFICIAL_MVOLA_NUMBER).catch(() => {});
    setCopiedMvola(true);
    setTimeout(() => setCopiedMvola(false), 2200);
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMsg("Veuillez saisir votre Code d'Accès Admin ou Code VIP.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await onUnlockWithCode({
        code: accessCode.trim(),
        userName: userName.trim() || 'Membre VIP',
        phone: userPhone.trim() || '034 00 000 00'
      });
      if (!res.success) {
        setErrorMsg(res.message || "Code d'Accès refusé. Vérifiez votre code Admin ou VIP.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      setRequestSentMsg('⚠️ Veuillez indiquer votre Nom et Numéro de téléphone.');
      return;
    }
    try {
      const res = await fetch('/api/vip/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || `USR-${Date.now()}`,
          userName: userName.trim(),
          phone: userPhone.trim(),
          planId: selectedPlan,
          paymentRef: paymentRef.trim() || 'Demande depuis Écran Verrouillé'
        })
      });
      const data = await res.json();
      if (data.success) {
        const planObj = VIP_PLANS.find((p) => p.id === selectedPlan);
        setRequestSentMsg(
          `✅ Demande envoyée à l'Administrateur pour ${planObj?.name} (${planObj?.priceFormatted}). Dès validation dans le Panel Admin, votre accès se déverrouillera automatiquement !`
        );
        setPaymentRef('');
      }
    } catch {
      setRequestSentMsg("Erreur lors de l'envoi de la demande.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-5xl w-full mx-auto my-auto space-y-6 py-4">
        {/* Top Security Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Application & Accès VIP Verrouillés par Code d&apos;Accès</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            VIRTUAL PREDICTOR SCAN — BET261 8035
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Entrez votre <strong className="text-amber-400">Code d&apos;Accès Admin</strong> ou votre{' '}
            <strong className="text-emerald-400">Code d&apos;Accès VIP</strong> pour déverrouiller les
            prédictions, le Score Exact 73% et les Top Combinés.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{Math.max(1, activeUsersCount)} Utilisateurs Actifs connectés</span>
          </div>
        </div>

        {/* Main Unlock Card + Request VIP Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 cols: Code Unlock Box */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase">
                  Déverrouiller l&apos;App & VIP
                </h2>
                <p className="text-xs text-slate-400">
                  Saisissez votre Code Admin ou Code VIP actif
                </p>
              </div>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Votre Nom / Pseudo
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Tahina"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Numéro de Téléphone
                </label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Ex: 034 00 000 00"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-amber-400 uppercase mb-1">
                  🔑 Code d&apos;Accès Admin ou Code VIP
                </label>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Entrez votre code secret..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-amber-500/50 text-base font-mono font-black text-amber-300 tracking-widest uppercase focus:border-amber-400 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 font-bold">
                  ❌ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Vérification du code...' : "Déverrouiller l'Application & VIP"}
                </span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>ID Appareil : {currentUser?.userId || 'EN ATTENTE'}</span>
              <span className="text-amber-400 font-bold">🔒 Protection Active</span>
            </div>
          </div>

          {/* Right 7 cols: 3 VIP Plans (5.000Ar, 10.000Ar, 15.000Ar) & Request Form */}
          <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white uppercase">
                    Tarifs Officiels des Accès VIP
                  </h2>
                  <p className="text-xs text-slate-400">
                    Choisissez un forfait VIP pour obtenir votre code d&apos;accès auprès de l&apos;Admin
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VIP_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/30">
                        {plan.durationLabel}
                      </span>
                      <h3 className="text-sm font-black text-white uppercase mt-2">
                        {plan.name.split('—')[0]}
                      </h3>
                      <div className="text-xl font-black font-mono text-amber-400 my-1">
                        {plan.priceFormatted}
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-300 mt-2">
                        {plan.features.slice(0, 2).map((f, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-center">
                      <span
                        className={`text-[11px] font-black uppercase ${
                          isSelected ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? '✓ Forfait Sélectionné' : 'Sélectionner'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick VIP Activation Request to Admin */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-slate-950 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                  MVola
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase">
                    Numéro de transfert :
                  </div>
                  <div className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-wider">
                    {OFFICIAL_MVOLA_DISPLAY}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyMvola}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedMvola ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier 034 988 17 19</span>
                  </>
                )}
              </button>
            </div>

            <form
              onSubmit={handleRequestSubmit}
              className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3"
            >
              <div className="text-xs font-black text-blue-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Demander l&apos;activation de mon accès{' '}
                  {VIP_PLANS.find((p) => p.id === selectedPlan)?.name} (
                  {VIP_PLANS.find((p) => p.id === selectedPlan)?.priceFormatted})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Votre Nom / Pseudo"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Votre Téléphone (034...)"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Réf transfert MVola (034 988 17 19)"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              {requestSentMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-bold">
                  {requestSentMsg}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Envoyer ma Demande d&apos;Accès VIP à l&apos;Admin (
                {VIP_PLANS.find((p) => p.id === selectedPlan)?.priceFormatted})
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-500 font-mono py-2">
        Virtual Predictor Scan • Bet261 Instant League 8035 • Accès Protégé par Code Admin & VIP
      </footer>
    </div>
  );
};

