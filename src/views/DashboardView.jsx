import React, { useState, useEffect } from 'react';
import {
  Loader2, BarChart2, Music, Mic2, ListOrdered, Eye, Heart,
  TrendingUp, DollarSign, Crown, Zap, Ticket, Trophy,
  Plus, Trash2, Check, X, AlertCircle, RefreshCw,
  Users, Calendar, ChevronRight, Settings, Play
} from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';

// ── Carte stat ───────────────────────────────
const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 md:p-5">
    <div className={`mb-3 ${color}`}>{icon}</div>
    <div className="text-2xl font-black">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{label}</div>
    {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
  </div>
);

// ── Section wrapper ──────────────────────────
const Section = ({ title, icon, children, action }) => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
      <h3 className="font-black text-sm flex items-center gap-2">{icon} {title}</h3>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ════════════════════════════════════════════
// DASHBOARD VIEW — ADMIN
// ════════════════════════════════════════════
const DashboardView = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]           = useState(null);
  const [royalties, setRoyalties]   = useState(null);
  const [subs, setSubs]             = useState({ subs: [], total: 0 });
  const [plans, setPlans]           = useState([]);
  const [ads, setAds]               = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [period, setPeriod]         = useState(new Date().toISOString().slice(0, 7));
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg]   = useState('');

  // Formulaires
  const [showPlanForm, setShowPlanForm]           = useState(false);
  const [showAdForm, setShowAdForm]               = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const [planForm, setPlanForm] = useState({ name: 'premium', price: '9.99', currency: 'EUR', interval: 'month', stripePriceId: '', features_hd: true, features_offline: true, features_noAds: true });
  const [challengeForm, setChallengeForm] = useState({ hashtag: '', title: '', description: '', startsAt: '', endsAt: '', prize: '', songId: '' });
  const [adFile, setAdFile] = useState(null);
  const [adForm, setAdForm] = useState({ title: '', advertiser: '', budget: '', cpm: '2', duration: '30', clickUrl: '' });

  const [savingPlan, setSavingPlan]           = useState(false);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [savingAd, setSavingAd]               = useState(false);
  const [songs, setSongs]                     = useState([]);

  const { confirmDialog, ask, close } = useConfirm();
  const h = { Authorization: `Bearer ${token}` };

  const toEuros = (c) => (c / 100).toFixed(2);

  // Chargement
  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsD, royD, subsD, plansD, adsD, challengesD, songsD] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: h }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/royalties?period=${period}`, { headers: h }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/subscriptions`, { headers: h }).then(r => r.ok ? r.json() : { subs: [], total: 0 }),
        fetch(`${API}/plans`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/ads`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/challenges`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/songs?limit=500`).then(r => r.ok ? r.json() : { songs: [] }),
      ]);
      if (statsD)    setStats(statsD);
      if (royD)      setRoyalties(royD);
      if (subsD)     setSubs(subsD);
      if (plansD)    setPlans(Array.isArray(plansD) ? plansD : []);
      if (adsD)      setAds(Array.isArray(adsD) ? adsD : []);
      if (challengesD) setChallenges(Array.isArray(challengesD) ? challengesD : []);
      if (songsD) setSongs(Array.isArray(songsD) ? songsD : (songsD.songs || []));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [period]);

  // Créer un plan
  const createPlan = async (e) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const res = await fetch(`${API}/admin/plans`, {
        method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name, price: Math.round(parseFloat(planForm.price) * 100),
          currency: planForm.currency, interval: planForm.interval,
          stripePriceId: planForm.stripePriceId,
          features: { hd: planForm.features_hd, offline: planForm.features_offline, noAds: planForm.features_noAds, downloads: planForm.features_noAds ? -1 : 0 },
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlans(prev => [data, ...prev]); setShowPlanForm(false);
    } catch (err) { alert(err.message); }
    setSavingPlan(false);
  };

  // Toggle plan actif
  const togglePlan = async (planId, active) => {
    await fetch(`${API}/admin/plans/${planId}`, {
      method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    });
    setPlans(prev => prev.map(p => p._id === planId ? { ...p, active: !active } : p));
  };

  // Créer un challenge
  const createChallenge = async (e) => {
    e.preventDefault();
    setSavingChallenge(true);
    try {
      const body = { ...challengeForm };
      if (!body.hashtag.startsWith('#')) body.hashtag = '#' + body.hashtag;
      const res  = await fetch(`${API}/admin/challenges`, {
        method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setChallenges(prev => [data, ...prev]); setShowChallengeForm(false);
      setChallengeForm({ hashtag:'', title:'', description:'', startsAt:'', endsAt:'', prize:'', songId:'' });
    } catch (err) { alert(err.message); }
    setSavingChallenge(false);
  };

  // Upload campagne pub
  const createAd = async (e) => {
    e.preventDefault();
    if (!adFile) return alert('Fichier audio requis');
    setSavingAd(true);
    try {
      const fd = new FormData();
      fd.append('audio', adFile);
      Object.entries(adForm).forEach(([k, v]) => fd.append(k, v));
      const res  = await fetch(`${API}/admin/ads`, { method: 'POST', headers: h, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAds(prev => [data, ...prev]); setShowAdForm(false);
      setAdFile(null); setAdForm({ title:'', advertiser:'', budget:'', cpm:'2', duration:'30', clickUrl:'' });
    } catch (err) { alert(err.message); }
    setSavingAd(false);
  };

  // Virer les royalties
  const triggerPayout = async () => {
    setPayoutLoading(true); setPayoutMsg('');
    try {
      const res  = await fetch(`${API}/admin/royalties/payout`, {
        method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ period })
      });
      const data = await res.json();
      setPayoutMsg(data.message || 'Virements traités');
      setTimeout(() => setPayoutMsg(''), 5000);
      loadAll();
    } catch {}
    setPayoutLoading(false);
  };

  // Toggle ad
  const toggleAd = async (adId, active) => {
    await fetch(`${API}/admin/ads/${adId}`, {
      method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    });
    setAds(prev => prev.map(a => a._id === adId ? { ...a, active: !active } : a));
  };

  const TABS = [
    { k: 'overview',      label: 'Vue d\'ensemble',  Icon: BarChart2  },
    { k: 'monetisation',  label: 'Monétisation',       Icon: DollarSign },
    { k: 'challenges',    label: 'Challenges',          Icon: Trophy     },
  ];

  const premiumCount = subs.subs?.filter(s => s.planName === 'premium' && s.status === 'active').length || 0;
  const adRevenue    = ads.reduce((s, a) => s + (a.spent || 0), 0);

  if (loading && !stats) return (
    <div className="p-8 text-zinc-500 flex items-center gap-2">
      <Loader2 className="animate-spin" size={16} /> Chargement...
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <ConfirmDialog config={confirmDialog} onClose={close} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <BarChart2 size={24} className="text-red-500" /> Tableau de bord
        </h2>
        <button onClick={loadAll} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-1">
        {TABS.map(({ k, label, Icon }) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === k ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
            <Icon size={12}/> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB: VUE D'ENSEMBLE
      ══════════════════════════════════════ */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats globales */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Musiques',  value: stats.totalSongs,    icon: <Music size={20}/>,      color: 'text-red-400'   },
              { label: 'Artistes',  value: stats.totalArtists,  icon: <Mic2 size={20}/>,       color: 'text-purple-400'},
              { label: 'Playlists', value: stats.totalPlaylists,icon: <ListOrdered size={20}/>,color: 'text-blue-400'  },
              { label: 'Écoutes',   value: stats.totalPlays,    icon: <Eye size={20}/>,        color: 'text-green-400' },
              { label: 'Favoris',   value: stats.totalLikes,    icon: <Heart size={20}/>,      color: 'text-pink-400'  },
            ].map(c => <StatCard key={c.label} {...c} />)}
          </div>

          {/* Stats monéto rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Abonnés Premium"  value={premiumCount}                icon={<Crown size={18}/>}      color="text-yellow-400" sub={`sur ${subs.total} total`}/>
            <StatCard label="Utilisateurs"      value={stats.totalUsers}            icon={<Users size={18}/>}      color="text-blue-400"   sub={`+${stats.newUsersThisWeek} cette semaine`}/>
            <StatCard label="Écoutes aujourd'hui" value={stats.playsToday}          icon={<Play size={18}/>}       color="text-green-400" />
            <StatCard label="Revenus pubs"       value={`${toEuros(adRevenue)} €`}  icon={<Zap size={18}/>}        color="text-orange-400"/>
          </div>

          {/* Top 5 musiques */}
          <Section title="Top 5 musiques" icon={<TrendingUp size={15} className="text-green-400"/>}>
            <div className="flex flex-col gap-2">
              {(stats.topSongs || []).map((song, i) => (
                <div key={song._id} className="flex items-center gap-4 p-3 bg-zinc-800/40 rounded-xl">
                  <span className="text-zinc-600 font-mono text-xs w-4">{i + 1}</span>
                  <img src={song.image} className="w-10 h-10 rounded-md object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{song.titre}</p>
                    <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0"><Eye size={12}/> {song.plays?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: MONÉTISATION
      ══════════════════════════════════════ */}
      {activeTab === 'monetisation' && (
        <div className="space-y-6">

          {/* Sélecteur de période + virement */}
          <div className="flex items-center gap-3 flex-wrap">
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 ring-red-600" />
            <button onClick={triggerPayout} disabled={payoutLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50">
              {payoutLoading ? <Loader2 size={12} className="animate-spin"/> : <DollarSign size={12}/>}
              Virer les royalties — {period}
            </button>
            {payoutMsg && <p className="text-xs text-green-400 font-bold">{payoutMsg}</p>}
          </div>

          {/* ── Plans d'abonnement ── */}
          <Section title="Plans d'abonnement"
            icon={<Crown size={15} className="text-yellow-400"/>}
            action={
              <button onClick={() => setShowPlanForm(!showPlanForm)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition">
                <Plus size={12}/> Nouveau plan
              </button>
            }>

            {showPlanForm && (
              <form onSubmit={createPlan} className="space-y-3 mb-5 pb-5 border-b border-zinc-800">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nouveau plan</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">Nom</label>
                    <select value={planForm.name} onChange={e => setPlanForm(p => ({...p, name: e.target.value}))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none">
                      <option value="free">Gratuit</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">Prix (€)</label>
                    <input type="number" min="0" step="0.01" value={planForm.price}
                      onChange={e => setPlanForm(p => ({...p, price: e.target.value}))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-red-600" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase block mb-1">Stripe Price ID</label>
                  <input value={planForm.stripePriceId} onChange={e => setPlanForm(p => ({...p, stripePriceId: e.target.value}))}
                    placeholder="price_XXXXXXXXXX (depuis le Dashboard Stripe)"
                    className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 ring-red-600" />
                </div>
                <div className="flex gap-3 flex-wrap">
                  {[['features_hd','HD 320k'],['features_offline','Hors-ligne'],['features_noAds','Sans pub']].map(([k,l]) => (
                    <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={planForm[k]} onChange={e => setPlanForm(p => ({...p, [k]: e.target.checked}))}
                        className="accent-red-600"/>
                      <span className="text-xs text-zinc-400">{l}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingPlan}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {savingPlan ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Créer
                  </button>
                  <button type="button" onClick={() => setShowPlanForm(false)} className="px-3 text-zinc-500 text-xs hover:text-white rounded-xl hover:bg-zinc-800 transition">Annuler</button>
                </div>
              </form>
            )}

            {plans.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-4">Aucun plan configuré</p>
              : <div className="space-y-2">
                  {plans.map(plan => (
                    <div key={plan._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                      <Crown size={14} className={plan.name === 'premium' ? 'text-yellow-400' : 'text-zinc-600'}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold capitalize">{plan.name}</p>
                        <p className="text-[10px] text-zinc-500">{(plan.price / 100).toFixed(2)} {plan.currency} / {plan.interval}</p>
                      </div>
                      <button onClick={() => togglePlan(plan._id, plan.active)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-full transition ${plan.active ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-zinc-700 text-zinc-500 hover:bg-green-500/15 hover:text-green-400'}`}>
                        {plan.active ? 'ACTIF' : 'INACTIF'}
                      </button>
                    </div>
                  ))}
                </div>
            }
          </Section>

          {/* ── Royalties artistes ── */}
          {royalties && (
            <Section title={`Royalties artistes — ${period}`}
              icon={<DollarSign size={15} className="text-green-400"/>}>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                  <p className="text-xl font-black text-green-400">{royalties.totalEuros || '0.00'} €</p>
                  <p className="text-[10px] text-zinc-500">Total à reverser</p>
                </div>
                <div className="bg-zinc-800/40 rounded-xl px-4 py-2.5">
                  <p className="text-lg font-black">{royalties.royalties?.length || 0}</p>
                  <p className="text-[10px] text-zinc-500">Artistes</p>
                </div>
              </div>
              {(royalties.royalties || []).length === 0
                ? <p className="text-xs text-zinc-600 text-center py-4">Aucune royalty pour cette période</p>
                : <div className="space-y-2 max-h-64 overflow-y-auto">
                    {royalties.royalties.map(r => (
                      <div key={r._id} className="flex items-center gap-3 p-2.5 bg-zinc-800/30 rounded-xl">
                        {r.artistId?.image && <img src={r.artistId.image} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />}
                        <p className="flex-1 text-sm font-bold truncate">{r.artistId?.nom}</p>
                        <p className="text-sm font-black text-green-400 shrink-0">{toEuros(r.revenue)} €</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${r.status === 'paid' ? 'bg-green-500/15 text-green-400' : r.status === 'processing' ? 'bg-orange-500/15 text-orange-400' : 'bg-zinc-700 text-zinc-500'}`}>
                          {r.status === 'paid' ? 'VERSÉ' : r.status === 'processing' ? 'EN COURS' : 'EN ATTENTE'}
                        </span>
                      </div>
                    ))}
                  </div>
              }
            </Section>
          )}

          {/* ── Abonnements actifs ── */}
          <Section title={`Abonnements actifs (${premiumCount} premium)`}
            icon={<Users size={15} className="text-blue-400"/>}>
            {subs.subs?.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-4">Aucun abonnement</p>
              : <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(subs.subs || []).slice(0, 15).map(s => (
                    <div key={s._id} className="flex items-center gap-3 p-2.5 bg-zinc-800/30 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{s.userId?.nom || s.userId?.email || 'Inconnu'}</p>
                        <p className="text-[10px] text-zinc-600">{s.planName} · {s.provider}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {subs.total > 15 && <p className="text-[10px] text-zinc-600 text-center">+{subs.total - 15} autres</p>}
                </div>
            }
          </Section>

          {/* ── Campagnes pub audio ── */}
          <Section title="Campagnes audio"
            icon={<Zap size={15} className="text-orange-400"/>}
            action={
              <button onClick={() => setShowAdForm(!showAdForm)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition">
                <Plus size={12}/> Nouvelle campagne
              </button>
            }>

            {showAdForm && (
              <form onSubmit={createAd} className="space-y-3 mb-5 pb-5 border-b border-zinc-800">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nouvelle campagne audio</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">Titre *</label>
                    <input value={adForm.title} onChange={e => setAdForm(p => ({...p, title: e.target.value}))} required
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-red-600 placeholder-zinc-600" placeholder="Promo Airtel 2025"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">Annonceur *</label>
                    <input value={adForm.advertiser} onChange={e => setAdForm(p => ({...p, advertiser: e.target.value}))} required
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-red-600 placeholder-zinc-600" placeholder="Airtel"/>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">Budget (€)</label>
                    <input type="number" min="0" value={adForm.budget} onChange={e => setAdForm(p => ({...p, budget: e.target.value}))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none" placeholder="100"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">CPM (€)</label>
                    <input type="number" min="0.5" step="0.5" value={adForm.cpm} onChange={e => setAdForm(p => ({...p, cpm: e.target.value}))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase block mb-1">Durée (s)</label>
                    <select value={adForm.duration} onChange={e => setAdForm(p => ({...p, duration: e.target.value}))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none">
                      <option value="15">15s</option>
                      <option value="30">30s</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase block mb-1">URL de destination (clic)</label>
                  <input type="url" value={adForm.clickUrl} onChange={e => setAdForm(p => ({...p, clickUrl: e.target.value}))}
                    placeholder="https://..." className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-red-600 placeholder-zinc-600"/>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase block mb-1">Fichier audio * (MP3)</label>
                  <div onClick={() => document.getElementById('adAudioInput').click()}
                    className={`border-2 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer transition ${adFile ? 'border-green-500/40 bg-green-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                    <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">{adFile ? <><Check size={10} className="text-green-400"/> {adFile.name}</> : 'Cliquer pour choisir un MP3'}</p>
                    <input id="adAudioInput" type="file" accept="audio/*" className="hidden" onChange={e => setAdFile(e.target.files[0])}/>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingAd || !adFile}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {savingAd ? <Loader2 size={12} className="animate-spin"/> : <Zap size={12}/>} Créer la campagne
                  </button>
                  <button type="button" onClick={() => setShowAdForm(false)} className="px-3 text-zinc-500 text-xs hover:text-white rounded-xl hover:bg-zinc-800 transition">Annuler</button>
                </div>
              </form>
            )}

            {ads.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-4">Aucune campagne</p>
              : <div className="space-y-2">
                  {ads.map(ad => (
                    <div key={ad._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{ad.title}</p>
                        <p className="text-[10px] text-zinc-500">{ad.advertiser} · {ad.impressions?.toLocaleString()} impressions · CTR {ad.ctr || '0%'}</p>
                        <p className="text-[10px] text-orange-400">{ad.spentEuros || '0.00'} € / {ad.budgetEuros || '0.00'} €</p>
                      </div>
                      <button onClick={() => toggleAd(ad._id, ad.active)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-full shrink-0 transition ${ad.active ? 'bg-green-500/15 text-green-400 hover:bg-zinc-700 hover:text-zinc-400' : 'bg-zinc-700 text-zinc-500 hover:bg-green-500/15 hover:text-green-400'}`}>
                        {ad.active ? 'ACTIF' : 'INACTIF'}
                      </button>
                    </div>
                  ))}
                </div>
            }
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: CHALLENGES
      ══════════════════════════════════════ */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <button onClick={() => setShowChallengeForm(!showChallengeForm)}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl text-sm transition active:scale-[0.98]">
            <Plus size={15}/> Créer un nouveau challenge
          </button>

          {showChallengeForm && (
            <Section title="Nouveau challenge" icon={<Trophy size={15} className="text-yellow-400"/>}>
              <form onSubmit={createChallenge} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Hashtag * (ex: #TitreDuMois)</label>
                    <input value={challengeForm.hashtag} onChange={e => setChallengeForm(p => ({...p, hashtag: e.target.value}))}
                      required placeholder="#TitreDuMois"
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Titre *</label>
                    <input value={challengeForm.title} onChange={e => setChallengeForm(p => ({...p, title: e.target.value}))}
                      required placeholder="Titre du mois de juin"
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea value={challengeForm.description} onChange={e => setChallengeForm(p => ({...p, description: e.target.value}))}
                    rows={2} placeholder="Décrivez le challenge pour les fans..."
                    className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Musique associée</label>
                  <select value={challengeForm.songId} onChange={e => setChallengeForm(p => ({...p, songId: e.target.value}))}
                    className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white">
                    <option value="">Aucune musique liée</option>
                    {songs.map(s => <option key={s._id} value={s._id}>{s.titre} — {s.artiste}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Date de début *</label>
                    <input type="datetime-local" value={challengeForm.startsAt}
                      onChange={e => setChallengeForm(p => ({...p, startsAt: e.target.value}))} required
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Date de fin *</label>
                    <input type="datetime-local" value={challengeForm.endsAt}
                      onChange={e => setChallengeForm(p => ({...p, endsAt: e.target.value}))} required
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Prix à gagner</label>
                  <input value={challengeForm.prize} onChange={e => setChallengeForm(p => ({...p, prize: e.target.value}))}
                    placeholder="Accès Premium 3 mois · Merchandising · ..."
                    className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingChallenge}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingChallenge ? <Loader2 size={14} className="animate-spin"/> : <Trophy size={14}/>}
                    Lancer le challenge
                  </button>
                  <button type="button" onClick={() => setShowChallengeForm(false)}
                    className="px-4 text-zinc-500 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
                    Annuler
                  </button>
                </div>
              </form>
            </Section>
          )}

          {/* Liste des challenges */}
          <Section title={`Challenges (${challenges.length})`} icon={<Trophy size={15} className="text-purple-400"/>}>
            {challenges.length === 0
              ? <div className="text-center py-8 text-zinc-600">
                  <Trophy size={32} className="mx-auto mb-2 opacity-20"/>
                  <p className="text-sm">Aucun challenge créé</p>
                  <p className="text-[11px] mt-1 text-zinc-700">Les challenges augmentent l'engagement et la viralité</p>
                </div>
              : <div className="space-y-3">
                  {challenges.map(ch => {
                    const now      = new Date();
                    const started  = new Date(ch.startsAt) <= now;
                    const ended    = new Date(ch.endsAt)   <  now;
                    const status   = !started ? 'À VENIR' : ended ? 'TERMINÉ' : 'EN COURS';
                    const statusColor = !started ? 'bg-blue-500/15 text-blue-400' : ended ? 'bg-zinc-700 text-zinc-500' : 'bg-green-500/15 text-green-400';
                    return (
                      <div key={ch._id} className="bg-zinc-800/40 rounded-2xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-purple-300">{ch.hashtag}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span>
                            </div>
                            <p className="text-sm font-bold truncate mt-0.5">{ch.title}</p>
                            {ch.description && <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{ch.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1"><Users size={9}/> {ch.entries || 0} participants</span>
                          <span className="flex items-center gap-1"><Calendar size={9}/> {new Date(ch.startsAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} → {new Date(ch.endsAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                          {ch.prize && <span className="text-yellow-400 flex items-center gap-1"><Trophy size={9}/> {ch.prize}</span>}
                        </div>
                        {ch.songId && (
                          <div className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-1.5">
                            {ch.songId.image && <img src={ch.songId.image} className="w-6 h-6 rounded-md object-cover shrink-0" alt="" />}
                            <p className="text-[10px] text-zinc-400 truncate">{ch.songId.titre || 'Musique associée'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            }
          </Section>
        </div>
      )}
    </div>
  );
};

export default DashboardView;