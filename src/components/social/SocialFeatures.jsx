import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, History, Share2, Sparkles, Check, CheckCheck,
  Trash2, Loader2, X, Play, Pause, Clock, TrendingUp,
  Copy, Link, ExternalLink, ChevronRight, BarChart2,
  Calendar, Headphones, RefreshCw, Heart, Music, Download
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const API = 'https://backend-moozik.vercel.app';

// ── helpers ──────────────────────────────────
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)     return 'à l\'instant';
  if (s < 3600)   return `${Math.floor(s/60)} min`;
  if (s < 86400)  return `${Math.floor(s/3600)} h`;
  if (s < 604800) return `${Math.floor(s/86400)} j`;
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
};

const NOTIF_CFG = {
  new_song:  { emoji: '🎵', bg: 'bg-red-500/15',    border: 'border-red-500/20' },
  comment:   { emoji: '💬', bg: 'bg-blue-500/15',   border: 'border-blue-500/20' },
  reaction:  { emoji: '❤️',  bg: 'bg-pink-500/15',   border: 'border-pink-500/20' },
  new_album: { emoji: '💿', bg: 'bg-yellow-500/15', border: 'border-yellow-500/20' },
  // ✅ AJOUTER
  system:    { emoji: '📢', bg: 'bg-zinc-500/15',   border: 'border-zinc-500/20' },
  update:    { emoji: '🔔', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
  info:      { emoji: 'ℹ️',  bg: 'bg-blue-400/15',   border: 'border-blue-400/20' },
};

// ════════════════════════════════════════════
// 🔔 NOTIFICATIONS PANEL
// isPage={true}  → vue pleine page (route /notifications)
// isPage={false} → popover cloche dans la sidebar
// ════════════════════════════════════════════
export const NotificationsPanel = ({ token, onPlaySong, onUnreadCount, isPage = false, navigateToPage = false }) => {
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifs]= useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const panelRef                  = useRef(null);
  let navigate = null;
  try { navigate = useNavigate(); } catch {}

  // Badge polling toutes les 30s
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let timeoutId = null;

    const poll = async () => {
      try {
        const response = await fetch(`${API}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (response.status === 401) {
          console.error("Auth error: Token expired or invalid.");
          return;
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const d = await response.json();
        setUnread(d.count || 0);
        if (onUnreadCount) onUnreadCount(d.count || 0);

        retryCount = 0; // ✅ Reset au succès
        timeoutId = setTimeout(poll, 30_000); // ✅ Interval chaîné, pas fixe

      } catch (err) {
        if (err.name === 'AbortError') return;

        retryCount++;
        console.error(`Polling error (tentative ${retryCount}):`, err);

        if (retryCount <= MAX_RETRIES) {
          // ✅ Backoff exponentiel : 5s, 10s, 20s...
          const delay = Math.min(5_000 * 2 ** (retryCount - 1), 60_000);
          timeoutId = setTimeout(poll, delay);
        } else {
          console.warn("Polling suspendu après trop d'échecs.");
        }
      }
    };

    poll();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [token, API]); // Added API to dependencies

  // Charger auto si mode page
  useEffect(() => {
    if (isPage && token) loadNotifs(1);
  }, [isPage, token]);

  // Fermer en cliquant dehors (mode popover)
  useEffect(() => {
    if (!open || isPage) return;
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, isPage]);

  const loadNotifs = useCallback(async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetch(`${API}/notifications?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      if (p === 1) setNotifs(data.notifications || []);
      else setNotifs(prev => [...prev, ...(data.notifications || [])]);
      setUnread(data.unreadCount || 0);
      if (onUnreadCount) onUnreadCount(data.unreadCount || 0);
      setHasMore(p < (data.pagination?.pages || 1));
      setPage(p);
    } catch {}
    setLoading(false);
  }, [token]);

  const openPanel = () => {
    if (navigateToPage && navigate) { navigate('/notifications'); return; }
    setOpen(true); loadNotifs(1);
  };

  const markRead = async (id) => {
    await fetch(`${API}/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, lu: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    if (onUnreadCount) onUnreadCount(Math.max(0, unread - 1));
  };

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    setUnread(0);
    if (onUnreadCount) onUnreadCount(0);
  };

  const clearRead = async () => {
    await fetch(`${API}/notifications/clear`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifs(prev => prev.filter(n => !n.lu));
  };

const handleClick = (notif) => {
  if (!notif.lu) markRead(notif._id);
  if (!isPage) setOpen(false);

  // Notification système : pas de songId ni albumId → rien à ouvrir
  if (!notif.songId && !notif.albumId) return;

  switch (notif.type) {
    case 'new_song':
    case 'reaction':
      if (notif.songId && onPlaySong) {
        onPlaySong(notif.songId._id || notif.songId);
      }
      break;
    case 'comment':
      if (notif.songId && navigate) {
        navigate(`/song/${notif.songId._id || notif.songId}`);
      } else if (notif.songId && onPlaySong) {
        onPlaySong(notif.songId._id || notif.songId);
      }
      break;
    case 'new_album':
      if (notif.albumId && navigate) {
        navigate(`/album/${notif.albumId._id || notif.albumId}`);
      }
      break;
    default:
      break;
  }
};

  if (!token) return null;

  // ── Contenu partagé (liste de notifs) ──────
  const NotifList = () => (
    <>
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-zinc-600">
          <Loader2 size={18} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
          <BellOff size={30} className="mb-2 opacity-40" />
          <p className="text-xs">Aucune notification</p>
        </div>
      ) : (
        <>
          {notifications.map(notif => {
            const cfg = NOTIF_CFG[notif.type] || NOTIF_CFG.new_song;
            return (
              <div key={notif._id} onClick={() => handleClick(notif)}
                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition border-b border-zinc-800/40 ${!notif.lu ? 'bg-white/2' : ''}`}>
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
                  {notif.songId?.image
                    ? <img src={notif.songId.image} className="w-full h-full object-cover" alt="" />
                    : <span className="text-base">{cfg.emoji}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold leading-tight ${!notif.lu ? 'text-white' : 'text-zinc-400'}`}>{notif.titre}</p>
                  {notif.message && <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{notif.message}</p>}
                  <p className="text-[9px] text-zinc-700 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.lu && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />}
              </div>
            );
          })}
          {hasMore && (
            <button onClick={() => loadNotifs(page + 1)} disabled={loading}
              className="w-full py-2.5 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800 transition flex items-center justify-center gap-1.5">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />} Voir plus
            </button>
          )}
        </>
      )}
    </>
  );

  // ── Actions communes ──────────────────────
  const Actions = () => (
    <div className="flex items-center gap-1">
      {unread > 0 && (
        <button onClick={markAllRead} title="Tout marquer lu"
          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
          <CheckCheck size={13} />
        </button>
      )}
      <button onClick={clearRead} title="Effacer lues"
        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition">
        <Trash2 size={13} />
      </button>
    </div>
  );

  // ── MODE PAGE (vue pleine) ────────────────
  if (isPage) {
    return (
      <div className="space-y-4">
        {/* Barre d'actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unread > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread} non lues</span>}
          </div>
          <Actions />
        </div>
        {/* Liste */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <NotifList />
        </div>
      </div>
    );
  }

  // ── MODE POPOVER (cloche dans sidebar) ───
  return (
    <div className="relative" ref={panelRef}>
      {/* Badge cloche */}
      <button onClick={openPanel}
        className="relative p-2 text-zinc-400 hover:text-white transition rounded-xl hover:bg-zinc-800">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-200 right-0 top-10 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-red-500" />
              <span className="font-black text-sm">Notifications</span>
              {unread > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
            </div>
            <div className="flex items-center gap-1">
              <Actions />
              <button onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                <X size={13} />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <NotifList />
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// 📜 HISTORIQUE D'ÉCOUTE
// ════════════════════════════════════════════
export const HistoryView = ({ token, currentSong, setCurrentSong, setIsPlaying }) => {
  const [history, setHistory]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab]               = useState('history');
  const [clearing, setClearing]     = useState(false);

  const loadHistory = useCallback(async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetch(`${API}/history?page=${p}&limit=30`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      if (p === 1) setHistory(data.history || []);
      else setHistory(prev => [...prev, ...(data.history || [])]);
      setTotalPages(data.pagination?.pages || 1);
      setPage(p);
    } catch {}
    setLoading(false);
  }, [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try { const d = await fetch(`${API}/history/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()); setStats(d); }
    catch {}
    setLoadingStats(false);
  }, [token]);

  useEffect(() => { loadHistory(1); loadStats(); }, [loadHistory, loadStats]);

  const clearHistory = async () => {
    if (!window.confirm('Vider tout votre historique ?')) return;
    setClearing(true);
    await fetch(`${API}/history`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setHistory([]); setStats(null); setClearing(false);
  };

  const grouped = history.reduce((acc, entry) => {
    if (!entry.song) return acc;
    const day = new Date(entry.playedAt).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  return (
    <div className="animate-in fade-in duration-500 w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center">
            <History size={19} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-black">Historique</h2>
            <p className="text-xs text-zinc-500">{history.length} écoute{history.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={clearHistory} disabled={clearing || history.length === 0}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition disabled:opacity-30">
          {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Vider
        </button>
      </div>

      <div className="flex bg-zinc-800/50 rounded-xl p-1 mb-6 gap-1">
        {[['history', <Clock size={12}/>, 'Écoutes'], ['stats', <BarChart2 size={12}/>, 'Mes stats']].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${tab === key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        loading && history.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-zinc-600"><Loader2 size={22} className="animate-spin mr-2" /> Chargement...</div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-600">
            <Headphones size={38} className="mb-3 opacity-30" />
            <p className="text-sm">Aucune écoute enregistrée</p>
            <p className="text-xs mt-1 text-zinc-700">Les titres écoutés plus de 30 secondes apparaissent ici</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, entries]) => (
              <div key={day}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Calendar size={10} /> {day}
                </p>
                <div className="flex flex-col gap-1">
                  {entries.map((entry, i) => {
                    const s = entry.song;
                    if (!s) return null;
                    const active = currentSong?._id === (s._id || s);
                    return (
                      <div key={`${entry._id}-${i}`} onClick={() => { setCurrentSong(s); setIsPlaying(true); }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition ${active ? 'bg-red-600/10' : 'hover:bg-white/5'}`}>
                        <div className="relative shrink-0">
                          <img src={s.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className={`absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center transition ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {active ? <Pause fill="white" size={14} /> : <Play fill="white" size={14} />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${active ? 'text-red-400' : ''}`}>{s.titre}</p>
                          <p className="text-[10px] text-zinc-500 uppercase truncate">{s.artiste}</p>
                        </div>
                        <span className="text-[9px] text-zinc-700 shrink-0">
                          {new Date(entry.playedAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {page < totalPages && (
              <button onClick={() => loadHistory(page + 1)} disabled={loading}
                className="w-full py-3 text-xs text-zinc-500 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-xl transition flex items-center justify-center gap-2">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Charger plus
              </button>
            )}
          </div>
        )
      )}

      {tab === 'stats' && (
        loadingStats ? (
          <div className="flex items-center justify-center py-16 text-zinc-600"><Loader2 size={22} className="animate-spin mr-2" /> Chargement...</div>
        ) : !stats || stats.totalEcoutes === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-600">
            <BarChart2 size={38} className="mb-3 opacity-30" />
            <p className="text-sm">Pas encore de statistiques</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total écoutes', value: stats.totalEcoutes, icon: <Headphones size={17}/>, color: 'text-purple-400' },
                { label: 'Jours actifs',  value: stats.joursActifs,  icon: <Calendar size={17}/>,   color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-center">
                  <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {stats.topSongs?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
                  <TrendingUp size={11} className="text-green-400" /> Mes titres préférés
                </p>
                <div className="flex flex-col gap-1.5">
                  {stats.topSongs.map((item, i) => (
                    <div key={item._id} onClick={() => { setCurrentSong(item.song); setIsPlaying(true); }}
                      className="flex items-center gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-800 rounded-xl cursor-pointer transition">
                      <span className={`font-black text-lg w-6 shrink-0 ${i===0?'text-yellow-400':i===1?'text-zinc-300':i===2?'text-amber-600':'text-zinc-700'}`}>{i+1}</span>
                      <img src={item.song.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.song.titre}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{item.song.artiste}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full shrink-0">
                        <Headphones size={9} /> {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// 🔗 BOUTON PARTAGE
// ════════════════════════════════════════════
export const ShareButton = ({ song, size = 15 }) => {
  const [state, setstate]     = useState('idle');
  const [shareUrl, setUrl]    = useState('');
  const [showPop, setShowPop] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!showPop) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowPop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPop]);

  const generate = async (e) => {
    e.stopPropagation();
    if (shareUrl) { setShowPop(true); return; }
    setstate('loading');
    try {
      const data = await fetch(`${API}/songs/${song._id}/share`, { method: 'POST' }).then(r => r.json());
      // Remplacer le domaine de l'URL par le frontend courant
      const frontendUrl = window.location.origin;
      const token = data.shareToken;
      const url = `${frontendUrl}/share/${token}`;
      setUrl(url);
      setShowPop(true);
      setstate('idle');
    } catch { setstate('error'); setTimeout(() => setstate('idle'), 2000); }
  };

  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setstate('copied'); setTimeout(() => setstate('idle'), 2500);
  };

  const shareNative = async (e) => {
    e.stopPropagation();
    if (!navigator.share) return;
    try { await navigator.share({ title: `${song.titre} — ${song.artiste}`, text: `Écoute "${song.titre}" sur Moozik`, url: shareUrl }); }
    catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={generate} title="Partager"
        className="p-1.5 text-zinc-500 hover:text-white transition rounded-lg hover:bg-white/10">
        {state === 'loading' ? <Loader2 size={size} className="animate-spin" /> : <Share2 size={size} />}
      </button>

      {showPop && shareUrl && (
        <div className="absolute bottom-9 right-0 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-100 p-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-3">
            <img src={song.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{song.titre}</p>
              <p className="text-[10px] text-zinc-500 truncate">{song.artiste}</p>
            </div>
            <button onClick={() => setShowPop(false)} className="ml-auto text-zinc-600 hover:text-white shrink-0"><X size={13}/></button>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 mb-3">
            <Link size={11} className="text-zinc-500 shrink-0" />
            <p className="text-[10px] text-zinc-400 flex-1 truncate">{shareUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${state==='copied' ? 'bg-green-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
              {state==='copied' ? <><Check size={12}/> Copié !</> : <><Copy size={12}/> Copier</>}
            </button>
            {navigator.share && (
              <button onClick={shareNative} className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition">
                <ExternalLink size={13} />
              </button>
            )}
          </div>
          <p className="text-[9px] text-zinc-700 text-center mt-2">Lien valable 7 jours</p>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// 🎵 PAGE DE PARTAGE  (/share/:shareToken)
// Reçoit un token JWT de partage et affiche la musique
// ════════════════════════════════════════════
export const SharePageView = ({ setCurrentSong, setIsPlaying }) => {
  const { shareToken } = useParams();
  const [song, setSong]     = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (!shareToken) { setError('Lien invalide'); setLoading(false); return; }
    fetch(`${API}/share/${shareToken}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || 'Lien invalide');
        setSong(data.song);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const playNow = () => {
    if (!song) return;
    setCurrentSong(song);
    setIsPlaying(true);
    setPlayed(true);
    fetch(`${API}/share/${shareToken}/play`, { method: 'PUT' }).catch(() => {});
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-500">
      <Loader2 size={24} className="animate-spin mr-2" /> Chargement du titre...
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
      <Music size={40} className="opacity-20" />
      <p className="text-sm font-bold">{error}</p>
      <p className="text-xs text-zinc-700">Ce lien est peut-être expiré ou invalide.</p>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto mt-12 animate-in fade-in duration-500">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Cover */}
        <div className="relative">
          <img src={song.image} className="w-full aspect-square object-cover" alt="" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />
        </div>
        {/* Info */}
        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Partagé avec vous</p>
          <h2 className="text-2xl font-black mb-1">{song.titre}</h2>
          <p className="text-zinc-400 text-sm mb-6">{song.artiste}</p>
          <button onClick={playNow}
            className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 ${
              played ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}>
            {played
              ? <><Check size={16}/> En cours de lecture</>
              : <><Play fill="white" size={16}/> Écouter maintenant</>
            }
          </button>
          <p className="text-center text-[10px] text-zinc-700 mt-4">
            Écoute via <span className="text-zinc-500 font-bold">MOOZIK</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// 🎯 RECOMMANDATIONS
// ════════════════════════════════════════════
export const RecommendationsView = ({ token, currentSong, setCurrentSong, setIsPlaying, isPlaying }) => {
  const [recos, setRecos]     = useState([]);
  const [message, setMessage] = useState('');
  const [basedOn, setBasedOn] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const data = await fetch(`${API}/recommendations?limit=15`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setRecos(data.recommendations || []);
      setMessage(data.message || '');
      setBasedOn(data.basedOn || 'popular');
    } catch {}
    setLoading(false); setRefresh(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!token) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
      <Sparkles size={38} className="mb-3 opacity-30" />
      <p className="text-sm font-bold">Connectez-vous</p>
      <p className="text-xs mt-1">Pour des recommandations personnalisées</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <Sparkles size={19} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">Pour vous</h2>
            <p className="text-xs text-zinc-500">{message}</p>
          </div>
        </div>
        <button onClick={() => load(true)} disabled={refresh}
          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition">
          <RefreshCw size={15} className={refresh ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full mb-5 ${basedOn==='history' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
        {basedOn==='history' ? <><TrendingUp size={9}/> Personnalisé</> : <><Music size={9}/> Populaires</>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array(10).fill(0).map((_,i) => (
            <div key={i} className="rounded-xl bg-zinc-900/60 animate-pulse">
              <div className="aspect-square rounded-xl bg-zinc-800 mb-2" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-zinc-800 rounded-full w-3/4" />
                <div className="h-2.5 bg-zinc-800 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recos.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-zinc-600">
          <Sparkles size={36} className="mb-3 opacity-30" />
          <p className="text-sm">Aucune recommandation disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {recos.map(song => {
            const active = currentSong?._id === song._id;
            return (
              <div key={song._id} onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                className={`p-3 rounded-xl cursor-pointer group transition relative ${active ? 'bg-zinc-800 ring-1 ring-red-500/40' : 'bg-zinc-900/40 hover:bg-zinc-800'}`}>
                <div className="relative aspect-square mb-2">
                  <img src={song.image} className="w-full h-full rounded-lg object-cover shadow" alt="" />
                  <div className={`absolute inset-0 rounded-lg flex items-center justify-center bg-black/40 transition ${active&&isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="p-2 bg-red-600 rounded-full shadow-xl">
                      {active&&isPlaying ? <Pause fill="white" size={13}/> : <Play fill="white" size={13}/>}
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                    <ShareButton song={song} size={12} />
                  </div>
                </div>
                <p className="text-xs font-bold truncate">{song.titre}</p>
                <p className="text-[10px] text-zinc-500 truncate uppercase mt-0.5">{song.artiste}</p>
                {song.plays > 0 && (
                  <p className="text-[9px] text-zinc-700 flex items-center gap-0.5 mt-0.5">
                    <TrendingUp size={8} className="text-green-500/70"/>{song.plays}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {currentSong && (
        <SimilarSongs song={currentSong} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} isPlaying={isPlaying} currentSong={currentSong} />
      )}
    </div>
  );
};

// ── Titres similaires ─────────────────────────
const SimilarSongs = ({ song, setCurrentSong, setIsPlaying, isPlaying, currentSong }) => {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!song?._id) return;
    setLoading(true);
    fetch(`${API}/songs/${song._id}/similar`)
      .then(r => r.json())
      .then(d => { setSimilar(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [song?._id]);

  if (!similar.length && !loading) return null;

  return (
    <div className="mt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
        <Music size={10}/> Similaires à "{song.titre}"
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {loading
          ? Array(5).fill(0).map((_,i) => <div key={i} className="shrink-0 w-24"><div className="w-24 h-24 rounded-xl bg-zinc-800 animate-pulse mb-1.5"/><div className="h-2.5 bg-zinc-800 rounded animate-pulse w-3/4"/></div>)
          : similar.map(s => {
            const active = currentSong?._id === s._id;
            return (
              <div key={s._id} onClick={() => { setCurrentSong(s); setIsPlaying(true); }} className="shrink-0 w-24 group cursor-pointer">
                <div className="relative w-24 h-24 mb-1.5">
                  <img src={s.image} className="w-full h-full rounded-xl object-cover" alt="" />
                  <div className={`absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 transition ${active&&isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="p-1.5 bg-red-600 rounded-full">{active&&isPlaying ? <Pause fill="white" size={11}/> : <Play fill="white" size={11}/>}</div>
                  </div>
                </div>
                <p className="text-xs font-bold truncate">{s.titre}</p>
                <p className="text-[10px] text-zinc-500 truncate uppercase">{s.artiste}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export const useHistoryTracker = (currentSong, currentTime, token) => {
  const tracked = useRef(null);
  useEffect(() => { tracked.current = null; }, [currentSong?._id]);
  useEffect(() => {
    if (!token || !currentSong || currentTime < 30) return;
    if (tracked.current === currentSong._id) return;
    tracked.current = currentSong._id;
  }, [currentSong, currentTime, token]);
};