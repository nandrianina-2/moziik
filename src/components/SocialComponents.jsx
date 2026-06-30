import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame, TrendingUp, Play, Pause, ChevronRight, Trophy,
  Medal, Award, Star, Zap, Plus, Crown, Users, MessageCircle,
  Send, X, Copy, Check, Loader2, Clock, Heart, Share2,
  Music, Eye, Radio, Volume2, Sparkles, Mic
} from 'lucide-react';

// const API = import.meta.env.VITE_API_URL || 'https://backend-moozik.vercel.app';
import { API } from '../config/api';

// ════════════════════════════════════════════
// TrendingView — Classement en temps réel
// ════════════════════════════════════════════
export const TrendingView = ({ setCurrentSong, setIsPlaying, currentSong, isPlaying, token }) => {
  const [tab, setTab]       = useState('songs');
  const [chart, setChart]   = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [fanBadges, setFanBadges] = useState({});
  const [loading, setLoading] = useState(true);

  // fetch(`${API}/charts/songs`).then(r => r.json()).then(console.log)


  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/charts/${tab}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/challenges`).then(r => r.ok ? r.json() : []),
    ]).then(([c, ch]) => {
      setChart(c); setChallenges(Array.isArray(ch) ? ch : []);
    }).finally(() => setLoading(false));
  }, [tab]);

  const rankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-zinc-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-zinc-600';
  };

  const changeIcon = (change) => {
    if (change > 0) return <span className="text-[9px] text-green-400 font-bold">▲{change}</span>;
    if (change < 0) return <span className="text-[9px] text-red-400 font-bold">▼{Math.abs(change)}</span>;
    return <span className="text-[9px] text-zinc-600">—</span>;
  };

  // console.log(entry);
  const tabs = [
    { key: "songs", label: "Titres", icon: Flame, color: "text-red-500" },
    { key: "new", label: "Nouveautés", icon: Sparkles, color: "text-yellow-400" },
    { key: "artists", label: "Artistes", icon: Mic, color: "text-purple-400" },
    { key: "viral", label: "Viral", icon: TrendingUp, color: "text-green-400" },
  ];
  

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-600/20 rounded-2xl flex items-center justify-center">
          <Flame size={18} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black">Trending</h1>
          <p className="text-xs text-zinc-500">Mis à jour chaque heure · Score basé sur la vélocité</p>
        </div>
      </div>

      {/* Tabs */}

      <div className="flex gap-1 bg-zinc-900/40 rounded-xl p-1 border border-zinc-800/50">
        {tabs.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === key
                ? "bg-red-600 text-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <Icon size={14} className={color} />
            {label}
          </button>
        ))}
      </div>

      {/* Challenges actifs */}
      {challenges.length > 0 && (
        <div className="space-y-2">
          {challenges.map(ch => (
            <div key={ch._id} className="bg-linear-to-r from-purple-900/30 to-zinc-900/40 border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm">{ch.hashtag}</p>
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">CHALLENGE</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{ch.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-purple-300">{ch.entries} participants</p>
                  <p className="text-[10px] text-zinc-600">
                    {new Date(ch.endsAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                  </p>
                </div>
              </div>
              {ch.prize && <p className="text-[10px] text-yellow-400 mt-2 flex items-center gap-1"><Star size={9}/> Prix : {ch.prize}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Liste classement */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : !chart?.entries?.length ? (
        <div className="text-center py-16 text-zinc-600">
          <Flame size={36} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chart.entries.map((entry, i) => {
            const song     = entry.songId;
            const artist   = entry.artistId;
            const isActive = song && currentSong?._id === String(song._id || song);
            return (
              <div key={i}
                onClick={() => song && (setCurrentSong(song), setIsPlaying(true))}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition ${isActive ? 'bg-red-600/10 border border-red-600/20' : 'bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent'}`}>
                {/* Rang */}
                <div className="w-8 text-right shrink-0">
                  <span className={`font-black text-lg tabular-nums ${rankColor(entry.rank)}`}>{entry.rank}</span>
                </div>
                {/* Image */}
                <div className="relative shrink-0">
                  <img src={song?.image || artist?.image || '/icon-192.png'} className="w-11 h-11 rounded-xl object-cover" alt="" />
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                      <Pause fill="white" size={14} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>
                    {song?.titre || artist?.nom || 'Inconnu'}
                    {entry.isNew && <span className="ml-1.5 text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate uppercase">{song?.artiste || 'Artiste'}</p>
                </div>
                {/* Score + change */}
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <TrendingUp size={9} className="text-green-500" />
                    {Math.round(entry.score).toLocaleString()}
                  </div>
                  {changeIcon(entry.change)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// StoriesBar — Barre de stories (style Instagram)
// ════════════════════════════════════════════
export const StoriesBar = ({ token, isLoggedIn, onArtistClick, onEmpty }) => {
  const [feed, setFeed]         = useState([]);
  const [active, setActive]     = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/stories/feed`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const stories = Array.isArray(d) ? d : [];
        setFeed(stories);
        if (stories.length === 0) onEmpty?.(); // ← ajouter cette ligne
      })
      .catch(() => {});
  }, [token]);

  const openStory  = (entry, idx = 0) => { setActive({ entry, idx }); setProgress(0); };
  const closeStory = () => { clearInterval(timerRef.current); setActive(null); setProgress(0); };

  const nextStory = useCallback(() => {
    if (!active) return;
    const { entry, idx } = active;
    if (idx < entry.stories.length - 1) {
      setActive({ entry, idx: idx + 1 }); setProgress(0);
    } else {
      const ni = feed.findIndex(f => f.artist._id === entry.artist._id) + 1;
      if (ni < feed.length) openStory(feed[ni], 0);
      else closeStory();
    }
  }, [active, feed]);

  const prevStory = useCallback(() => {
    if (!active) return;
    const { entry, idx } = active;
    if (idx > 0) { setActive({ entry, idx: idx - 1 }); setProgress(0); }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const story = active.entry.stories[active.idx];
    const dur   = (story?.duration || 6) * 1000;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { nextStory(); return 0; } return p + (100 / dur) * 100; });
    }, 100);
    if (story?._id)
      fetch(`${API}/stories/${story._id}/view`, {
        method: 'PUT', headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => {});
    return () => clearInterval(timerRef.current);
  }, [active]);

  if (!feed.length) return null;

  // ── Couleurs de fond pour stories texte ────────────────────
  const TEXT_GRADIENTS = [
    'from-purple-700 to-pink-600',
    'from-orange-600 to-yellow-500',
    'from-blue-700 to-cyan-500',
    'from-emerald-700 to-teal-500',
    'from-rose-700 to-orange-500',
    'from-indigo-700 to-violet-600',
  ];
  const getGradient = (id) =>
    TEXT_GRADIENTS[parseInt(id?.slice(-1) || '0', 16) % TEXT_GRADIENTS.length];

  const currentStory = active ? active.entry.stories[active.idx] : null;
  const isTextStory  = (s) => s?.type === 'text' || (!s?.mediaUrl && s?.caption);

  // ── Vignette d'une story (mini aperçu) ────────────────────
  const StoryCard = ({ entry }) => {
    const first       = entry.stories[0];
    const hasUnviewed = entry.stories.some(s => !s.viewed);
    const isText      = isTextStory(first);
    const grad        = getGradient(entry.artist._id);

    return (
      <button
        onClick={() => openStory(entry)}
        className="shrink-0 flex flex-col items-center gap-1.5 group"
      >
        {/* Ring */}
        <div className={`p-[2.5px] rounded-[20px] ${
          hasUnviewed
            ? 'bg-linear-to-tr from-pink-500 via-orange-400 to-yellow-400'
            : 'bg-zinc-700'
        }`}>
          {/* Vignette 80×100 */}
          <div className="w-40 h-50 rounded-[17px] overflow-hidden relative border-2 border-zinc-950 bg-zinc-900">

            {/* Contenu selon le type */}
            {first?.type === 'image' && first?.mediaUrl && (
              <img src={first.mediaUrl} className="w-full h-full object-cover" alt=""/>
            )}
            {(isText || first?.type === 'text') && (
              <div className={`w-full h-full bg-linear-to-br ${grad} flex items-center justify-center p-2`}>
                <p className="text-white font-black text-[10px] text-center leading-tight line-clamp-4">
                  {first?.caption || entry.artist.nom}
                </p>
              </div>
            )}
            {first?.type === 'audio' && (
              <>
                {entry.artist.image
                  ? <img src={entry.artist.image} className="w-full h-full object-cover opacity-55" alt=""/>
                  : <div className={`w-full h-full bg-linear-to-br ${grad}`}/>
                }
                <div className="absolute top-1.5 right-1.5 bg-red-500/90 rounded-md px-1 py-0.5 flex items-center gap-0.5">
                  <Music size={7} className="text-white"/>
                  <span className="text-[7px] text-white font-bold">AUDIO</span>
                </div>
              </>
            )}
            {/* Fallback : avatar artiste */}
            {!first && (
              entry.artist.image
                ? <img src={entry.artist.image} className="w-full h-full object-cover" alt=""/>
                : <div className={`w-full h-full bg-linear-to-br ${grad} flex items-center justify-center`}>
                    <span className="text-white text-2xl font-black">{entry.artist.nom[0]}</span>
                  </div>
            )}

            {/* Overlay play au hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-[17px]">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play size={12} fill="white" className="text-white ml-0.5"/>
              </div>
            </div>

            {/* Mini avatar artiste en bas gauche */}
            <div className="absolute bottom-1.5 left-1.5 w-5.5 h-5.5 rounded-full border-2 border-zinc-950 overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
              {entry.artist.image
                ? <img src={entry.artist.image} className="w-full h-full object-cover" alt=""/>
                : <span className="text-[9px] font-black text-zinc-300">{entry.artist.nom[0]}</span>
              }
            </div>

            {/* Compteur stories */}
            {entry.stories.length > 1 && (
              <div className="absolute top-1.5 right-1.5 bg-black/60 rounded-md px-1 py-0.5">
                <span className="text-[8px] font-bold text-white">{entry.stories.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nom */}
        <p className={`text-[11px] truncate w-20 text-center leading-tight ${
          hasUnviewed ? 'font-bold text-zinc-200' : 'text-zinc-500'
        }`}>
          {entry.artist.nom.split(' ')[0]}
        </p>
      </button>
    );
  };

  return (
    <>
      {/* ── Barre scrollable ── */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none' }}>
        {feed.map(entry => <StoryCard key={entry.artist._id} entry={entry} />)}
      </div>

      {/* ── Visionneuse plein écran ── */}
      {active && currentStory && (
        <div className="fixed inset-0 z-500 bg-black flex items-center justify-center">

          {/* Fond coloré selon type */}
          <div className={`absolute inset-0 ${
            isTextStory(currentStory)
              ? `bg-linear-to-br ${getGradient(active.entry.artist._id)}`
              : 'bg-zinc-950'
          }`}/>

          {/* Image de fond pour story image */}
          {currentStory.type === 'image' && currentStory.mediaUrl && (
            <>
              <img src={currentStory.mediaUrl}
                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl scale-110"
                alt=""/>
              <div className="absolute inset-0 bg-black/40"/>
            </>
          )}

          {/* Conteneur centré style 9:16 sur desktop */}
          <div className="relative w-full h-full max-w-sm mx-auto flex flex-col">

            {/* Barres progression */}
            <div className="flex gap-1 px-4 pt-4 pb-0 z-20 relative">
              {active.entry.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.75 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width: i < active.idx ? '100%' : i === active.idx ? `${progress}%` : '0%',
                      transition: 'none'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header artiste */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-2 z-20 relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shrink-0 bg-zinc-800 flex items-center justify-center">
                {active.entry.artist.image
                  ? <img src={active.entry.artist.image} className="w-full h-full object-cover" alt=""/>
                  : <span className="text-sm font-black text-white">{active.entry.artist.nom[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-white leading-none">{active.entry.artist.nom}</p>
                <p className="text-[11px] text-white/55 mt-0.5">
                  {new Date(currentStory.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={closeStory}
                className="w-9 h-9 rounded-full bg-white/12 flex items-center justify-center text-white hover:bg-white/20 transition shrink-0">
                <X size={17}/>
              </button>
            </div>

            {/* ── Contenu central ── */}
            <div className="flex-1 flex items-center justify-center px-4 relative z-10">

              {/* TEXTE PUR — grand et lisible */}
              {isTextStory(currentStory) && (
                <div className="text-center px-2">
                  <p className="font-black text-white leading-tight"
                    style={{ fontSize: 'clamp(28px, 6vw, 44px)', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
                    {currentStory.caption}
                  </p>
                </div>
              )}

              {/* IMAGE */}
              {currentStory.type === 'image' && currentStory.mediaUrl && (
                <img
                  src={currentStory.mediaUrl}
                  className="max-h-[72vh] w-full object-contain rounded-2xl shadow-2xl"
                  alt=""
                />
              )}

              {/* AUDIO */}
              {currentStory.type === 'audio' && (
                <div className="bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-8 text-center space-y-4 w-full border border-white/10">
                  <div className="w-28 h-28 rounded-2xl mx-auto overflow-hidden bg-zinc-800 border-4 border-red-500/20">
                    {active.entry.artist.image
                      ? <img src={active.entry.artist.image} className="w-full h-full object-cover" alt=""/>
                      : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-zinc-500">
                          {active.entry.artist.nom[0]}
                        </div>
                    }
                  </div>
                  <p className="text-lg font-black text-white">{active.entry.artist.nom}</p>
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <Volume2 size={16}/><span className="text-sm">Extrait audio</span>
                  </div>
                  {currentStory.caption && (
                    <p className="text-sm text-zinc-300 italic">"{currentStory.caption}"</p>
                  )}
                  <audio src={currentStory.mediaUrl} autoPlay className="hidden"/>
                </div>
              )}
            </div>

            {/* Caption sous image/audio */}
            {currentStory.caption && !isTextStory(currentStory) && (
              <div className="px-5 pb-6 z-20 relative">
                <p className="text-[13px] text-white leading-relaxed bg-black/40 backdrop-blur-sm px-4 py-3 rounded-2xl">
                  {currentStory.caption}
                </p>
              </div>
            )}

            {/* Zones tap gauche/droite invisibles */}
            <div className="absolute inset-0 flex z-10 pointer-events-auto" style={{ top: 120 }}>
              <div className="flex-1" onClick={e => { e.stopPropagation(); prevStory(); }}/>
              <div className="flex-1" onClick={e => { e.stopPropagation(); nextStory(); }}/>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ════════════════════════════════════════════
// ListenPartyModal — Écoute collaborative
// Liste des parties, création avec nom + code auto, rejoindre
// ════════════════════════════════════════════
export const ListenPartyModal = ({ token, isLoggedIn, currentSong, setCurrentSong, setIsPlaying, isPlaying, onClose }) => {
  const [mode, setMode]         = useState('menu');  // menu | list | create | join | party
  const [partyName, setPartyName] = useState('');
  const [code, setCode]         = useState('');
  const [party, setParty]       = useState(null);
  const [parties, setParties]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);
  const pollRef = useRef(null);
  const chatEndRef = useRef(null);

  const h = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // Générer un code aléatoire lisible (6 chars alphanum maj)
  const genCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  // Charger la liste des parties publiques actives
  const loadParties = async () => {
    setListLoading(true);
    try {
      const res = await fetch(`${API}/listen-party`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        setParties(Array.isArray(data) ? data : (data.parties || []));
      }
    } catch {}
    setListLoading(false);
  };

  // Scroll chat vers le bas
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Créer une party avec nom + code auto
  const createParty = async () => {
    if (!partyName.trim()) return setError('Entrez un nom pour la party');
    setLoading(true); setError('');
    try {
      const autoCode = genCode();
      const res = await fetch(`${API}/listen-party`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          name: partyName.trim(),
          code: autoCode,
          songId: currentSong?._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setParty(data); setMessages(data.messages || []); setMode('party');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // Rejoindre par code saisi
  const joinByCode = async () => {
    setLoading(true); setError('');
    try {
      const joinRes = await fetch(`${API}/listen-party/${code.toUpperCase()}/join`, { method: 'POST', headers: h });
      if (!joinRes.ok) { const d = await joinRes.json(); throw new Error(d.message); }
      const getRes  = await fetch(`${API}/listen-party/${code.toUpperCase()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data    = await getRes.json();
      setParty(data); setMessages(data.messages || []);
      if (data.songId) { setCurrentSong?.(data.songId); setIsPlaying?.(data.isPlaying ?? true); }
      setMode('party');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // Rejoindre depuis la liste
  const joinFromList = async (p) => {
    setLoading(true); setError('');
    try {
      const joinRes = await fetch(`${API}/listen-party/${p.code}/join`, { method: 'POST', headers: h });
      if (!joinRes.ok) { const d = await joinRes.json(); throw new Error(d.message); }
      setParty(p); setMessages(p.messages || []);
      if (p.songId) { setCurrentSong?.(p.songId); setIsPlaying?.(true); }
      setMode('party');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // Polling toutes les 3s
  useEffect(() => {
    if (mode !== 'party' || !party?.code) return;
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/listen-party/${party.code}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) setMessages(data.messages.slice(-80));
        if (data.participants) setParty(prev => ({ ...prev, participants: data.participants }));
        if (data.songId && setCurrentSong) {
          const incomingId = String(data.songId._id || data.songId);
          if (incomingId !== String(currentSong?._id)) {
            setCurrentSong(data.songId);
            setIsPlaying?.(data.isPlaying ?? true);
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [mode, party?.code, token]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !party?.code) return;
    const nom = localStorage.getItem('moozik_email') || 'Moi';
    const optimistic = { nom, text: newMsg, ts: Date.now() };
    setMessages(prev => [...prev, optimistic]);
    setNewMsg('');
    await fetch(`${API}/listen-party/${party.code}/message`, {
      method: 'POST', headers: h, body: JSON.stringify({ text: optimistic.text })
    }).catch(() => {});
  };

  const copyCode = () => {
    navigator.clipboard.writeText(party.code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const leaveParty = async () => {
    if (party?.code) await fetch(`${API}/listen-party/${party.code}`, { method: 'DELETE', headers: h }).catch(() => {});
    clearInterval(pollRef.current);
    setParty(null); setMode('menu');
  };

  const myUserId = localStorage.getItem('moozik_userId');
  const myEmail = localStorage.getItem('moozik_email');
  const isHost = party && myUserId && (
    String(party.hostId?._id || party.hostId) === String(myUserId)
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-400 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            {mode !== 'menu' && mode !== 'party' && (
              <button onClick={() => { setMode('menu'); setError(''); }}
                className="p-1 text-zinc-500 hover:text-white transition mr-1">
                <ChevronRight size={15} className="rotate-180"/>
              </button>
            )}
            <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
              <Radio size={15} className="text-blue-400"/>
            </div>
            <div>
              <h3 className="font-black text-sm leading-tight">
                {mode === 'menu'   && 'Listen Party'}
                {mode === 'list'   && 'Parties en cours'}
                {mode === 'create' && 'Créer une party'}
                {mode === 'join'   && 'Rejoindre'}
                {mode === 'party'  && (party?.name || 'Party en direct')}
              </h3>
              {mode === 'party' && party && (
                <p className="text-[10px] text-zinc-500 leading-none mt-0.5">
                  {party.participants?.length || 1} auditeur{(party.participants?.length || 1) > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={15}/>
          </button>
        </div>

        {/* ── Contenu ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── MENU PRINCIPAL ── */}
          {mode === 'menu' && (
            <div className="p-5 space-y-3">
              <p className="text-sm text-zinc-400 text-center pb-1">
                Écoutez en synchronisé avec vos amis
              </p>
              {!isLoggedIn && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-xs text-orange-400 text-center">
                  Connectez-vous pour créer ou rejoindre une party
                </div>
              )}
              <button
                onClick={() => { setMode('list'); loadParties(); }}
                className="w-full flex items-center gap-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-200 font-bold py-3.5 px-4 rounded-xl text-sm transition">
                <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Users size={14} className="text-blue-400"/>
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm">Voir les parties en cours</p>
                  <p className="text-[10px] text-zinc-500 font-normal">Rejoindre une session existante</p>
                </div>
                <ChevronRight size={14} className="text-zinc-600"/>
              </button>
              <button
                onClick={() => setMode('create')} disabled={!isLoggedIn}
                className="w-full flex items-center gap-3 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 text-blue-300 font-bold py-3.5 px-4 rounded-xl text-sm transition disabled:opacity-40">
                <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                  <Plus size={14} className="text-blue-400"/>
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm">Créer une party</p>
                  <p className="text-[10px] text-blue-400/70 font-normal">Code généré automatiquement</p>
                </div>
                <ChevronRight size={14} className="text-blue-600/60"/>
              </button>
              <button
                onClick={() => setMode('join')} disabled={!isLoggedIn}
                className="w-full flex items-center gap-3 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 font-bold py-3.5 px-4 rounded-xl text-sm transition disabled:opacity-40">
                <div className="w-7 h-7 bg-zinc-700/50 rounded-lg flex items-center justify-center shrink-0">
                  <MessageCircle size={14} className="text-zinc-400"/>
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm text-zinc-300">Rejoindre par code</p>
                  <p className="text-[10px] text-zinc-600 font-normal">Entrer un code de 6 caractères</p>
                </div>
                <ChevronRight size={14} className="text-zinc-600"/>
              </button>
            </div>
          )}

          {/* ── LISTE DES PARTIES ── */}
          {mode === 'list' && (
            <div className="p-5 space-y-3">
              {listLoading ? (
                <div className="flex items-center justify-center py-10 text-zinc-600">
                  <Loader2 size={20} className="animate-spin mr-2"/> Chargement...
                </div>
              ) : parties.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-zinc-600 gap-2">
                  <Radio size={28} className="opacity-20"/>
                  <p className="text-sm">Aucune party en cours</p>
                  <button onClick={() => setMode('create')} disabled={!isLoggedIn}
                    className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-40">
                    Créer la première party
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1">
                    {parties.length} party{parties.length > 1 ? 's' : ''} active{parties.length > 1 ? 's' : ''}
                  </p>
                  {parties.map(p => {
                    const song = p.songId;
                    return (
                      <div key={p._id || p.code}
                        className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/40 rounded-xl p-3.5 transition group">
                        <div className="flex items-center gap-3">
                          {song?.image ? (
                            <img src={song.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt=""/>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                              <Music size={16} className="text-zinc-500"/>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate text-white">{p.name || `Party #${p.code}`}</p>
                            {song && (
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {song.titre} — {song.artiste}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1 text-[9px] text-zinc-500">
                                <Users size={8}/> {p.participants?.length || 1} auditeur{(p.participants?.length || 1) > 1 ? 's' : ''}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-600">{p.code}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => isLoggedIn ? joinFromList(p) : null}
                            disabled={!isLoggedIn || loading}
                            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-40 flex items-center gap-1">
                            {loading ? <Loader2 size={11} className="animate-spin"/> : <Play size={11} fill="white"/>}
                            Rejoindre
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <button onClick={() => loadParties()}
                className="w-full text-xs text-zinc-500 hover:text-white py-2 flex items-center justify-center gap-1.5 transition">
                <Eye size={11}/> Actualiser
              </button>
            </div>
          )}

          {/* ── CRÉER UNE PARTY ── */}
          {mode === 'create' && (
            <div className="p-5 space-y-4">
              {/* Chanson en cours */}
              {currentSong && (
                <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-600/20 rounded-xl p-3">
                  <img src={currentSong.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt=""/>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 mb-0.5">Musique en cours</p>
                    <p className="text-sm font-bold truncate">{currentSong.titre}</p>
                    <p className="text-[10px] text-zinc-500">{currentSong.artiste}</p>
                  </div>
                </div>
              )}
              {/* Nom de la party */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                  Nom de la party *
                </label>
                <input
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  placeholder="Ex: Soirée entre amis, Stream live..."
                  maxLength={40}
                  className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600"
                />
              </div>
              <div className="bg-zinc-800/40 rounded-xl px-4 py-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500/20 rounded-md flex items-center justify-center shrink-0">
                  <Check size={11} className="text-blue-400"/>
                </div>
                <p className="text-xs text-zinc-400">
                  Le code de 6 caractères sera <span className="text-white font-bold">généré automatiquement</span> et partageable
                </p>
              </div>
              <p className="text-[10px] text-zinc-600 text-center">Expire automatiquement après 4 heures d'inactivité</p>
              {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}
              <button onClick={createParty} disabled={loading || !partyName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Radio size={14}/>}
                Lancer la party
              </button>
            </div>
          )}

          {/* ── REJOINDRE PAR CODE ── */}
          {mode === 'join' && (
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-400 text-center">Entrez le code de 6 caractères partagé par l'hôte</p>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ex: A3F9B2"
                maxLength={6}
                className="w-full bg-zinc-800 rounded-xl px-4 py-4 text-2xl font-mono font-black tracking-[0.4em] outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-700 text-center"
              />
              {error && <p className="text-xs text-red-400 text-center bg-red-500/10 py-2 rounded-xl">{error}</p>}
              <button onClick={joinByCode} disabled={loading || code.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Users size={14}/>}
                Rejoindre
              </button>
              <button onClick={() => { setMode('list'); loadParties(); }}
                className="w-full text-zinc-500 hover:text-zinc-300 text-xs py-2 flex items-center justify-center gap-1.5 transition">
                <Users size={11}/> Voir les parties disponibles
              </button>
            </div>
          )}

          {/* ── PARTY ACTIVE ── */}
          {mode === 'party' && party && (
            <div className="flex flex-col" style={{ minHeight: 400 }}>
              {/* Infos party */}
              <div className="px-4 py-3 bg-zinc-800/40 border-b border-zinc-800/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-blue-400"/>
                  <span className="text-xs text-zinc-400 font-bold">
                    {party.participants?.length || 1} auditeur{(party.participants?.length || 1) > 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={copyCode}
                  className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                  {copied ? <Check size={11} className="text-green-400"/> : <Copy size={11}/>}
                  <span className="font-mono text-blue-300">{party.code}</span>
                  {copied && <span className="text-green-400 text-[9px]">Copié</span>}
                </button>
              </div>

              {/* Musique en cours */}
              {(party.songId || currentSong) && (() => {
                const s = party.songId || currentSong;
                return (
                  <div className="flex items-center gap-3 mx-4 mt-3 bg-blue-600/10 border border-blue-600/20 rounded-xl p-3 shrink-0">
                    {s.image && <img src={s.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt=""/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{s.titre}</p>
                      <p className="text-[10px] text-zinc-500">{s.artiste}</p>
                    </div>
                    <div className="flex gap-0.5 items-end h-4 shrink-0">
                      {isPlaying && [1,2,3].map(i => (
                        <div key={i} className="w-0.5 bg-blue-400 rounded-full animate-bounce"
                          style={{ height: `${(i%3+1)*4}px`, animationDelay: `${i*0.15}s` }}/>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Chat */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: 160, maxHeight: 260 }}>
                {messages.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-6">Soyez le premier à écrire quelque chose...</p>
                ) : messages.map((m, i) => {
                  // changed: detect "me" by userId OR by stored email as fallback
                  const msgUserId = m.userId ? String(m.userId._id || m.userId) : null;
                  const isMe = (msgUserId && myUserId && String(msgUserId) === String(myUserId))
                            || (myEmail && m.nom === myEmail);
                  return (
                    <div key={i} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[9px] font-black shrink-0">
                        {m.nom?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`min-w-0 max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && <span className="text-[9px] font-bold text-zinc-500 mb-0.5 px-1">{m.nom}</span>}
                        <div className={`px-3 py-1.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'}`}>
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef}/>
              </div>

              {/* Input message */}
              <div className="px-4 pb-4 pt-2 border-t border-zinc-800/60 shrink-0">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    placeholder="Message..."
                    disabled={!isLoggedIn}
                    className="flex-1 bg-zinc-800 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600 disabled:opacity-40"
                  />
                  <button type="submit" disabled={!newMsg.trim() || !isLoggedIn}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition disabled:opacity-40 shrink-0">
                    <Send size={14}/>
                  </button>
                </form>
                <button onClick={leaveParty}
                  className="w-full text-[11px] text-red-400/70 hover:text-red-400 py-2 mt-1 transition flex items-center justify-center gap-1">
                  <X size={10}/>
                  {isHost ? 'Fermer et supprimer la party' : 'Quitter la party'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// LoyaltyWidget — Points de fidélité
// ════════════════════════════════════════════
export const LoyaltyWidget = ({ token, isLoggedIn }) => {
  const [data, setData]     = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetch(`${API}/loyalty/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setData(d)).catch(() => {});
    fetch(`${API}/loyalty/leaderboard`)
      .then(r => r.ok ? r.json() : []).then(d => setLeaderboard(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isLoggedIn, token]);

  if (!isLoggedIn || !data) return null;

  const level = data.level || 'bronze';
  const levelColors = { bronze: 'text-amber-600', silver: 'text-zinc-300', gold: 'text-yellow-400', platinum: 'text-cyan-400' };
  const levelEmojis = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  const nextLevel = { bronze: { name: 'silver', min: 100 }, silver: { name: 'gold', min: 500 }, gold: { name: 'platinum', min: 2000 }, platinum: null };
  const next = nextLevel[level];
  const progressPct = next ? Math.min(100, Math.round((data.points / next.min) * 100)) : 100;

  return (
    <div className="space-y-3">
      {/* Badge niveau */}
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{levelEmojis[level]}</span>
            <div>
              <p className={`text-sm font-black uppercase ${levelColors[level]}`}>{level}</p>
              <p className="text-[10px] text-zinc-500">{data.points?.toLocaleString()} points</p>
            </div>
          </div>
          <button onClick={() => setShowBoard(!showBoard)} className="text-xs text-zinc-500 hover:text-white transition">
            Classement
          </button>
        </div>
        {next && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>{data.points} pts</span>
              <span>{next.min} pts pour {levelEmojis[nextLevel[level].name]} {next.name}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${levelColors[level].replace('text-','bg-')}`} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
        {/* Comment gagner des points */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['🎵','Écouter','+1'],['💬','Commenter','+5'],['↗️','Partager','+3']].map(([e,l,p]) => (
            <div key={l} className="bg-zinc-800/40 rounded-xl p-2">
              <p className="text-base">{e}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">{l}</p>
              <p className="text-[9px] text-green-400 font-bold">{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {showBoard && leaderboard.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Top fans</p>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry._id} className="flex items-center gap-2.5">
                <span className={`text-sm font-black w-5 text-center ${i===0?'text-yellow-400':i===1?'text-zinc-300':i===2?'text-amber-600':'text-zinc-600'}`}>{i+1}</span>
                <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                  {entry.userId?.avatar ? <img src={entry.userId.avatar} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-xs font-black text-zinc-500">{(entry.userId?.nom||'?')[0]}</div>}
                </div>
                <p className="flex-1 text-xs font-bold truncate">{entry.userId?.nom || 'Anonyme'}</p>
                <p className="text-xs font-black text-zinc-400">{entry.points?.toLocaleString()} pts</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};