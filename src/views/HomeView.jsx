import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Flame, Sparkles, Heart, Compass, TrendingUp, X,
  Play, Pause, Disc3, ChevronRight, Check,
  Users, AlertTriangle, Share2, Clock, WifiOff,
  Star, Radio, Gem, Trophy, Zap, Sun, Bell, Ticket, Calendar, MapPin, ChevronLeft,
  ChevronDown, ChevronUp,
  Plus, ListMusic,
  Wand2, // ← MODIF : icône "Pour vous"
} from 'lucide-react';
import SongRow from '../components/music/SongRow';
import GlobalSearchView from './GlobalSearchView';
import { API } from '../config/api';
import { usePushNotifications } from '../hooks/usePushNotifications';
import useSubscription from '../hooks/useSubscription';
import { StoriesBar } from '../components/SocialComponents';
import { AudioAdPlayer } from '../components/MonetisationComponents';

// ← MODIF : import du moteur de recommandations
import useSmartRecommendations, { recordListenHistory } from '../hooks/useSmartRecommendations';

// ════════════════════════════════════════════
// HOOK UTILITAIRE : "Voir plus"
// ════════════════════════════════════════════
const useShowMore = (initialLimit = 5) => {
  const [expanded, setExpanded] = useState(false);
  return {
    expanded,
    limit: expanded ? Infinity : initialLimit,
    toggle: () => setExpanded(v => !v),
  };
};

// ════════════════════════════════════════════
// BOUTON "VOIR PLUS / VOIR MOINS" (vertical)
// ════════════════════════════════════════════
const ShowMoreButton = ({ expanded, onToggle, total, shown, className = '' }) => {
  const remaining = total - shown;
  return (
    <button
      onClick={onToggle}
      className={`
        mt-3 w-full flex items-center justify-center gap-1.5
        py-2.5 rounded-xl
        text-xs font-bold tracking-wide uppercase
        border border-zinc-800 bg-zinc-900/60
        text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/60
        transition-all duration-200 active:scale-[0.98]
        ${className}
      `}
    >
      {expanded ? (
        <><ChevronUp size={13} />Voir moins</>
      ) : (
        <><ChevronDown size={13} />Voir {remaining > 0 ? `${remaining} de plus` : 'plus'}</>
      )}
    </button>
  );
};

