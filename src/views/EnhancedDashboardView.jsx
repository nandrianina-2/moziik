import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  TrendingUp, Music, Users, Eye, Flame, BarChart2, Play,
  AlertTriangle, Share2, X, ChevronRight, Loader2,
  WifiOff, Disc3, Mic2
} from 'lucide-react';
import { API } from '../config/api';
import { DashboardSkeleton } from '../components/ui/Skeletons';

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

// ── Stat card cliquable ─────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'text-red-400', onClick, active }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl p-5 border flex items-start gap-4 transition ${
      onClick ? 'cursor-pointer hover:border-zinc-600' : ''
    } ${active ? 'border-red-500/40 bg-zinc-800/60' : 'border-zinc-800/50 bg-zinc-900/60'}`}>
    <div className={`p-2.5 rounded-xl bg-zinc-800 ${color} shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{label}</p>
      <p className="text-2xl font-black mt-0.5">{value?.toLocaleString() ?? '—'}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
    {onClick && <ChevronRight size={14} className="text-zinc-700 ml-auto mt-1 shrink-0" />}
  </div>
);

// ── Modal liste détaillée ───────────────────────
const DetailModal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-400 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-5 border-b border-zinc-800">
        <h3 className="font-black text-sm">{title}</h3>
        <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"><X size={15}/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  </div>
);