// ════════════════════════════════════════════
// SCROLL HORIZONTAL AVEC BOUTONS DESKTOP
// ════════════════════════════════════════════
const HorizontalScrollContainer = ({
  children,
  showMoreProps,
  className = '',
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className={`relative group/hscroll ${className}`}>
      <button
        onClick={() => scroll(-1)}
        aria-label="Défiler à gauche"
        className={`
          hidden md:flex
          absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
          w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl
          items-center justify-center text-white
          transition-all duration-200
          hover:bg-zinc-800 hover:border-zinc-500 active:scale-95
          ${canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={() => scroll(1)}
        aria-label="Défiler à droite"
        className={`
          hidden md:flex
          absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
          w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl
          items-center justify-center text-white
          transition-all duration-200
          hover:bg-zinc-800 hover:border-zinc-500 active:scale-95
          ${canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <ChevronRight size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}

        {showMoreProps && showMoreProps.total > showMoreProps.shown && (
          <button
            onClick={showMoreProps.onToggle}
            className="
              shrink-0 w-28 md:w-32 flex flex-col items-center justify-center gap-2
              rounded-2xl border border-dashed border-zinc-700
              bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-500
              text-zinc-500 hover:text-white
              transition-all duration-200 active:scale-95
              aspect-square
            "
          >
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <ChevronRight size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-center px-2 leading-tight">
              +{showMoreProps.total - showMoreProps.shown} de plus
            </span>
          </button>
        )}

        {showMoreProps && showMoreProps.expanded && showMoreProps.total <= showMoreProps.shown && (
          <button
            onClick={showMoreProps.onToggle}
            className="
              shrink-0 w-28 md:w-32 flex flex-col items-center justify-center gap-2
              rounded-2xl border border-dashed border-zinc-700
              bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-500
              text-zinc-500 hover:text-white
              transition-all duration-200 active:scale-95
              aspect-square
            "
          >
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <ChevronLeft size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-center px-2 leading-tight">
              Voir moins
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// SOUS-COMPOSANTS UTILITAIRES
// ════════════════════════════════════════════

const SectionHeader = ({ icon, title, subtitle, noMargin }) => (
  <div className={`flex items-center gap-2.5 ${noMargin ? '' : 'mb-4'}`}>
    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 shrink-0">{icon}</div>
    <div>
      <h2 className="text-base font-black uppercase tracking-wide leading-tight">{title}</h2>
      {subtitle && <p className="text-[10px] text-zinc-600 leading-none mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const TopTrack = ({ song, rank, isActive, isPlaying, onPlay }) => {
  const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-amber-600', 'text-zinc-600', 'text-zinc-700'];
  return (
    <div
      onClick={onPlay}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition-all duration-200 ${isActive ? 'bg-white/8 ring-1 ring-white/10' : 'hover:bg-white/5'}`}
    >
      <span className={`font-black text-lg w-6 text-right shrink-0 tabular-nums ${rankColors[rank] || 'text-zinc-700'}`}>{rank + 1}</span>
      <div className="relative shrink-0">
        <img src={song.image} className="w-11 h-11 rounded-xl object-cover" alt="" />
        {isActive && isPlaying && (
          <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-3">
              {[1, 2, 3].map(i => <div key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${(i % 3 + 1) * 4}px`, animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-200'}`}>{song.titre}</p>
        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{song.artiste}</p>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <TrendingUp size={10} className="text-green-500" /> {song.plays || 0}
      </div>
    </div>
  );
};

const HorizontalCard = ({ song, isActive, isPlaying, onClick, badge, badgeColor }) => (
  <div onClick={onClick} className="shrink-0 w-28 md:w-32 group cursor-pointer">
    <div className="relative mb-2 aspect-square">
      <img src={song.image} className={`w-full h-full rounded-2xl object-cover shadow-lg transition-all duration-300 ${isActive ? 'ring-2 ring-white/30 scale-[0.98]' : ''}`} alt="" />
      <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 transition ${isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          {isActive && isPlaying ? <Pause fill="white" size={15} /> : <Play fill="white" size={15} className="ml-0.5" />}
        </div>
      </div>
      {badge && <span className={`absolute top-2 left-2 ${badgeColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide`}>{badge}</span>}
    </div>
    <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
    <p className="text-[10px] text-zinc-600 truncate mt-0.5 uppercase tracking-wide">{song.artiste}</p>
  </div>
);

const DiscoveryCard = ({ song, isActive, isPlaying, onClick }) => (
  <div onClick={onClick} className={`relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-200 aspect-square ${isActive ? 'ring-2 ring-white/25' : ''}`}>
    <img src={song.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
    {isActive && isPlaying ? (
      <div className="absolute top-3 right-3 flex gap-0.5 items-end h-4">
        {[1, 2, 3].map(i => <div key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${(i % 3 + 1) * 4}px`, animationDelay: `${i * 0.15}s` }} />)}
      </div>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Play fill="white" size={18} className="ml-0.5" />
        </div>
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-xs font-bold text-white truncate leading-tight">{song.titre}</p>
      <p className="text-[10px] text-white/55 truncate mt-0.5">{song.artiste}</p>
    </div>
  </div>
);

// ── Bannière alertes admin ──────────────────
const AdminAlertBanner = ({ token, isAdmin }) => {
  const [unassigned, setUnassigned] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isAdmin || !token) return;
    fetch(`${API}/admin/unassigned-songs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setUnassigned(d.count || 0)).catch(() => { });
    fetch(`${API}/admin/active-users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setActiveUsers(d.count || 0)).catch(() => { });
  }, [isAdmin, token]);

  if (!isAdmin || dismissed || (unassigned === 0 && activeUsers === 0)) return null;

  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-orange-300">Alertes administration</p>
        <div className="flex flex-wrap gap-3 mt-1.5">
          {unassigned > 0 && <a href="/admin-library" className="text-[11px] text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full hover:bg-orange-500/20 transition cursor-pointer">{unassigned} musique{unassigned > 1 ? 's' : ''} sans artiste — Cliquer pour corriger</a>}
          {activeUsers > 0 && <span className="text-[11px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />{activeUsers} actif{activeUsers > 1 ? 's' : ''}</span>}
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="text-zinc-500 hover:text-white shrink-0 p-1">×</button>
    </div>
  );
};


// ── Section partages récents ─────────────────
const RecentSharesSection = ({ token, setCurrentSong, setIsPlaying, currentSong, musiques, playSong }) => {
  const [shares, setShares] = useState([]);
  const { expanded, limit, toggle } = useShowMore(8);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/my-shares`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => setShares(Array.isArray(d) ? d : [])).catch(() => { });
  }, [token]);

  const validShares = shares.filter(s => s.songId);
  if (!validShares.length) return null;

  const cappedShares  = validShares.slice(0, 20);
  const visibleShares = expanded ? cappedShares : cappedShares.slice(0, limit);

  const resolveAndPlay = (songId) => {
    const fullSong = musiques?.find(m => m._id === (songId?._id || songId));
    if (fullSong) { if (playSong) playSong(fullSong); else { setCurrentSong(fullSong); setIsPlaying(true); } }
  };

  return (
    <section>
      <SectionHeader
        icon={<Share2 size={18} className="text-blue-400" />}
        title="Mes partages récents"
        subtitle={`${cappedShares.length} lien${cappedShares.length > 1 ? 's' : ''} actif${cappedShares.length > 1 ? 's' : ''}`}
      />
      <HorizontalScrollContainer
        showMoreProps={
          cappedShares.length > 8
            ? { total: cappedShares.length, shown: visibleShares.length, expanded, onToggle: toggle }
            : undefined
        }
      >
        {visibleShares.map(share => {
          const song    = share.songId;
          const expired = new Date(share.expiresAt) < new Date();
          return (
            <div
              key={share._id}
              onClick={() => { if (!expired) resolveAndPlay(song._id); }}
              className={`shrink-0 w-28 md:w-32 group cursor-pointer ${expired ? 'opacity-40' : ''}`}
            >
              <div className="relative aspect-square mb-2">
                <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
                {expired && (
                  <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                    <span className="text-[9px] text-red-400 font-bold">Expiré</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
              <p className="text-[10px] text-zinc-600">{share.playCount || 0} écoute{share.playCount !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </HorizontalScrollContainer>
    </section>
  );
};

// ── Événements bannière ─────────────────────
const EventsBannerSlider = ({ setCurrentSong, setIsPlaying }) => {
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/events?limit=5`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEvents(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (events.length < 2) return;
    intervalRef.current = setInterval(() => setCurrent(c => (c + 1) % events.length), 4000);
    return () => clearInterval(intervalRef.current);
  }, [events.length]);

  if (!events.length) return null;

  const ev     = events[current];
  const isPast = new Date(ev.date) < new Date();

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Ticket size={18} className="text-purple-400" />}
        title="Événements" subtitle="Concerts et shows à venir"
      />
      <div className="group relative w-full mx-auto rounded-2xl overflow-hidden bg-[#1a0a2e] border border-purple-500/30 shadow-2xl shadow-purple-900/20">
        {ev.image
          ? <img src={ev.image} alt={ev.title}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
          : <div className="absolute inset-0 bg-linear-to-br from-purple-900/60 to-zinc-950" />
        }
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950/95 via-zinc-950/70 to-zinc-950/15" />
        <div className="absolute inset-0 bg-purple-900/10" />
        <div className="pb-[46%] md:pb-[40%]" />
        <div className="absolute top-3 right-3 w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-700/85 border-2 border-purple-400/60 flex flex-col items-center justify-center text-center gap-0.5 z-10">
          <Ticket size={14} className="text-white/90" />
          <span className="text-white font-black leading-tight" style={{ fontSize: 'clamp(7px,1.4vw,9px)', letterSpacing: '0.02em' }}>
            BILLETS<br />DISPO
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col justify-between z-10">
          <div className="flex items-center gap-2 px-4 pt-3 flex-wrap">
            <span className="bg-purple-700/80 border border-purple-400/50 text-white font-black px-2.5 py-1 rounded-md"
              style={{ fontSize: 'clamp(8px,1.5vw,10px)', letterSpacing: '0.06em' }}>
              ÉVÉNEMENT LIVE
            </span>
            {ev.artistId?.certified && (
              <span className="bg-blue-600/70 text-white font-bold px-2.5 py-1 rounded-full"
                style={{ fontSize: 'clamp(7px,1.4vw,9px)' }}>✓ Officiel</span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center px-4">
            <h3 className="font-black text-white leading-none tracking-tighter drop-shadow-2xl"
              style={{ fontSize: 'clamp(24px,5.5vw,50px)' }}>
              {ev.title.toUpperCase()}
            </h3>
            <p className="text-zinc-300 mt-2" style={{ fontSize: 'clamp(9px,1.6vw,12px)' }}>
              Des artistes. Une ambiance.{' '}
              <span className="text-purple-400 font-bold">Un moment inoubliable.</span>
            </p>
            {ev.lineup?.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="bg-purple-700/60 border border-purple-400/40 text-purple-200 font-bold px-2 py-0.5 rounded-full"
                  style={{ fontSize: 9 }}>AVEC</span>
                <span className="text-white font-black tracking-wide"
                  style={{ fontSize: 'clamp(10px,2vw,14px)' }}>
                  {ev.lineup.join(' · ')}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0 flex-wrap bg-zinc-950/80 backdrop-blur-sm border-t border-purple-500/20 px-4 py-2.5">
            <div className="flex items-center gap-2 pr-3 mr-3 border-r border-white/10">
              <Calendar size={13} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-white font-black leading-none" style={{ fontSize: 'clamp(10px,2vw,13px)' }}>
                  {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
                <p className="text-zinc-500 uppercase tracking-wide" style={{ fontSize: 9 }}>À PARTIR DE 18H00</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-3 mr-3 border-r border-white/10">
              <MapPin size={13} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-white font-black leading-none" style={{ fontSize: 'clamp(10px,2vw,13px)' }}>
                  {ev.venue?.toUpperCase()}
                </p>
                <p className="text-zinc-500 uppercase tracking-wide" style={{ fontSize: 9 }}>{ev.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Ticket size={13} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-white font-black leading-none" style={{ fontSize: 'clamp(10px,2vw,13px)' }}>
                  {(ev.ticketPrice / 100).toLocaleString()} AR
                </p>
                <p className="text-zinc-500 uppercase tracking-wide" style={{ fontSize: 9 }}>PAR PERSONNE</p>
              </div>
            </div>
            {!isPast && (
              <div className="flex-1 flex justify-end">
                <a href="/events/"
                  className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white font-black rounded-xl transition-all active:scale-95"
                  style={{ fontSize: 'clamp(9px,1.8vw,11px)', padding: '7px 14px', letterSpacing: '0.04em' }}>
                  RÉSERVER
                  <ChevronRight size={13} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════
// SECTION HORS-LIGNE
// ════════════════════════════════════════════
const OfflineSection = ({ musiques, setCurrentSong, setIsPlaying, currentSong, isPlaying, isAudioCached, playSong }) => {
  const cached = useMemo(() => musiques.filter(s => isAudioCached && isAudioCached(s._id)), [musiques, isAudioCached]);

  const COLS = 2;
  const ROWS = 3;
  const PAGE = COLS * ROWS;
  const { expanded, limit, toggle } = useShowMore(PAGE);

  if (!cached.length) return null;

  const visible = expanded ? cached : cached.slice(0, limit);

  return (
    <section>
      <SectionHeader
        icon={<WifiOff size={18} className="text-green-400" />}
        title="Disponible hors-ligne"
        subtitle={`${cached.length} titre${cached.length > 1 ? 's' : ''} téléchargé${cached.length > 1 ? 's' : ''}`}
      />
      <div className="block md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {Array.from({ length: Math.ceil(visible.length / ROWS) }, (_, colIdx) => {
            const colItems = visible.slice(colIdx * ROWS, (colIdx + 1) * ROWS);
            return (
              <div key={colIdx} className="flex flex-col gap-3 shrink-0" style={{ width: 'calc(50vw - 20px)', maxWidth: 160 }}>
                {colItems.map(song => (
                  <OfflineSongCard
                    key={song._id}
                    song={song}
                    isActive={currentSong?._id === song._id}
                    isPlaying={isPlaying}
                    onClick={() => { if (playSong) playSong(song); else { setCurrentSong(song); setIsPlaying(true); } }}
                  />
                ))}
              </div>
            );
          })}
        </div>
        {cached.length > PAGE && (
          <ShowMoreButton expanded={expanded} onToggle={toggle} total={cached.length} shown={visible.length} />
        )}
      </div>
      <div className="hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map(song => (
            <OfflineSongCard
              key={song._id}
              song={song}
              isActive={currentSong?._id === song._id}
              isPlaying={isPlaying}
              onClick={() => { if (playSong) playSong(song); else { setCurrentSong(song); setIsPlaying(true); } }}
            />
          ))}
        </div>
        {cached.length > PAGE && (
          <ShowMoreButton expanded={expanded} onToggle={toggle} total={cached.length} shown={visible.length} />
        )}
      </div>
    </section>
  );
};

const OfflineSongCard = ({ song, isActive, isPlaying, onClick }) => (
  <div
    onClick={onClick}
    className={`
      flex items-center gap-2.5 p-2 rounded-xl cursor-pointer group transition-all duration-200
      ${isActive ? 'bg-white/8 ring-1 ring-white/10' : 'hover:bg-white/5'}
    `}
  >
    <div className="relative shrink-0 w-11 h-11">
      <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow">
        <Check size={8} className="text-white" />
      </div>
      {isActive && isPlaying && (
        <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
          <Pause fill="white" size={10} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold truncate text-zinc-200 leading-tight">{song.titre}</p>
      <p className="text-[10px] text-zinc-600 truncate mt-0.5">{song.artiste}</p>
    </div>
  </div>
);

// ════════════════════════════════════════════
// SECTION PLAYLISTS PUBLIQUES
// ════════════════════════════════════════════
const PublicPlaylistsSection = ({ token, setCurrentSong, setIsPlaying, currentSong, isPlaying, musiques, playSong }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { expanded, limit, toggle } = useShowMore(8);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/user-playlists/public?limit=20`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setPlaylists(Array.isArray(d) ? d.slice(0, 20) : []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || !playlists.length) return null;

  const visiblePlaylists = expanded ? playlists : playlists.slice(0, limit);

  const playPlaylist = (playlist) => {
    const firstSongId = playlist.musiques?.[0]?._id || playlist.musiques?.[0];
    if (!firstSongId) return;
    const full = musiques?.find(m => m._id === firstSongId);
    if (full) { if (playSong) playSong(full); else { setCurrentSong(full); setIsPlaying(true); } }
  };

  return (
    <section>
      <SectionHeader
        icon={<ListMusic size={18} className="text-teal-400" />}
        title="Playlists publiques"
        subtitle={`${playlists.length} playlist${playlists.length > 1 ? 's' : ''} disponible${playlists.length > 1 ? 's' : ''}`}
      />
      <HorizontalScrollContainer
        showMoreProps={
          playlists.length > 8
            ? { total: playlists.length, shown: visiblePlaylists.length, expanded, onToggle: toggle }
            : undefined
        }
      >
        {visiblePlaylists.map(playlist => {
          const coverImage = playlist.image || playlist.musiques?.[0]?.image || '/icon-192.png';
          const songCount  = playlist.musiques?.length || 0;
          const isActive   = playlist.musiques?.some(s => (s._id || s) === currentSong?._id);
          return (
            <div
              key={playlist._id}
              onClick={() => playPlaylist(playlist)}
              className="shrink-0 w-28 md:w-32 group cursor-pointer"
            >
              <div className="relative mb-2 aspect-square">
                {playlist.songs?.filter(s => s.image).length >= 4 ? (
                  <div className="w-full h-full rounded-2xl overflow-hidden grid grid-cols-2 gap-0.5 bg-zinc-800 shadow-lg">
                    {playlist.songs.filter(s => s.image).slice(0, 4).map((s, i) => (
                      <img key={i} src={s.image} className="w-full h-full object-cover" alt="" />
                    ))}
                  </div>
                ) : (
                  <img
                    src={coverImage}
                    className={`w-full h-full rounded-2xl object-cover shadow-lg transition-all duration-300 ${isActive ? 'ring-2 ring-teal-400/40 scale-[0.98]' : ''}`}
                    alt=""
                  />
                )}
                <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 transition ${isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    {isActive && isPlaying ? <Pause fill="white" size={15} /> : <Play fill="white" size={15} className="ml-0.5" />}
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                  {songCount} titre{songCount !== 1 ? 's' : ''}
                </span>
                {playlist.isOfficial && (
                  <span className="absolute top-2 left-2 bg-teal-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Officielle
                  </span>
                )}
              </div>
              <p className="text-xs font-bold truncate text-zinc-200">{playlist.nom || playlist.title || 'Playlist'}</p>
              <p className="text-[10px] text-zinc-600 truncate mt-0.5 uppercase tracking-wide">
                {playlist.createdBy?.nom || playlist.userId?.nom || 'Anonyme'}
              </p>
            </div>
          );
        })}
      </HorizontalScrollContainer>
    </section>
  );
};

// ════════════════════════════════════════════
// HOME VIEW
// ════════════════════════════════════════════
const HomeView = ({
  musiques, currentSong, setCurrentSong, setIsPlaying, isPlaying, playSong,
  toggleLike, addToQueue, isAdmin, isArtist, isUser,
  userArtistId, playlists, userPlaylists, token, activeMenu,
  setActiveMenu, ajouterAPlaylist, dragOverId, dragSongId,
  handleDragStart, handleDragOver, handleDrop,
  setShowEQ, initAudioEngine, searchTerm, setShowUpload,
  onAddToUserPlaylist, isLoggedIn, userNom, userId,
  onDeleted, onRefresh, onTogglePlaylistVisibility,
  isAudioCached, cachedIds,cacheAudio, removeCached,
  onInfiniteRadio,
}) => {
  const songs = Array.isArray(musiques) ? musiques : [];

  const { isPremium }                                          = useSubscription(token);
  const { subscribed, subscribe, unsubscribe, loading: pushLoading } = usePushNotifications(token);

  // ── "Voir plus" hooks ──────────────────────────────────────────────────────
  const top24hShowMore     = useShowMore(5);
  const nouveautesShowMore = useShowMore(8);
  const artistesShowMore   = useShowMore(8);
  const albumsShowMore     = useShowMore(8);
  const gemsShowMore       = useShowMore(4);
  const rankingShowMore    = useShowMore(5);
  const favorisShowMore    = useShowMore(5);
  const moodShowMore       = useShowMore(5);
  // ← MODIF : "voir plus" pour la section "Pour vous"
  const pourVousShowMore   = useShowMore(8);
  // ← MODIF : "voir plus" pour l'ambiance contextuelle
  const ambianceShowMore   = useShowMore(8);
  const [hasStories, setHasStories] = useState(true);


  const [showAd, setShowAd]             = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [lastPlayed, setLastPlayed]     = useState(null);
  const [heroSong, setHeroSong]         = useState(null);
  const [top24h, setTop24h]             = useState([]);
  const [recentAlbums, setRecentAlbums] = useState([]);
  const [friendRanking, setFriendRanking] = useState([]);

  // ← MODIF : moteur de recommandations intelligent
  const {
    pourVous,
    trendingHybrid,
    nouveautes,
    decouverteduJour,
    ambianceContextuelle,
    gems,
    artistesTendance,
    isPersonalized,
  } = useSmartRecommendations({ songs, selectedMood, limit: 20 });

  // ← MODIF : enregistrement automatique des écoutes dans l'historique local
  const prevSongIdRef    = useRef(null);
  const sessionStartRef  = useRef(null);

  useEffect(() => {
    if (!currentSong) return;
    if (prevSongIdRef.current && prevSongIdRef.current !== currentSong._id) {
      // La chanson vient de changer → enregistrer la durée écoutée
      const duration = sessionStartRef.current
        ? Math.round((Date.now() - sessionStartRef.current) / 1000)
        : 0;
      recordListenHistory(prevSongIdRef.current, duration);
    }
    prevSongIdRef.current   = currentSong._id;
    sessionStartRef.current = isPlaying ? Date.now() : null;
  }, [currentSong?._id]);

  useEffect(() => {
    if (!currentSong) return;
    if (isPlaying) {
      sessionStartRef.current = sessionStartRef.current || Date.now();
    } else if (sessionStartRef.current) {
      // Pause → enregistrer la durée partielle
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      if (duration > 5) recordListenHistory(currentSong._id, duration);
      sessionStartRef.current = null;
    }
  }, [isPlaying]);

  // ── Données asynchrones (inchangées) ──────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const raw = localStorage.getItem('moozik_last_played');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.song?._id) setLastPlayed(parsed);
      }
    } catch { }
  }, [isLoggedIn]);

  useEffect(() => {
    // ← MODIF : hero song = découverte personnalisée ou fallback API
    fetch(`${API}/songs/meta`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.heroSong) { setHeroSong(d.heroSong); return; }
      if (decouverteduJour) { setHeroSong(decouverteduJour); return; }
      if (songs.length) {
        const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
        const top  = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
        setHeroSong(top[seed % top.length]);
      }
    }).catch(() => {
      if (decouverteduJour) { setHeroSong(decouverteduJour); return; }
      if (songs.length) {
        const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
        const top  = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
        setHeroSong(top[seed % top.length]);
      }
    });
  }, [songs.length, decouverteduJour]);

  useEffect(() => {
    // ← MODIF : si l'API ne répond pas, on utilise le trending hybride local
    fetch(`${API}/trending?limit=20`)
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const list = Array.isArray(d) ? d.filter(s => s.songId).map(s => s.songId) : [];
        if (list.length) {
          setTop24h(list.map(t => songs.find(s => s._id === (t._id || t)) || t));
        } else {
          setTop24h(trendingHybrid);
        }
      })
      .catch(() => setTop24h(trendingHybrid));
  }, [songs.length, trendingHybrid]);

  useEffect(() => {
    fetch(`${API}/albums?limit=20`).then(r => r.ok ? r.json() : []).then(d => setRecentAlbums(Array.isArray(d) ? d : [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/loyalty/leaderboard`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setFriendRanking(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, [token]);

  useEffect(() => {
    if (!currentSong || !isLoggedIn) return;
    const save = () => {
      const audio = document.querySelector('audio');
      const ts    = audio?.currentTime || 0;
      localStorage.setItem('moozik_last_played', JSON.stringify({ song: currentSong, timestamp: ts, savedAt: new Date().toISOString() }));
    };
    const t = setInterval(save, 5000);
    return () => clearInterval(t);
  }, [currentSong, isLoggedIn]);

  // ── isNewSong (inchangé) ──────────────────────────────────────────────────
  const isNewSong = (song) => {
    const currentYear  = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (song.annee) {
      const songYear  = parseInt(song.annee) || 0;
      const songMonth = parseInt(song.mois)  || 0;
      if (songYear === currentYear && (!songMonth || songMonth >= currentMonth - 1)) return true;
    }
    return Date.now() - new Date(song.createdAt).getTime() < 7 * 86400000;
  };

  // ── Mood filtré — maintenant via ambianceContextuelle ──────────────────────
  const moodFiltered = useMemo(() => {
    if (!selectedMood) return [];
    return ambianceContextuelle.songs; // ← MODIF : résultat du hook intelligent
  }, [selectedMood, ambianceContextuelle]);

  const favorites = useMemo(() => songs.filter(s => s.liked), [songs]);

  const songRowProps = {
    currentSong, setCurrentSong, setIsPlaying, isPlaying,
    toggleLike, addToQueue, token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId, userId,
    playlists, userPlaylists, onAddToUserPlaylist, ajouterAPlaylist,
    onDeleted, onRefresh, onTogglePlaylistVisibility,
    onInfiniteRadio,
  };

  const MOODS = [
    { label: 'Chill',     color: 'bg-sky-500/20 border-sky-500/30 text-sky-300',            activeColor: 'bg-sky-500/30 border-sky-400 text-sky-200'         },
    { label: 'Énergie',   color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',   activeColor: 'bg-yellow-500/30 border-yellow-400 text-yellow-200' },
    { label: 'Focus',     color: 'bg-violet-500/20 border-violet-500/30 text-violet-300',   activeColor: 'bg-violet-500/30 border-violet-400 text-violet-200' },
    { label: 'Fête',      color: 'bg-pink-500/20 border-pink-500/30 text-pink-300',         activeColor: 'bg-pink-500/30 border-pink-400 text-pink-200'       },
    { label: 'Nostalgie', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300',      activeColor: 'bg-amber-500/30 border-amber-400 text-amber-200'   },
    { label: 'Romance',   color: 'bg-rose-500/20 border-rose-500/30 text-rose-300',         activeColor: 'bg-rose-500/30 border-rose-400 text-rose-200'       },
    { label: 'Motivant',  color: 'bg-orange-500/20 border-orange-500/30 text-orange-300',   activeColor: 'bg-orange-500/30 border-orange-400 text-orange-200' },
    { label: 'Gospel',    color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', activeColor: 'bg-emerald-500/30 border-emerald-400 text-emerald-200' },
  ];

  const playFullSong = useCallback((songOrId) => {
    const id   = songOrId?._id || songOrId;
    const full = songs.find(s => s._id === id);
    if (full) { if (playSong) playSong(full); else { setCurrentSong(full); setIsPlaying(true); } }
  }, [songs, setCurrentSong, setIsPlaying, playSong]);



  // ── Caps & tranches visibles ───────────────────────────────────────────────
  const MAX = 20;



  const top24hCapped    = top24h.slice(0, MAX);
  const albumsCapped    = recentAlbums.slice(0, MAX);
  const rankingCapped   = friendRanking.slice(0, MAX);
  const favorisCapped   = favorites.slice(0, MAX);
  const moodCapped      = moodFiltered.slice(0, MAX);
  // ← MODIF : sections issues du hook (déjà cappées à limit=20)
  const pourVousCapped  = pourVous.slice(0, MAX);
  const gemsCapped      = gems.slice(0, MAX);

  const visibleTop24h    = top24hShowMore.expanded   ? top24hCapped   : top24hCapped.slice(0, top24hShowMore.limit);
  const visibleNouveautes = nouveautesShowMore.expanded ? nouveautes   : nouveautes.slice(0, nouveautesShowMore.limit);
  const visibleArtistes  = artistesShowMore.expanded  ? artistesTendance : artistesTendance.slice(0, artistesShowMore.limit);
  const visibleAlbums    = albumsShowMore.expanded    ? albumsCapped   : albumsCapped.slice(0, albumsShowMore.limit);
  const visibleGems      = gemsShowMore.expanded      ? gemsCapped     : gemsCapped.slice(0, gemsShowMore.limit);
  const visibleRanking   = rankingShowMore.expanded   ? rankingCapped  : rankingCapped.slice(0, rankingShowMore.limit);
  const visibleFavoris   = favorisShowMore.expanded   ? favorisCapped  : favorisCapped.slice(0, favorisShowMore.limit);
  const visibleMood      = moodShowMore.expanded      ? moodCapped     : moodCapped.slice(0, moodShowMore.limit);
  // ← MODIF
  const visiblePourVous  = pourVousShowMore.expanded  ? pourVousCapped : pourVousCapped.slice(0, pourVousShowMore.limit);
  const visibleAmbiance  = ambianceShowMore.expanded  ? ambianceContextuelle.songs : ambianceContextuelle.songs.slice(0, ambianceShowMore.limit);

  // ── Icônes ambiance ────────────────────────────────────────────────────────
  const MOOD_ICONS = {
    'Énergie': '⚡', 'Focus': '🎯', 'Chill': '🌊',
    'Fête': '🎉', 'Romance': '🌙', 'Motivant': '🔥', 'Gospel': '✨', 'Nostalgie': '🎵',
  };

    if (searchTerm) return (
      <GlobalSearchView
        searchTerm={searchTerm}
        currentSong={currentSong}
        setCurrentSong={setCurrentSong}
        setIsPlaying={setIsPlaying}
        isPlaying={isPlaying}
        playSong={playSong}
        toggleLike={toggleLike}
        addToQueue={addToQueue}             
        token={token}                          
        isLoggedIn={isLoggedIn}              
        userPlaylists={userPlaylists}          
        onAddToUserPlaylist={onAddToUserPlaylist} 
        isAudioCached={isAudioCached}         
        cacheAudio={cacheAudio}              
        removeCached={removeCached}           
      />
    );

  return (
    <div className="flex flex-col gap-10 md:gap-14">

      {isAdmin && <AdminAlertBanner token={token} isAdmin={isAdmin} />}

      {/* ══ SALUTATION ══ */}
      
      {isLoggedIn && !subscribed && (
        <button onClick={subscribe} disabled={pushLoading}
          className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition disabled:opacity-50">
          <Bell size={14} />
          Activer les notifications
        </button>
      )}

      <EventsBannerSlider setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} />

      {/* ══ 1. HERO "TITRE DU JOUR" ══ */}
      {heroSong && (
        <section>
          {/* ← MODIF : badge adapté selon personnalisation */}
          <SectionHeader
            icon={<Sun size={18} className="text-yellow-400" />}
            title="Titre du jour"
            subtitle={isPersonalized ? 'Sélectionné selon vos goûts' : 'Sélectionné pour vous aujourd\'hui'}
          />
          <div onClick={() => playFullSong(heroSong._id)} className="relative overflow-hidden rounded-3xl cursor-pointer group">
            <div className="absolute inset-0">
              <img src={heroSong.image} className="w-full h-full object-cover scale-110 blur-xl opacity-40" alt="" />
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
            <div className="relative flex items-center gap-5 p-6 md:p-8">
              <div className="relative shrink-0">
                <img src={heroSong.image} className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-2xl border border-white/10 transition-transform group-hover:scale-105 ${currentSong?._id === heroSong._id && isPlaying ? 'ring-2 ring-white/30' : ''}`} alt="" />
                <div className={`absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center transition ${currentSong?._id === heroSong._id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {currentSong?._id === heroSong._id && isPlaying ? <Pause fill="white" size={22} /> : <Play fill="white" size={22} className="ml-1" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {/* ← MODIF */}
                  <span className="text-[9px] font-black bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                    {isPersonalized ? '✨ POUR VOUS' : '⭐ DU JOUR'}
                  </span>
                  {heroSong.plays > 0 && <span className="text-[9px] text-zinc-500">{heroSong.plays.toLocaleString()} écoutes</span>}
                </div>
                <h2 className="text-xl md:text-3xl font-black text-white truncate">{heroSong.titre}</h2>
                <p className="text-zinc-400 text-sm mt-1 uppercase tracking-wide">{heroSong.artiste}</p>
              </div>
            </div>
          </div>
        </section>
      )}


      {isLoggedIn && hasStories && (
        <section className="pt-2">
          <div className='flex items-center gap-2 mb-4'>
            <div className="w-10 h-10 rounded-full border-2 border-pink-500 flex items-center justify-center">
              <Plus />
            </div>
            <h1 className='text-2xl font-bold text-white p-2'>Stories</h1>
          </div>
          <StoriesBar token={token} isLoggedIn={isLoggedIn} onEmpty={() => setHasStories(false)} />
        </section>
      )}

      {/* ══ 2. REPRENDRE OÙ VOUS EN ÉTIEZ ══ */}
      {isLoggedIn && lastPlayed && currentSong?._id !== lastPlayed.song._id && (
        <section>
          <SectionHeader icon={<Clock size={18} className="text-blue-400" />} title="Reprendre où vous en étiez" />
          <div onClick={() => {
            playFullSong(lastPlayed.song._id);
            setTimeout(() => {
              const audio = document.querySelector('audio');
              if (audio && lastPlayed.timestamp > 0) audio.currentTime = lastPlayed.timestamp;
            }, 500);
          }}
            className="flex items-center gap-4 p-4 bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/50 hover:border-zinc-700 rounded-2xl cursor-pointer group transition">
            <div className="relative shrink-0">
              <img src={lastPlayed.song.image} className="w-14 h-14 rounded-xl object-cover" alt="" />
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Play fill="white" size={16} className="ml-0.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{lastPlayed.song.titre}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{lastPlayed.song.artiste}</p>
              {lastPlayed.timestamp > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-30">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (lastPlayed.timestamp / (lastPlayed.song.duration || 180)) * 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-zinc-600">
                    arrêté à {Math.floor(lastPlayed.timestamp / 60)}:{String(Math.floor(lastPlayed.timestamp % 60)).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition shrink-0" />
          </div>
        </section>
      )}

      {/* ══ RADIO IA ══ */}
      <section>
        <SectionHeader
          icon={<Radio size={18} className="text-red-400" />}
          title="Radio IA"
          subtitle="L'IA compose votre playlist en continu"
        />
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/30 via-zinc-900/60 to-orange-900/20 border border-red-500/20 p-5 group cursor-pointer hover:border-red-500/40 transition-all duration-300"
          onClick={onInfiniteRadio}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.08)_0%,_transparent_60%)] pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30 shrink-0 group-hover:scale-105 transition-transform duration-300 relative">
              <Radio size={24} className="text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  IA · En direct
                </span>
              </div>
              <h3 className="text-base font-black text-white">Radio IA MOOZIK</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Choisissez une ambiance · L'IA compose en continu</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {['🌊 Chill', '⚡ Énergie', '🎯 Focus', '🎉 Fête'].map(m => (
                  <span key={m} className="text-[9px] font-bold bg-white/6 border border-white/8 text-zinc-500 px-2 py-0.5 rounded-full">{m}</span>
                ))}
                <span className="text-[9px] font-bold text-zinc-600 px-1 py-0.5">+4…</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 group-hover:border-red-500/30 transition-all duration-300">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-red-400 transition-colors" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. AMBIANCES / MOODS ══ */}
      <section>
        <SectionHeader icon={<Zap size={18} className="text-purple-400" />} title="Ambiances" subtitle="Filtrez par mood" />
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MOODS.map(m => (
            <button key={m.label}
              onClick={() => setSelectedMood(selectedMood === m.label ? null : m.label)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition border ${selectedMood === m.label ? m.activeColor : m.color}`}>
              {m.label}
            </button>
          ))}
          {selectedMood && (
            <button onClick={() => setSelectedMood(null)}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-700">
              <X size={10} /> Tout
            </button>
          )}
        </div>
        {selectedMood && moodCapped.length > 0 && (
          <>
            <div className="mt-4 flex flex-col gap-1">
              {visibleMood.map((song, i) => <SongRow key={song._id} song={song} index={i} {...songRowProps} />)}
            </div>
            {moodCapped.length > 5 && (
              <ShowMoreButton
                expanded={moodShowMore.expanded}
                onToggle={moodShowMore.toggle}
                total={moodCapped.length}
                shown={visibleMood.length}
              />
            )}
          </>
        )}
        {selectedMood && moodCapped.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-6 italic">Aucun titre avec ce mood — ajoutez des tags depuis le menu d'édition</p>
        )}
      </section>

      {/* ══ 4. TOP DU MOMENT ══ */}
      {top24hCapped.length > 0 && (
        <section>
          {/* ← MODIF : sous-titre mis à jour */}
          <SectionHeader
            icon={<Flame size={18} className="text-orange-500" />}
            title="Top du moment"
            subtitle="Score hybride · popularité + affinité + fraîcheur"
          />
          <div className="flex flex-col gap-1">
            {visibleTop24h.map((song, i) => (
              <TopTrack
                key={song._id || i}
                song={song}
                rank={i}
                isActive={currentSong?._id === song._id}
                isPlaying={isPlaying}
                onPlay={() => playFullSong(song._id)}
              />
            ))}
          </div>
          {top24hCapped.length > 5 && (
            <ShowMoreButton
              expanded={top24hShowMore.expanded}
              onToggle={top24hShowMore.toggle}
              total={top24hCapped.length}
              shown={visibleTop24h.length}
            />
          )}
        </section>
      )}

      {/* ══ NOUVEAU : "POUR VOUS" ══ */}
      {pourVousCapped.length > 0 && (
        <section>
          <SectionHeader
            icon={<Wand2 size={18} className="text-violet-400" />}
            title={isPersonalized ? 'Pour vous' : 'Sélection du moment'}
            subtitle={
              isPersonalized
                ? 'Affinité · fraîcheur · découverte · adaptée à vous'
                : 'Écoutez plus de musiques pour personnaliser cette section'
            }
          />
          {!isPersonalized && (
            <p className="text-[11px] text-violet-400/70 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2 mb-3">
              💡 Plus vous écoutez, plus les recommandations s'adaptent à vos goûts
            </p>
          )}
          <HorizontalScrollContainer
            showMoreProps={
              pourVousCapped.length > 8
                ? { total: pourVousCapped.length, shown: visiblePourVous.length, expanded: pourVousShowMore.expanded, onToggle: pourVousShowMore.toggle }
                : undefined
            }
          >
            {visiblePourVous.map(song => (
              <HorizontalCard
                key={song._id}
                song={song}
                isActive={currentSong?._id === song._id}
                isPlaying={isPlaying}
                onClick={() => playFullSong(song._id)}
                badge={isPersonalized && song._score > 60 ? '♥' : null}
                badgeColor="bg-violet-600"
              />
            ))}
          </HorizontalScrollContainer>
        </section>
      )}

      {/* ══ 5. DÉCOUVERTE DU JOUR (personnalisée) ══ */}
      {decouverteduJour && (
        <section>
          <SectionHeader
            icon={<Compass size={18} className="text-violet-400" />}
            title="Découverte du jour"
            subtitle={isPersonalized ? 'Dans vos goûts · peu connu · change chaque jour' : 'Un artiste émergent · change chaque jour'}
          />
          <div onClick={() => playFullSong(decouverteduJour._id)} className="relative overflow-hidden rounded-2xl cursor-pointer group">
            <div className="absolute inset-0">
              <img src={decouverteduJour.image} className="w-full h-full object-cover opacity-30 blur-lg scale-110" alt="" />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black/90 to-black/30" />
            <div className="relative flex items-center gap-4 p-5">
              <img src={decouverteduJour.image} className="w-16 h-16 rounded-2xl object-cover shadow-lg shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                  {isPersonalized ? 'Dans vos goûts' : 'Découverte'}
                </span>
                <p className="text-base font-black text-white truncate mt-1">{decouverteduJour.titre}</p>
                <p className="text-[11px] text-zinc-400 uppercase truncate">{decouverteduJour.artiste}</p>
                <p className="text-[9px] text-zinc-600 mt-0.5">{decouverteduJour.plays || 0} écoutes · talents émergents</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition">
                {currentSong?._id === decouverteduJour._id && isPlaying ? <Pause fill="white" size={16} /> : <Play fill="white" size={16} className="ml-0.5" />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ NOUVEAU : AMBIANCE CONTEXTUELLE (heure du jour) ══ */}
      {!selectedMood && ambianceContextuelle.songs.length > 0 && (
        <section>
          <SectionHeader
            icon={<Clock size={18} className="text-amber-400" />}
            title={`${MOOD_ICONS[ambianceContextuelle.mood] || '🎵'} ${ambianceContextuelle.label}`}
            subtitle={`Sélection ${ambianceContextuelle.mood} · adaptée à ce moment de la journée`}
          />
          <HorizontalScrollContainer
            showMoreProps={
              ambianceContextuelle.songs.length > 8
                ? { total: ambianceContextuelle.songs.length, shown: visibleAmbiance.length, expanded: ambianceShowMore.expanded, onToggle: ambianceShowMore.toggle }
                : undefined
            }
          >
            {visibleAmbiance.map(song => (
              <HorizontalCard
                key={song._id}
                song={song}
                isActive={currentSong?._id === song._id}
                isPlaying={isPlaying}
                onClick={() => playFullSong(song._id)}
              />
            ))}
          </HorizontalScrollContainer>
        </section>
      )}

      {/* ══ 6. NOUVEAUTÉS (triées par date de sortie + score) ══ */}
      <section>
        <SectionHeader icon={<Sparkles size={18} className="text-blue-400" />} title="Nouveautés" subtitle="Triées par date de sortie" />
        <HorizontalScrollContainer
          showMoreProps={
            nouveautes.length > 8
              ? { total: nouveautes.length, shown: visibleNouveautes.length, expanded: nouveautesShowMore.expanded, onToggle: nouveautesShowMore.toggle }
              : undefined
          }
        >
          {visibleNouveautes.map(song => (
            <HorizontalCard key={song._id} song={song}
              isActive={currentSong?._id === song._id} isPlaying={isPlaying}
              onClick={() => playFullSong(song._id)}
              badge={isNewSong(song) ? 'NEW' : null} badgeColor="bg-blue-500" />
          ))}
        </HorizontalScrollContainer>
      </section>

      {showAd && (
        <AudioAdPlayer isPremium={isPremium} token={token} onAdEnd={() => setShowAd(false)} />
      )}

      {/* ══ 7. ARTISTES TENDANCE (pondérés par affinité) ══ */}
      {artistesTendance.length > 0 && (
        <section>
          <SectionHeader
            icon={<Users size={18} className="text-pink-400" />}
            title="Artistes tendance"
            subtitle={isPersonalized ? 'Popularité pondérée par vos affinités' : 'Classés par vélocité d\'écoutes'}
          />
          <HorizontalScrollContainer
            showMoreProps={
              artistesTendance.length > 8
                ? { total: artistesTendance.length, shown: visibleArtistes.length, expanded: artistesShowMore.expanded, onToggle: artistesShowMore.toggle }
                : undefined
            }
          >
            {visibleArtistes.map(({ nom, plays, song }) => (
              <div key={nom} className="shrink-0 w-24 text-center group cursor-pointer"
                onClick={() => { if (song) playFullSong(song._id); }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden bg-zinc-800 border-2 border-zinc-700 group-hover:border-red-500/50 transition">
                  {song?.image
                    ? <img src={song.image} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-xl font-black text-zinc-600">{nom[0]}</div>
                  }
                </div>
                <p className="text-xs font-bold truncate text-zinc-300">{nom}</p>
                <p className="text-[10px] text-zinc-600">{plays.toLocaleString()} écoutes</p>
              </div>
            ))}
          </HorizontalScrollContainer>
        </section>
      )}

      {/* ══ 8. ALBUMS RÉCENTS ══ */}
      {albumsCapped.length > 0 && (
        <section>
          <SectionHeader icon={<Disc3 size={18} className="text-indigo-400" />} title="Albums récents" />
          <HorizontalScrollContainer
            showMoreProps={
              albumsCapped.length > 8
                ? { total: albumsCapped.length, shown: visibleAlbums.length, expanded: albumsShowMore.expanded, onToggle: albumsShowMore.toggle }
                : undefined
            }
          >
            {visibleAlbums.map(album => (
              <div key={album._id} className="shrink-0 w-28 md:w-32 group cursor-pointer">
                <div className="relative mb-2 aspect-square">
                  <img src={album.image || '/icon-192.png'} className="w-full h-full rounded-2xl object-cover shadow-lg group-hover:scale-105 transition" alt="" />
                </div>
                <p className="text-xs font-bold truncate text-zinc-200">{album.titre}</p>
                <p className="text-[10px] text-zinc-600 truncate">{album.artiste || album.annee}</p>
              </div>
            ))}
          </HorizontalScrollContainer>
        </section>
      )}

      {/* ══ PLAYLISTS PUBLIQUES ══ */}
      <PublicPlaylistsSection
        token={token}
        setCurrentSong={setCurrentSong}
        setIsPlaying={setIsPlaying}
        currentSong={currentSong}
        isPlaying={isPlaying}
        musiques={songs}
        playSong={playSong}
      />

      {/* ══ INCONNUS MAIS EXCELLENTS (gems hybrides) ══ */}
      {gemsCapped.length > 0 && (
        <section>
          <SectionHeader
            icon={<Gem size={18} className="text-cyan-400" />}
            title="Inconnus mais excellents"
            subtitle={isPersonalized ? 'Moins de 100 écoutes · score d\'affinité élevé' : 'Moins de 100 écoutes · très aimés'}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {visibleGems.map(song => (
              <DiscoveryCard key={song._id} song={song}
                isActive={currentSong?._id === song._id} isPlaying={isPlaying}
                onClick={() => playFullSong(song._id)} />
            ))}
          </div>
          {gemsCapped.length > 4 && (
            <ShowMoreButton
              expanded={gemsShowMore.expanded}
              onToggle={gemsShowMore.toggle}
              total={gemsCapped.length}
              shown={visibleGems.length}
            />
          )}
        </section>
      )}

      {/* ══ CLASSEMENT DES FANS ══ */}
      {isLoggedIn && rankingCapped.length > 0 && (
        <section>
          <SectionHeader icon={<Trophy size={18} className="text-yellow-400" />} title="Classement des fans" subtitle="Les plus actifs cette semaine" />
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4 space-y-2">
            {visibleRanking.map((entry, i) => (
              <div key={entry._id} className="flex items-center gap-3">
                <span className={`text-sm font-black w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                  {entry.userId?.avatar
                    ? <img src={entry.userId.avatar} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-sm font-black text-zinc-500">{(entry.userId?.nom || '?')[0]}</div>
                  }
                </div>
                <p className="flex-1 text-sm font-bold truncate">{entry.userId?.nom || 'Anonyme'}</p>
                <span className="text-xs text-zinc-500 shrink-0">{entry.points?.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          {rankingCapped.length > 5 && (
            <ShowMoreButton
              expanded={rankingShowMore.expanded}
              onToggle={rankingShowMore.toggle}
              total={rankingCapped.length}
              shown={visibleRanking.length}
            />
          )}
        </section>
      )}

      {/* ══ FAVORIS ══ */}
      {isLoggedIn && favorisCapped.length > 0 && (
        <section>
          <SectionHeader icon={<Heart size={18} className="text-red-500" fill="red" />} title="Aimés" />
          <div className="flex flex-col gap-1">
            {visibleFavoris.map((song, i) => <SongRow key={song._id} song={song} index={i} {...songRowProps} />)}
          </div>
          {favorisCapped.length > 5 && (
            <ShowMoreButton
              expanded={favorisShowMore.expanded}
              onToggle={favorisShowMore.toggle}
              total={favorisCapped.length}
              shown={visibleFavoris.length}
            />
          )}
        </section>
      )}

      {/* ══ HORS-LIGNE ══ */}
      <OfflineSection
        musiques={songs}
        setCurrentSong={setCurrentSong}
        setIsPlaying={setIsPlaying}
        currentSong={currentSong}
        isPlaying={isPlaying}
        isAudioCached={isAudioCached}
        playSong={playSong}
      />

      {/* ══ MES PARTAGES ══ */}
      {isLoggedIn && (
        <RecentSharesSection
          token={token}
          musiques={songs}
          setCurrentSong={setCurrentSong}
          setIsPlaying={setIsPlaying}
          currentSong={currentSong}
          playSong={playSong}
        />
      )}

    </div>
  );
};

export default HomeView;