const EnhancedDashboardView = ({ token }) => {
  const [stats, setStats]             = useState(null);
  const [playsHistory, setPlaysHistory] = useState([]);
  const [topSongs, setTopSongs]       = useState([]);
  const [topArtists, setTopArtists]   = useState([]);
  const [userStats, setUserStats]     = useState([]);
  const [activeUsers, setActiveUsers] = useState({ count: 0, users: [] });
  const [unassigned, setUnassigned]   = useState({ count: 0, songs: [] });
  const [shareStats, setShareStats]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [period, setPeriod]           = useState('7d');
  // Modals
  const [modal, setModal]             = useState(null); // 'songs'|'artists'|'users'|'active'|'unassigned'|'shares'

  const h = { Authorization: `Bearer ${token}` };


  // Fusionner les partages par chanson (même songId)
  const mergedStats = Object.values(
    shareStats.reduce((acc, sh) => {
      const key = sh.songId?._id || sh.songId || 'unknown';
      
      if (!acc[key]) {
        acc[key] = { ...sh, viewCount: 0, playCount: 0 };
      }
      
      acc[key].viewCount += sh.viewCount || 0;
      acc[key].playCount += sh.playCount || 0;
      
      return acc;
    }, {})
  ).sort((a, b) => (b.viewCount + b.playCount) - (a.viewCount + a.playCount)); // tri par popularité

  // Nombre de chansons uniques partagées
  const uniqueSongsCount = new Set(
    shareStats.map(sh => sh.songId?._id || sh.songId || 'unknown')
  ).size;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, histRes, songsRes, artistsRes, usersRes, activeRes, unassignedRes, sharesRes] = await Promise.all([
          fetch(`${API}/admin/stats`, { headers: h }),
          fetch(`${API}/admin/stats/plays-history?period=${period}`, { headers: h }),
          fetch(`${API}/admin/stats/top-songs?limit=10`, { headers: h }),
          fetch(`${API}/admin/stats/top-artists?limit=6`, { headers: h }),
          fetch(`${API}/admin/stats/users-growth`, { headers: h }),
          fetch(`${API}/admin/active-users`, { headers: h }),
          fetch(`${API}/admin/unassigned-songs`, { headers: h }),
          fetch(`${API}/admin/shares`, { headers: h }),
        ]);
        if (statsRes.ok)      setStats(await statsRes.json());
        if (histRes.ok)       setPlaysHistory(await histRes.json());
        if (songsRes.ok)      setTopSongs(await songsRes.json());
        if (artistsRes.ok)    setTopArtists(await artistsRes.json());
        if (usersRes.ok)      setUserStats(await usersRes.json());
        if (activeRes.ok)     setActiveUsers(await activeRes.json());
        if (unassignedRes.ok) setUnassigned(await unassignedRes.json());
        if (sharesRes.ok)     setShareStats(await sharesRes.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, [token, period]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Modal ── */}
      {modal === 'songs' && topSongs.length > 0 && (
        <DetailModal title={`Top ${topSongs.length} titres`} onClose={() => setModal(null)}>
          <div className="space-y-2">
            {topSongs.map((song, i) => (
              <div key={song._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5">
                <span className="text-xs font-black text-zinc-600 w-5 text-right shrink-0">{i+1}</span>
                <img src={song.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{song.titre}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{song.artiste}</p>
                </div>
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 shrink-0"><Play size={9}/>{song.plays?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </DetailModal>
      )}
      {modal === 'artists' && topArtists.length > 0 && (
        <DetailModal title="Top artistes" onClose={() => setModal(null)}>
          <div className="space-y-2">
            {topArtists.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5">
                <span className="text-xs font-black text-zinc-600 w-5 text-right shrink-0">{i+1}</span>
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-black text-zinc-500">{a.nom[0]}</div>
                <p className="flex-1 text-sm font-bold truncate">{a.nom}</p>
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 shrink-0"><Eye size={9}/>{a.plays?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </DetailModal>
      )}
      {modal === 'active' && (
        <DetailModal title={`${activeUsers.count} utilisateur${activeUsers.count!==1?'s':''} actif${activeUsers.count!==1?'s':''} (15 min)`} onClose={() => setModal(null)}>
          {activeUsers.users.length === 0
            ? <p className="text-sm text-zinc-500 text-center py-8">Aucun utilisateur actif en ce moment</p>
            : <div className="space-y-2">
              {activeUsers.users.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center text-xs font-black text-green-400 shrink-0">
                    {(u.nom||u.email||'?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{u.nom||<span className="text-zinc-500 italic">Sans nom</span>}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0"/>
                </div>
              ))}
            </div>
          }
        </DetailModal>
      )}
      {modal === 'unassigned' && (
        <DetailModal title={`${unassigned.count} musique${unassigned.count!==1?'s':''} sans artiste`} onClose={() => setModal(null)}>
          {unassigned.songs.length === 0
            ? <p className="text-sm text-zinc-500 text-center py-8">Toutes les musiques ont un artiste 🎉</p>
            : <div className="space-y-2">
              {unassigned.songs.map(s => (
                <div key={s._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5">
                  <img src={s.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.titre}</p>
                    <p className="text-[10px] text-orange-400">Artiste manquant</p>
                  </div>
                </div>
              ))}
            </div>
          }
        </DetailModal>
      )}
      {modal === 'shares' && (
        <DetailModal title="Historique des partages" onClose={() => setModal(null)}>
          {mergedStats.length === 0
            ? <p className="text-sm text-zinc-500 text-center py-8">Aucun partage enregistré</p>
            : <div className="space-y-2">
                {mergedStats.slice(0, 20).map(sh => (
                  <div key={sh._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5">
                    {sh.songId?.image && <img src={sh.songId.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{sh.songId?.titre || 'Musique supprimée'}</p>
                      {/* Optionnel : afficher le nombre de partages fusionnés */}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-blue-400">{sh.viewCount} vue{sh.viewCount !== 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-green-400">{sh.playCount} écoute{sh.playCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </DetailModal>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><BarChart2 size={22} className="text-red-400"/> Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Vue d'ensemble de votre plateforme</p>
        </div>
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {['7d','30d','90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${period===p?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
              {p==='7d'?'7 jours':p==='30d'?'30 jours':'3 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alertes ── */}
      {(unassigned.count > 0 || activeUsers.count > 0) && (
        <div className="flex flex-wrap gap-3">
          {unassigned.count > 0 && (
            <button onClick={() => setModal('unassigned')}
              className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-3 py-2 rounded-xl hover:bg-orange-500/20 transition">
              <AlertTriangle size={13}/> {unassigned.count} musique{unassigned.count!==1?'s':''} sans artiste
            </button>
          )}
          {activeUsers.count > 0 && (
            <button onClick={() => setModal('active')}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-500/20 transition">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>
              {activeUsers.count} actif{activeUsers.count!==1?'s':''}
            </button>
          )}
          {shareStats.length > 0 && (
            <button onClick={() => setModal('shares')}
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-500/20 transition">
              <Share2 size={13}/> {uniqueSongsCount} partage{uniqueSongsCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Music size={18}/>} label="Titres" value={stats?.totalSongs} sub="dans la bibliothèque" color="text-red-400" onClick={() => setModal('songs')} active={modal==='songs'} />
        <StatCard icon={<Users size={18}/>} label="Utilisateurs" value={stats?.totalUsers} sub={`+${stats?.newUsersThisWeek??0} cette semaine`} color="text-blue-400" onClick={() => setModal('active')} active={modal==='active'} />
        <StatCard icon={<Eye size={18}/>} label="Écoutes totales" value={stats?.totalPlays} sub="depuis le début" color="text-green-400" />
        <StatCard icon={<Flame size={18}/>} label="Écoutes aujourd'hui" value={stats?.playsToday} sub="en temps réel" color="text-orange-400" />
      </div>

      {/* ── Graphique écoutes ── */}
      {playsHistory.length > 0 && (
        <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
          <h2 className="font-bold text-sm text-zinc-300 mb-5 flex items-center gap-2">
            <TrendingUp size={15} className="text-red-400"/> Écoutes dans le temps
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={playsHistory} margin={{ top:5, right:10, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="playsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
              <XAxis dataKey="date" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} width={35}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="plays" name="Écoutes" stroke="#ef4444" strokeWidth={2} fill="url(#playsGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top songs + Top artists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {topSongs.length > 0 && (
          <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-zinc-300 flex items-center gap-2">
                <Flame size={15} className="text-orange-400"/> Top 10 titres
              </h2>
              <button onClick={() => setModal('songs')} className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition">
                Voir tout <ChevronRight size={11}/>
              </button>
            </div>
            <div className="space-y-2">
              {topSongs.slice(0,5).map((song, i) => (
                <div key={song._id} className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-zinc-700 w-5 text-right shrink-0">{i+1}</span>
                  <img src={song.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt=""/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{song.titre}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0"><Play size={9}/>{song.plays?.toLocaleString()}</div>
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-red-500 rounded-full" style={{ width:`${topSongs[0]?.plays?(song.plays/topSongs[0].plays)*100:0}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {topArtists.length > 0 && (
          <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-zinc-300 flex items-center gap-2"><Users size={15} className="text-blue-400"/> Top artistes</h2>
              <button onClick={() => setModal('artists')} className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition">Voir tout <ChevronRight size={11}/></button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topArtists} layout="vertical" margin={{ left:0, right:20 }}>
                <XAxis type="number" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="nom" tick={{ fill:'#a1a1aa', fontSize:11 }} axisLine={false} tickLine={false} width={80}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="plays" name="Écoutes" radius={[0,6,6,0]}>
                  {topArtists.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Croissance utilisateurs ── */}
      {userStats.length > 0 && (
        <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
          <h2 className="font-bold text-sm text-zinc-300 mb-5 flex items-center gap-2"><Users size={15} className="text-blue-400"/> Croissance utilisateurs</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={userStats} margin={{ top:5, right:10, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/>
              <XAxis dataKey="date" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} width={35}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="users" name="Utilisateurs" stroke="#3b82f6" strokeWidth={2} fill="url(#usersGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboardView;