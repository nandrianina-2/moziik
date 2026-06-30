import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { NavLink as NavLinkRRD } from 'react-router-dom';
import {
  Home, Play, Pause, SkipBack, SkipForward, Volume2, Plus, Shuffle,
  Trash2, ListPlus, Search, Music, Heart, ListOrdered, Sliders,
  LogIn, LogOut, Repeat, Repeat1, Timer, Gauge, BarChart2,
  Users, Mic2, X, Disc3, Globe, Lock, ChevronDown, Settings,
  Maximize2, Eye, TrendingUp, Flame, Sparkles, Dices, History, Bell, WifiOff,
  CheckCircle, Star, Crown, Ticket, ShoppingCart, DollarSign, Radio, Zap, Shield, Download,
  ArrowLeft, ArrowRight, Upload, Sun, Moon, Music2
} from 'lucide-react';

import { API } from './config/api';
import { useDominantColor, applyDynamicTheme } from './hooks/useDominantColor';
import { useRealtimeListeners, ListenersWidget } from './hooks/useRealtimeListeners.jsx';
import { useMediaSession, useWakeLock, useAppBadge, useOfflineDetection, useAudioCache } from './hooks/usePWA';

import MiniPlayerMobile from './components/player/MiniPlayerMobile';
import LoginModal from './components/modals/LoginModal';
import UploadModal from './components/modals/UploadModal';
import CreatePlaylistModal from './components/modals/CreatePlaylistModal';
import LoadingScreen from './components/ui/LoadingScreen';
import { SongListSkeleton } from './components/ui/Skeletons';
import { OfflineBanner, CacheButton } from './components/ui/OfflineBanner';

import HomeView from './views/HomeView';

// ── Vues secondaires chargées en différé (lazy) ──────────────────────────────
const SettingsView           = lazy(() => import('./views/SettingsView'));
const AlbumView              = lazy(() => import('./views/AlbumView'));
const ArtistView             = lazy(() => import('./views/ArtistView'));
const PlaylistView           = lazy(() => import('./views/PlaylistView'));
const UserPlaylistView       = lazy(() => import('./views/UserPlaylistView'));
const FavoritesView          = lazy(() => import('./views/FavoritesView'));
const ArtistsAdminView       = lazy(() => import('./views/ArtistsAdminView'));
const MyAlbumsView           = lazy(() => import('./views/MyAlbumsView'));
const ArtistsListView        = lazy(() => import('./views/ArtistsListView'));
const AccountView            = lazy(() => import('./views/AccountView'));
const UsersAdminView         = lazy(() => import('./views/UsersAdminView'));
const PublicPlaylistsView    = lazy(() => import('./views/PublicPlaylistsView'));
const SmartLinkPage          = lazy(() => import('./views/SmartLinkPage'));
const ArtistDashboard        = lazy(() => import('./views/ArtistDashboard'));
const AdminCertificationsView = lazy(() => import('./views/AdminCertificationsView'));
import { usePushNotifications } from './hooks/usePushNotifications';
import { useI18n } from './hooks/useI18n';
const SubscriptionView       = lazy(() => import('./views/SubscriptionView'));
const ArtistAnalyticsView    = lazy(() => import('./views/ArtistAnalyticsView'));
const AdminLibraryView       = lazy(() => import('./views/AdminLibraryView'));
const AdminArtistView        = lazy(() => import('./views/AdminArtistView'));
const AdminTeamView          = lazy(() => import('./views/AdminTeamView'));
const OfflineLibraryView     = lazy(() => import('./views/OfflineLibraryView'));
const ResetPassword          = lazy(() => import('./components/modals/ResetPassword'));
const VerifyEmail            = lazy(() => import('./components/modals/VerifyEmail'));
const SessionsView           = lazy(() => import('./views/SessionsView'));
const FullPlayerPage         = lazy(() => import('./components/player/FullPlayerPage'));
const RadioView              = lazy(() => import('./views/RadioView'));
import { EventsView } from './components/MonetisationComponents.jsx';
import { AdminMonetisationView } from './components/RevenueComponents.jsx';
import { AudioAdPlayer } from './components/MonetisationComponents.jsx';
import useSubscription from './hooks/useSubscription';
import { NotificationsPanel, HistoryView, RecommendationsView, SharePageView } from './components/social/SocialFeatures';
import { TrendingView, ListenPartyModal, LoyaltyWidget } from './components/SocialComponents';
import { eqBands, eqPresets, initEQ12 } from './components/player/constants/eq.js';
import MoozikHeader from './components/layout/MoozikHeader.jsx';
import MoozikRightPanel from './components/layout/MoozikRightPanel.jsx';
import { useSessionGuard } from './hooks/useSessionGuard';
import { clearLocalSession } from './hooks/useAuth';
import SessionExpiredToast from './components/ui/SessionExpiredToast';
import UserGreeting from './components/ui/UserGreeting.jsx';


const DashboardView     = lazy(() => import('./views/EnhancedDashboardView'));
const PublicProfileView = lazy(() => import('./views/PublicProfileView'));
const ViewLoader = () => <div className="p-6"><SongListSkeleton count={6} /></div>;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES TRENDING
// ─────────────────────────────────────────────────────────────────────────────
const getTrendingScore = (song) => {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const isRecent = song.createdAt && (Date.now() - new Date(song.createdAt).getTime()) < ONE_WEEK;
  return (song.plays || 0) + (song.likes || 0) * 3 + (isRecent ? 15 : 0);
};

const sortByTrending = (songs) =>
  [...songs].sort((a, b) => getTrendingScore(b) - getTrendingScore(a));

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE QUOTIDIENNE UNIQUE — persistance des musiques déjà jouées aujourd'hui
// ─────────────────────────────────────────────────────────────────────────────
const DAILY_PLAYED_KEY = 'moozik_daily_played';
const getTodayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const loadDailyPlayed = () => {
  try {
    const raw = localStorage.getItem(DAILY_PLAYED_KEY);
    if (!raw) return { date: getTodayKey(), ids: new Set() };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return { date: getTodayKey(), ids: new Set() };
    return { date: parsed.date, ids: new Set(parsed.ids) };
  } catch {
    return { date: getTodayKey(), ids: new Set() };
  }
};

const saveDailyPlayed = (state) => {
  try {
    localStorage.setItem(DAILY_PLAYED_KEY, JSON.stringify({ date: state.date, ids: Array.from(state.ids) }));
  } catch {}
};

  // ── Hook debounce ────────────────────────────────────────────
  const useDebounce = (value, delay) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  };

// ─────────────────────────────────────────────────────────────────────────────
// NAVLINK — composant de navigation de la sidebar
// Défini en dehors de AppInner pour éviter d'être recréé à chaque rendu.
// ─────────────────────────────────────────────────────────────────────────────
const NavLink = ({ to, icon, label, colorClass }) => (
  <NavLinkRRD
    to={to}
    end
    className={({ isActive }) =>
      `relative flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13.5px] font-medium
       transition-all duration-200 ease-out cursor-pointer select-none group
       ${isActive
         ? 'text-white bg-gradient-to-r from-red-600 via-red-500 to-red-400 shadow-[0_0_18px_rgba(220,38,38,0.5),0_0_40px_rgba(220,38,38,0.15)] scale-[1.01]'
         : `${colorClass || 'text-zinc-400'} hover:text-white hover:bg-white/[0.05]`
       }`
    }
  >
    {({ isActive }) => (
      <>
        <span className={`shrink-0 transition-all duration-200
          ${isActive ? 'opacity-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]' : 'opacity-50 group-hover:opacity-80'}`}>
          {icon}
        </span>
        <span className={isActive ? 'font-semibold tracking-wide' : ''}>{label}</span>
      </>
    )}
  </NavLinkRRD>
);

// ─────────────────────────────────────────────────────────────────────────────
// APP INNER
// ─────────────────────────────────────────────────────────────────────────────
const AppInner = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode]   = useState(true);
  const [smartMode, setSmartMode] = useState(false);

  // ── Data ──────────────────────────────────────────────────────
  const [musiques, setMusiques]           = useState([]);
  const [playlists, setPlaylists]         = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [artists, setArtists]             = useState([]);
  const [albums, setAlbums]               = useState([]);

  // ── Player ────────────────────────────────────────────────────
  const [queue, setQueue]               = useState([]);
  const [playedIds, setPlayedIds]       = useState(new Set());
  const [showQueue, setShowQueue]       = useState(false);
  const [currentSong, setCurrentSong]   = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [isShuffle, setIsShuffle]       = useState(false);
  const [repeatMode, setRepeatMode]     = useState(0);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolume]             = useState(() => Number(localStorage.getItem('moozik_volume')) || 80);
  const [showListenParty, setShowListenParty] = useState(false);
  const [playContext, setPlayContext]   = useState('trending');

  // ── EQ ────────────────────────────────────────────────────────
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer]     = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState(null);

  // ── UI ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]             = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  // Pagination infinite scroll
  const [songsPage, setSongsPage]             = useState(1);
  const [hasMore, setHasMore]                 = useState(true);
  const [isFetchingMore, setIsFetchingMore]   = useState(false);
  const loaderRef                             = useRef(null);
  const [activeMenu, setActiveMenu]           = useState(null);
  const [showEQ, setShowEQ]                   = useState(false);
  const [showUpload, setShowUpload]           = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showMobileMenu, setShowMobileMenu]   = useState(false);
  const [dragOverId, setDragOverId]           = useState(null);
  const [dragSongId, setDragSongId]           = useState(null);
  const [unreadNotifs, setUnreadNotifs]       = useState(0);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');

  // ── Auth ──────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin]           = useState(false);
  const [isArtist, setIsArtist]         = useState(false);
  const [isUser, setIsUser]             = useState(false);
  const [userRole, setUserRole]         = useState('');
  const [userEmail, setUserEmail]       = useState('');
  const [userNom, setUserNom]           = useState('');
  const [userArtistId, setUserArtistId] = useState('');
  const [userId, setUserId]             = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [token, setToken]               = useState(localStorage.getItem('moozik_token') || '');
  const [userAvatar, setUserAvatar]     = useState(null);
  const [isPrimary, setIsPrimary]       = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  const audioRef          = useRef(null);
  const canvasRef         = useRef(null);
  const audioContextRef   = useRef(null);
  const sleepRef          = useRef(null);
  const playCountedRef    = useRef(false);
  const queueRef          = useRef(queue);
  // S'assure que la liste "déjà joué aujourd'hui" correspond bien à la date du jour
  const dailyPlayedRef = useRef(loadDailyPlayed());
  const ensureDailyFresh = useCallback(() => {
    const today = getTodayKey();
    if (dailyPlayedRef.current.date !== today) {
      dailyPlayedRef.current = { date: today, ids: new Set() };
      saveDailyPlayed(dailyPlayedRef.current);
    }
  }, []);

  // Marque automatiquement chaque musique lancée comme "jouée aujourd'hui"
  useEffect(() => {
    if (!currentSong?._id) return;
    ensureDailyFresh();
    dailyPlayedRef.current.ids.add(currentSong._id);
    saveDailyPlayed(dailyPlayedRef.current);
  }, [currentSong, ensureDailyFresh]);

  const startTimeRef      = useRef(null);
  const [cachedIds, setCachedIds] = useState([]);
  const [eqGains, setEqGains]     = useState(Array(12).fill(0));
  const eqFiltersRef = useRef([]);
  const eqGainsRef   = useRef(eqGains);
  const [audioReady, setAudioReady] = useState(false);

  const tokenRef       = useRef(token);
  const musiquesRef    = useRef(musiques);
  const currentSongRef = useRef(currentSong);
  const isShuffleRef   = useRef(isShuffle);
  const repeatModeRef  = useRef(repeatMode);
  const playContextRef = useRef(playContext);

  useEffect(() => { tokenRef.current      = token;       }, [token]);
  useEffect(() => { queueRef.current      = queue;       }, [queue]);
  useEffect(() => { eqGainsRef.current    = eqGains;     }, [eqGains]);
  useEffect(() => { musiquesRef.current   = musiques;    }, [musiques]);
  useEffect(() => { currentSongRef.current= currentSong; }, [currentSong]);
  useEffect(() => { isShuffleRef.current  = isShuffle;   }, [isShuffle]);
  useEffect(() => { repeatModeRef.current = repeatMode;  }, [repeatMode]);
  useEffect(() => { playContextRef.current= playContext; }, [playContext]);

  // ── Hooks avancés ─────────────────────────────────────────────
  const dominantColor = useDominantColor(currentSong?.image);
  useEffect(() => { applyDynamicTheme(dominantColor); }, [dominantColor]);
  const { listeners, connected } = useRealtimeListeners(token, currentSong);
  const { isOnline, wasOffline } = useOfflineDetection();
  const { cacheAudio, removeCached, isAudioCached, getCachedUrl } = useAudioCache();
  useWakeLock(isPlaying);
  useAppBadge(unreadNotifs);
  const { lang, setLang, t } = useI18n();
  const { isPremium } = useSubscription(token);
  const [showRadio, setShowRadio] = useState(false);


  const debouncedSearch = useDebounce(searchTerm, 400);

  // Recherche → redirect home + recharger avec debounce
  const prevSearchRef = useRef('');
  useEffect(() => {
    const hasTerm = debouncedSearch.trim().length > 0;
    if (hasTerm && location.pathname !== '/') navigate('/');
    prevSearchRef.current = debouncedSearch;
    // Recharger la liste filtrée côté serveur
    if (!hasTerm) chargerMusiques();
  }, [debouncedSearch]);

  // EQ
  const [activePreset, setActivePreset] = useState('Flat');
  const setEqBand = useCallback((idx, value) => {
    setEqGains(prev => {
      const n = prev.length === 12 ? [...prev] : Array(12).fill(0);
      n[idx] = value;
      return n;
    });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value = value;
    setActivePreset('');
  }, []);

  const applyPreset = useCallback((name) => {
    const gains = eqPresets[name] || Array(12).fill(0);
    setEqGains(gains);
    setActivePreset(name);
    gains.forEach((v, i) => { if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = v; });
  }, []);

  const resetEQ = useCallback(() => applyPreset('Flat'), [applyPreset]);

  // Titre dynamique
  useEffect(() => {
    if (!currentSong) { document.title = 'MooZik'; return; }
    document.title = `${currentSong.titre} — ${currentSong.artiste}`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = currentSong.image; link.type = 'image/jpeg';
  }, [currentSong, isPlaying]);

  // ── AUTH ──────────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('moozik_token');
    const savedRole  = localStorage.getItem('moozik_role');
    if (!savedToken) return;
    let endpoint = '/users/verify';
    if (savedRole === 'admin')  endpoint = '/admin/verify';
    if (savedRole === 'artist') endpoint = '/artists/verify';
    fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(r => r.json()).then(data => {
        if (data.valid) {
          setToken(savedToken);
          const role = data.role || savedRole;
          setUserRole(role);
          setUserEmail(data.email || localStorage.getItem('moozik_email'));
          if (role === 'admin')  { setIsAdmin(true);  if (data.isPrimary) setIsPrimary(true); }
          if (role === 'artist') {
            setIsArtist(true); setUserNom(data.nom || localStorage.getItem('moozik_nom'));
            const aid = data.artisteId || data.artistId || data.id || data._id || localStorage.getItem('moozik_artisteId');
            setUserArtistId(aid); if (aid) localStorage.setItem('moozik_artisteId', aid);
          }
          if (role === 'user') {
            setIsUser(true); setUserNom(data.nom || localStorage.getItem('moozik_nom'));
            const uid = data.userId || data.id || data._id || localStorage.getItem('moozik_userId');
            setUserId(uid);
            if (uid) {
              localStorage.setItem('moozik_userId', uid);
              const saved = localStorage.getItem(`moozik_avatar_${uid}`);
              if (saved) setUserAvatar(saved);
              else if (data.avatar) { setUserAvatar(data.avatar); localStorage.setItem(`moozik_avatar_${uid}`, data.avatar); }
            }
          }
        } else {
          ['moozik_token','moozik_email','moozik_role','moozik_nom','moozik_artisteId','moozik_userId'].forEach(k => localStorage.removeItem(k));
        }
      }).catch(() => {});
  }, []);

  const handleLogin = (data) => {
    setToken(data.token); setUserRole(data.role); setUserEmail(data.email);
    if (data.role === 'admin') { setIsAdmin(true); if (data.isPrimary) setIsPrimary(true); }
    if (data.role === 'artist') { setIsArtist(true); setUserNom(data.nom); const aid = data.artisteId || data.artistId || data.id || data._id; setUserArtistId(aid); if (aid) localStorage.setItem('moozik_artisteId', aid); }
    if (data.role === 'user') {
      setIsUser(true); setUserNom(data.nom);
      const uid = data.userId || data.id || data._id;
      setUserId(uid); if (uid) localStorage.setItem('moozik_userId', uid);
      if (uid) { const s = localStorage.getItem(`moozik_avatar_${uid}`); if (s) setUserAvatar(s); else if (data.avatar) { setUserAvatar(data.avatar); localStorage.setItem(`moozik_avatar_${uid}`, data.avatar); } }
    }
    chargerUserPlaylists(data.token);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    ['moozik_token','moozik_email','moozik_role','moozik_nom','moozik_artisteId','moozik_userId'].forEach(k => localStorage.removeItem(k));
    setToken(''); setIsAdmin(false); setIsArtist(false); setIsUser(false);
    setUserRole(''); setUserEmail(''); setUserNom(''); setUserArtistId(''); setUserId('');
    setUserAvatar(null); setIsPrimary(false); setUserPlaylists([]);
  };

  const handleUpdateProfile = ({ nom, avatar }) => {
    if (nom) setUserNom(nom);
    if (avatar !== undefined) {
      setUserAvatar(avatar || null);
      const uid = userId || localStorage.getItem('moozik_userId');
      if (uid) { if (avatar) localStorage.setItem(`moozik_avatar_${uid}`, avatar); else localStorage.removeItem(`moozik_avatar_${uid}`); }
    }
  };

  // ── DATA ──────────────────────────────────────────────────────
  // Charge la première page uniquement (20 titres) — le reste via infinite scroll
  const chargerMusiques = async () => {
    try {
      const q = debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : '';
      const data = await fetch(`${API}/songs?page=1&limit=20${q}`).then(r => r.json());
      const songs = Array.isArray(data) ? data : (data.songs || []);
      const pages = data.pagination?.pages || 1;
      const sortedSongs = sortByTrending(songs);
      setMusiques(sortedSongs);
      setSongsPage(1);
      setHasMore(pages > 1);
      if (sortedSongs.length === 0) return;
      setCurrentSong(prev => {
        if (prev) return prev;
        const lastId = localStorage.getItem('moozik_last_song_id');
        if (lastId) { const s = sortedSongs.find(s => s._id === lastId); if (s) return s; }
        return getDailySong(sortedSongs);
      });
    } catch (e) { console.error('Erreur musiques:', e); }
    finally { setIsLoading(false); }
  };

  // Charge la page suivante (appelé par l'IntersectionObserver)
  const chargerPlus = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = songsPage + 1;
      const q = debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : '';
      const data = await fetch(`${API}/songs?page=${nextPage}&limit=20${q}`).then(r => r.json());
      const songs = Array.isArray(data) ? data : (data.songs || []);
      const pages = data.pagination?.pages || 1;
      setMusiques(prev => {
        const existingIds = new Set(prev.map(s => s._id));
        const newSongs = songs.filter(s => !existingIds.has(s._id));
        return sortByTrending([...prev, ...newSongs]);
      });
      setSongsPage(nextPage);
      setHasMore(nextPage < pages);
    } catch (e) { console.error('Erreur chargement page suivante:', e); }
    finally { setIsFetchingMore(false); }
  }, [isFetchingMore, hasMore, songsPage, debouncedSearch]);

  const getDailySong = (songs) => {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
    return songs[hash % songs.length];
  };

  const chargerPlaylists     = async () => { try { setPlaylists(await fetch(`${API}/playlists`).then(r => r.json())); } catch {} };
  const chargerArtists       = async () => { try { setArtists(await fetch(`${API}/artists`).then(r => r.json())); } catch {} };
  const chargerAlbums        = async () => { try { const d = await fetch(`${API}/albums`).then(r => r.json()); setAlbums(Array.isArray(d) ? d : []); } catch {} };
  const chargerUserPlaylists = async (t) => { if (!t) return; try { const d = await fetch(`${API}/user-playlists/mine`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()); setUserPlaylists(Array.isArray(d) ? d : []); } catch {} };

  useEffect(() => { chargerMusiques(); chargerPlaylists(); chargerArtists(); chargerAlbums(); }, []);

  // ── IntersectionObserver : charge la page suivante quand on arrive en bas ──
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) chargerPlus(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [chargerPlus]);
  useEffect(() => { if (token && (isAdmin || isArtist || isUser)) chargerUserPlaylists(token); }, [token, isAdmin, isArtist, isUser]);

  // ── ACTIONS ───────────────────────────────────────────────────
  const toggleLike = async (id) => {
    if (!token || !(isAdmin || isArtist || isUser)) { setShowLoginModal(true); return; }
    try {
      const updated = await fetch(`${API}/songs/${id}/like`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setMusiques(prev => prev.map(s => s._id === id ? { ...s, liked: updated.liked } : s));
      if (currentSong?._id === id) setCurrentSong(prev => prev ? { ...prev, liked: updated.liked } : prev);
    } catch {}
  };

  const addToQueue = (song) => { setQueue(prev => [...prev, song]); setActiveMenu(null); };
  const deleteSong = (id) => { setMusiques(prev => prev.filter(s => s._id !== id)); if (currentSong?._id === id) setCurrentSong(null); };
  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

  const creerPlaylist     = async () => { const nom = prompt('Nom de la playlist ?'); if (!nom) return; await fetch(`${API}/playlists`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ nom }) }); chargerPlaylists(); };
  const supprimerPlaylist = async (id) => { if (!window.confirm('Supprimer cette playlist ?')) return; await fetch(`${API}/playlists/${id}`, { method: 'DELETE', headers: authHeaders() }); chargerPlaylists(); };
  const ajouterAPlaylist  = async (playlistId, songId) => { await fetch(`${API}/playlists/${playlistId}/add/${songId}`, { method: 'POST', headers: authHeaders() }); chargerPlaylists(); setActiveMenu(null); };
  const supprimerUserPlaylist = async (id) => { if (!window.confirm('Supprimer ?')) return; await fetch(`${API}/user-playlists/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); chargerUserPlaylists(token); };
  const ajouterAUserPlaylist  = async (playlistId, songId) => { await fetch(`${API}/user-playlists/${playlistId}/add/${songId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); chargerUserPlaylists(token); setActiveMenu(null); };
  const togglePlaylistVisibility = () => chargerUserPlaylists(token);

  const handleDragStart = (e, id) => { setDragSongId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver  = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = async (e, targetId) => {
    e.preventDefault(); if (dragSongId === targetId) return;
    const oi = musiques.findIndex(s => s._id === dragSongId);
    const ni = musiques.findIndex(s => s._id === targetId);
    const r = [...musiques]; const [m] = r.splice(oi, 1); r.splice(ni, 0, m);
    setMusiques(r); setDragSongId(null); setDragOverId(null);
    await fetch(`${API}/songs/reorder`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ orderedIds: r.map(s => s._id) }) });
  };

  const playAll = useCallback((songs, startIndex = 0) => {
    if (!songs?.length) return;
    const start = songs[startIndex];
    const afterStart = songs.slice(startIndex + 1);
    const beforeStart = songs.slice(0, startIndex);
    setCurrentSong(start); setIsPlaying(true);
    setQueue([...afterStart, ...beforeStart]);
    setPlayedIds(new Set(songs.map(s => s._id)));
    setPlayContext('playlist');
  }, []);

  const playByCategory = useCallback((song, allSongs) => {
    const cat = song.categorie || song.category || song.genre || null;
    let siblings;
    if (cat) {
      siblings = sortByTrending(allSongs.filter(s => (s.categorie || s.category || s.genre) === cat && s._id !== song._id));
      setPlayContext(`category:${cat}`);
    } else {
      siblings = sortByTrending(allSongs.filter(s => s._id !== song._id));
      setPlayContext('trending');
    }
    setCurrentSong(song); setIsPlaying(true); setQueue(siblings);
  }, []);

  // Lecture "simple" — recherche, notifications, clic direct hors playlist/catégorie/radio.
  // Réinitialise la queue et le contexte de lecture pour éviter que handleNext()
  // ne retombe sur un ancien contexte filtré (category:xxx / radio) périmé,
  // ce qui provoquait des répétitions de chanson après une lecture manuelle.
  const playSong = useCallback((song) => {
    if (!song) return;
    setQueue([]);
    setPlayContext('trending');
    setCurrentSong(song);
    setIsPlaying(true);
  }, []);

  const handleInfiniteRadio = useCallback(async (song) => {
    setShowRadio(true);
    try {
      const similar = await fetch(`${API}/songs/${song._id}/similar`).then(r => r.json());
      if (Array.isArray(similar) && similar.length > 0) {
        setCurrentSong(song); setIsPlaying(true); setQueue(similar); setPlayContext('radio');
      }
    } catch {}
  }, []);

  // Audio init
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const initAudioEngine = useCallback(() => {
    initEQ12(audioRef, eqFiltersRef, audioContextRef, () => setAudioReady(true));
    eqGainsRef.current.forEach((gain, i) => { if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = gain; });
  }, []);

  // Visualizer canvas
  useEffect(() => {
    if (!audioReady || !canvasRef.current) return;
    const analyser = audioContextRef.current.analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let rafId;
    const draw = () => {
      rafId = requestAnimationFrame(draw);
      if (!canvasRef.current) return;
      analyser.getByteFrequencyData(buf);
      const cv = canvasRef.current;
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      const bw = (cv.width / buf.length) * 2.5;
      let x = 0;
      buf.forEach(v => { c.fillStyle = `rgb(${v + 100},40,40)`; c.fillRect(x, cv.height - (v / 255) * cv.height, bw, (v / 255) * cv.height); x += bw + 1; });
    };
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [audioReady]);

    const handleSessionExpired = useCallback((message) => {
    // 1. Afficher le toast
    setSessionExpiredMsg(message);
  
    // 2. Nettoyer la session locale
    clearLocalSession();
  
    // 3. Réinitialiser tous les states auth
    setToken('');
    setIsAdmin(false);
    setIsArtist(false);
    setIsUser(false);
    setUserRole('');
    setUserEmail('');
    setUserNom('');
    setUserArtistId('');
    setUserId('');
    setUserAvatar(null);
    setIsPrimary(false);
    setUserPlaylists([]);
  }, []);
  
  useSessionGuard(handleSessionExpired);

  // ── handleNext / handlePrev ────────────────────────────────────
  // La lecture automatique choisit toujours un morceau au hasard (aléatoire),
  // en excluant les musiques déjà jouées aujourd'hui (persistance localStorage).
  // Quand tout le pool du jour a été épuisé, on réinitialise uniquement ce pool
  // pour repartir sur un nouveau cycle aléatoire complet.
  const handleNext = useCallback(() => {
    const q = queueRef.current; const mus = musiquesRef.current; const cur = currentSongRef.current;
    const rep = repeatModeRef.current; const ctx = playContextRef.current;

    if (q.length > 0) { const [next, ...rest] = q; setQueue(rest); setCurrentSong(next); setIsPlaying(true); return; }
    if (!mus.length) return;
    if (rep === 2) { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } return; }

    // Pool de base selon le contexte de lecture (catégorie ou tout le catalogue)
    let basePool = mus;
    if (ctx.startsWith('category:')) {
      const cat = ctx.replace('category:', '');
      basePool = mus.filter(s => (s.categorie || s.category || s.genre) === cat);
    }

    ensureDailyFresh();
    const playedToday = dailyPlayedRef.current.ids;

    // Exclut le morceau courant et tout ce qui a déjà été joué aujourd'hui
    let pool = basePool.filter(s => s._id !== cur?._id && !playedToday.has(s._id));

    // Cycle du jour épuisé pour ce pool → on le réinitialise pour permettre
    // un nouveau tirage aléatoire complet, toujours sans répéter le morceau en cours
    if (pool.length === 0) {
      basePool.forEach(s => playedToday.delete(s._id));
      saveDailyPlayed(dailyPlayedRef.current);
      pool = basePool.filter(s => s._id !== cur?._id);
    }
    if (pool.length === 0) return;

    const next = pool[Math.floor(Math.random() * pool.length)];
    setCurrentSong(next);
    setIsPlaying(true);
  }, [ensureDailyFresh]);

  const handlePrev = useCallback(() => {
    const mus = musiquesRef.current; const cur = currentSongRef.current; const ctx = playContextRef.current;
    if (!mus.length) return;
    if (audioRef.current && audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    let pool = [];
    if (ctx.startsWith('category:')) { const cat = ctx.replace('category:', ''); pool = sortByTrending(mus.filter(s => (s.categorie || s.category || s.genre) === cat)); }
    else { pool = mus; }
    const idx = pool.findIndex(s => s._id === cur?._id);
    setCurrentSong(pool[(idx - 1 + pool.length) % pool.length]);
    setIsPlaying(true);
  }, []);

  useMediaSession(currentSong, isPlaying, { onPlay: () => setIsPlaying(true), onPause: () => setIsPlaying(false), onNext: handleNext, onPrev: handlePrev });

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd  = () => { if (repeatModeRef.current === 2) { audio.currentTime = 0; audio.play(); } else handleNext(); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onMeta); audio.removeEventListener('ended', onEnd); };
  }, [handleNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.src) return;
    let blobUrl = null;
    getCachedUrl(currentSong).then(resolvedUrl => {
      if (resolvedUrl.startsWith('blob:')) blobUrl = resolvedUrl;
      audio.src = resolvedUrl;
      audio.playbackRate = playbackRate;
      audio.load();
      playCountedRef.current = false;
      if (isPlaying) { audioContextRef.current?.ctx?.resume(); audio.play().catch(() => {}); }
    });
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    if (isPlaying) { audioContextRef.current?.ctx?.resume(); audio.play().catch(() => {}); }
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (["INPUT", "TEXTAREA"].includes(tag) || e.target.isContentEditable) return;
      switch (e.code) {
        case "Space":       e.preventDefault(); setIsPlaying(p => !p); break;
        case "ArrowRight":  handleNext(); break;
        case "ArrowLeft":   handlePrev(); break;
        case "ArrowUp":     e.preventDefault(); setVolume(v => Math.min(v + 5, 100)); break;
        case "ArrowDown":   e.preventDefault(); setVolume(v => Math.max(v - 5, 0)); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; localStorage.setItem('moozik_volume', volume); }, [volume]);

  useEffect(() => {
    if (sleepRef.current) clearInterval(sleepRef.current);
    if (sleepTimer > 0) {
      setSleepRemaining(sleepTimer * 60);
      sleepRef.current = setInterval(() => {
        setSleepRemaining(prev => { if (prev <= 1) { clearInterval(sleepRef.current); setIsPlaying(false); setSleepTimer(0); return null; } return prev - 1; });
      }, 1000);
    }
    return () => clearInterval(sleepRef.current);
  }, [sleepTimer]);

  useEffect(() => { if (currentSong?._id) localStorage.setItem('moozik_last_song_id', currentSong._id); }, [currentSong?._id]);

  useEffect(() => { if (isPlaying && currentSong) startTimeRef.current = Date.now(); }, [isPlaying, currentSong?._id]);

  const recordPlay = async (song) => {
    if (!song?._id || !startTimeRef.current) return;
    const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
    startTimeRef.current = null;
    try { await fetch(`${API}/songs/${song._id}/play`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ duration: dur }) }); } catch {}
  };
  useEffect(() => { return () => { recordPlay(currentSong); }; }, [currentSong?._id]);

  const formatTime = (t) => isNaN(t) ? '0:00' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  if (isLoading && musiques.length === 0) return <LoadingScreen message="Chargement de votre musique" />;

  // ── Computed ───────────────────────────────────────────────────
  const isLoggedIn = isAdmin || isArtist || isUser;
  const canUpload  = isAdmin || isArtist;
  const roleBgClass = isAdmin ? 'bg-red-600' : isArtist ? 'bg-purple-600' : 'bg-blue-600';

  const navLinksCommon = [
    { to: '/',                  icon: <Home size={16}/>,     label: 'Accueil' },
    { to: '/favorites',         icon: <Heart size={16} className={musiques.some(s => s.liked) ? 'text-red-500' : ''} fill={musiques.some(s => s.liked) ? 'red' : 'none'}/>, label: 'Favoris' },
    { to: '/public-playlists',  icon: <Globe size={16}/>,    label: 'Playlists' },
    { to: '/artists-list',      icon: <Mic2 size={16}/>,     label: 'Artistes' },
    { to: '/trending',          icon: <Flame size={16}/>,    label: 'Trending' },
    { to: '/events',            icon: <Ticket size={16}/>,   label: 'Événements' },
    { to: '/premium',           icon: <Crown size={16}/>,    label: isPremium ? '✨ Premium' : 'Premium' },
    { to: '/library',           icon: <Download size={16}/>, label: 'Téléchargements' },
  ];
  const navLinksUser = isLoggedIn ? [
    { to: '/history',         icon: <History size={16}/>,   label: 'Historique' },
    { to: '/recommendations', icon: <Sparkles size={16}/>,  label: 'Pour vous' },
    { to: '/notifications',   icon: <Bell size={16}/>,      label: 'Notifications' },
    { to: '/account',         icon: <Settings size={16}/>,  label: 'Mon compte' },
    { to: '/sessions',        icon: <Shield size={16}/>,    label: 'Sessions' },
    { to: '/settings',        icon: <Sliders size={16}/>,   label: 'Paramètres' },
  ] : [];
  const navLinksArtist = isArtist ? [
    { to: '/my-albums',        icon: <Disc3 size={16}/>,  label: 'Mes Albums' },
    { to: '/artist-dashboard', icon: <Star size={16}/>,   label: 'Espace Artiste' },
  ] : [];
  const navLinksAdmin = isAdmin ? [
    { to: '/dashboard',             icon: <BarChart2 size={16}/>,   label: 'Dashboard' },
    { to: '/admin-library',         icon: <Music size={16}/>,       label: 'Bibliothèque' },
    { to: '/admin-artists',         icon: <Mic2 size={16}/>,        label: 'Gérer artistes' },
    { to: '/admin-users',           icon: <Users size={16}/>,       label: 'Utilisateurs' },
    { to: '/admin-certifications',  icon: <CheckCircle size={16}/>, label: 'Certifications' },
    { to: '/admin-monetisation',    icon: <DollarSign size={16}/>,  label: 'Monétisation' },
    { to: '/admin-studio',          icon: <Zap size={16}/>,         label: 'Admin Studio' },
    { to: '/admin-team',            icon: <Shield size={16}/>,      label: 'Équipe Admin' },
  ] : [];

  const songProps = {
    currentSong, setCurrentSong, setIsPlaying, isPlaying,
    playSong,
    toggleLike, addToQueue, token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId, userId,
    playlists, userPlaylists,
    onAddToUserPlaylist: ajouterAUserPlaylist,
    ajouterAPlaylist,
    onDeleted: deleteSong,
    onRefresh: chargerMusiques,
    onTogglePlaylistVisibility: togglePlaylistVisibility,
    onInfiniteRadio: handleInfiniteRadio,
    playAll,
    playByCategory: (song) => playByCategory(song, musiques),
  };






  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col pb-16 sm:pb-20 h-screen bg-black text-white font-sans overflow-hidden">

      <OfflineBanner isOnline={isOnline} wasOffline={wasOffline} />

      {/* ════════ MODALS ════════ */}
      {showLoginModal     && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
      {sessionExpiredMsg && (
        <SessionExpiredToast
          message={sessionExpiredMsg}
          onClose={() => setSessionExpiredMsg('')}
          onLogin={() => setShowLoginModal(true)}
        />
      )}
      {showUpload         && <UploadModal token={token} artists={artists} albums={albums} onClose={() => setShowUpload(false)} onSuccess={chargerMusiques} userRole={userRole} userArtistId={userArtistId} userNom={userNom} />}
      {showCreatePlaylist && <CreatePlaylistModal token={token} onClose={() => setShowCreatePlaylist(false)} onSuccess={() => chargerUserPlaylists(token)} />}
      {showListenParty   && <ListenPartyModal token={token} isLoggedIn={isLoggedIn} currentSong={currentSong} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} isPlaying={isPlaying} onClose={() => setShowListenParty(false)} />}

      {/* ════════ HEADER DESKTOP (fixe, z-50) ════════ */}
      <MoozikHeader
        navigate={navigate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoggedIn={isLoggedIn}
        userNom={userNom}
        userEmail={userEmail}
        userRole={userRole}
        userAvatar={userAvatar}
        unreadNotifs={unreadNotifs}
        isPremium={isPremium}
        isOnline={isOnline}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onImport={() => setShowUpload(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        canUpload={canUpload}
      />

      {/* ════════ HEADER MOBILE (fixe) ════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950/98 backdrop-blur-xl border-b border-zinc-800/60 flex flex-col">
        <div className="flex items-center h-14 px-4 gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center"><Music size={14}/></div>
            <span className="text-lg font-black italic">MOOZIK</span>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" size={12}/>
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-7 pr-7 text-xs focus:ring-1 ring-red-600 outline-none placeholder-zinc-600"/>
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X size={12}/></button>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isLoggedIn && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-zinc-900/80">
                <Link to="/notifications"><Bell size={16}/></Link>
                <Link to="/settings"><Sliders size={16}/></Link>
              </div>
            )}
            {isLoggedIn ? (
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1.5 transition">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black overflow-hidden ${roleBgClass}`}>
                  {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt=""/> : (userNom || '?')[0].toUpperCase()}
                </div>
                <ChevronDown size={11} className={`text-zinc-500 transition ${showMobileMenu ? 'rotate-180' : ''}`}/>
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="bg-red-600 hover:bg-red-500 rounded-full px-3 py-1.5 text-xs font-bold transition flex items-center gap-1">
                <LogIn size={12}/> Connexion
              </button>
            )}
          </div>
        </div>
        {/* Scroll tabs mobile */}
        <div className="flex overflow-x-auto px-2 pb-2 gap-1" style={{ scrollbarWidth: 'none' }}>
          {[...navLinksCommon, ...(isLoggedIn ? [{ label: 'Party', icon: <Radio size={14}/>, onClick: () => setShowListenParty(true) }] : [])].map((link, i) =>
            link.onClick ? (
              <button key={i} onClick={link.onClick} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition">
                {link.icon} {link.label}
              </button>
            ) : (
              <Link key={link.to} to={link.to} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition">
                {link.icon} {link.label}
              </Link>
            )
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {showMobileMenu && isLoggedIn && (
        <>
          <div className="fixed inset-0 z-[35]" onClick={() => setShowMobileMenu(false)}/>
          <div className="md:hidden fixed top-[88px] right-0 left-0 z-[36] bg-zinc-950 border-b border-zinc-800 shadow-2xl max-h-[70vh] overflow-y-auto">
            {navLinksUser.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                {link.icon} {link.label}
              </Link>
            ))}
            {isArtist && navLinksArtist.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-purple-400 hover:text-white hover:bg-zinc-800 transition">
                {link.icon} {link.label}
              </Link>
            ))}
            {isAdmin && (
              <div className="border-b border-zinc-800">
                {navLinksAdmin.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-white hover:bg-zinc-800 transition">
                    {link.icon} {link.label}
                  </Link>
                ))}
              </div>
            )}
            {isUser && userPlaylists.length > 0 && (
              <div className="border-b border-zinc-800">
                <div className="flex items-center justify-between px-4 py-2">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Mes playlists</p>
                  <button onClick={() => { setShowCreatePlaylist(true); setShowMobileMenu(false); }} className="text-zinc-600 hover:text-white transition"><Plus size={13}/></button>
                </div>
                {userPlaylists.map(p => (
                  <Link key={p._id} to={`/my-playlist/${p._id}`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                    {p.isPublic ? <Globe size={11} className="text-green-400"/> : <Lock size={11} className="text-zinc-600"/>} {p.nom}
                  </Link>
                ))}
              </div>
            )}
            <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition">
              <LogOut size={15}/> Déconnexion
            </button>
          </div>
        </>
      )}

      {/* ════════ BODY : sidebar + main + panel droit ════════ */}
      {/* mt-16 compense le header fixe (h-16) sur desktop */}
      <div className="flex flex-1 overflow-hidden md:mt-16">

{/* ─── SIDEBAR GAUCHE DESKTOP ─── */}
<nav className="
  hidden md:flex w-56 flex-col gap-0.5 p-3 shrink-0
  bg-[#0e0f14] border-r border-white/[0.04]
  overflow-y-auto
  [scrollbar-width:thin]
  [scrollbar-color:rgba(220,38,38,0.3)_transparent]
  [&::-webkit-scrollbar]:w-[3px]
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-thumb]:bg-red-600/30
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb:hover]:bg-red-500/50
">

  {navLinksCommon.map(link => <NavLink key={link.to} {...link} />)}

  {isLoggedIn && (
    <>
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em] px-3 pt-4 pb-1">
        Mon espace
      </p>
      {navLinksUser.map(link => <NavLink key={link.to} {...link} />)}
    </>
  )}

  {isArtist && (
    <>
      <p className="text-[9px] font-bold text-purple-800/80 uppercase tracking-[0.15em] px-3 pt-4 pb-1">
        Artiste
      </p>
      {navLinksArtist.map(link => (
        <NavLink key={link.to} {...link} colorClass="text-purple-400 hover:text-white" />
      ))}
    </>
  )}

  {isAdmin && (
    <>
      <p className="text-[9px] font-bold text-red-900/80 uppercase tracking-[0.15em] px-3 pt-4 pb-1">
        Admin
      </p>
      {navLinksAdmin.map(link => (
        <NavLink key={link.to} {...link} colorClass="text-red-400 hover:text-white" />
      ))}
    </>
  )}

  {canUpload && (
    <button
      onClick={() => setShowUpload(true)}
      className="
        flex items-center gap-2.5 mt-2 px-3 py-2.5 w-full text-left
        rounded-xl border border-dashed border-zinc-800
        text-zinc-500 text-xs font-semibold
        transition-all duration-200
        hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20
        hover:shadow-[0_0_12px_rgba(220,38,38,0.08)]
      "
    >
      <Plus size={14} className="shrink-0" />
      <span>Ajouter musique</span>
    </button>
  )}

  {isLoggedIn && (
    <button
      onClick={() => setShowListenParty(true)}
      className="
        flex items-center gap-2.5 mt-1 px-3 py-2 w-full text-left
        rounded-xl text-zinc-500 text-sm
        transition-all duration-200
        hover:text-blue-300 hover:bg-blue-950/20
      "
    >
      <Radio size={14} className="text-blue-400 shrink-0" />
      Listen Party
    </button>
  )}

  {/* Playlists admin */}
  {isAdmin && playlists.length > 0 && (
    <div className="border-t border-white/[0.05] mt-3 pt-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em]">
          Playlists admin
        </span>
        <button
          onClick={creerPlaylist}
          className="p-0.5 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition duration-150"
        >
          <Plus size={11} />
        </button>
      </div>
      <div className="space-y-0.5 max-h-32 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {playlists.map(p => (
          <div key={p._id} className="flex items-center group rounded-lg">
            <Link
              to={`/playlist/${p._id}`}
              className="
                flex-1 text-xs text-zinc-500 hover:text-white truncate
                py-1.5 px-3 rounded-lg hover:bg-white/[0.05]
                transition-all duration-150
              "
            >
              <span className="text-zinc-700">#</span> {p.nom}
            </Link>
            <button
              onClick={() => supprimerPlaylist(p._id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 mr-1 transition duration-150"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Playlists user */}
  {isUser && (
    <div className="border-t border-white/[0.05] mt-3 pt-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em]">
          Mes playlists
        </span>
        <button
          onClick={() => setShowCreatePlaylist(true)}
          className="p-0.5 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition duration-150"
        >
          <Plus size={11} />
        </button>
      </div>
      <div className="space-y-0.5 max-h-40 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {userPlaylists.length === 0
          ? <p className="text-[10px] text-zinc-700 px-3 italic">Aucune playlist...</p>
          : userPlaylists.map(p => (
            <div key={p._id} className="flex items-center group rounded-lg">
              <Link
                to={`/my-playlist/${p._id}`}
                className="
                  flex-1 flex items-center gap-2 text-xs text-zinc-500
                  hover:text-white truncate py-1.5 px-3 rounded-lg
                  hover:bg-white/[0.05] transition-all duration-150
                "
              >
                {p.isPublic
                  ? <Globe size={9} className="text-emerald-500 shrink-0" />
                  : <Lock size={9} className="text-zinc-700 shrink-0" />
                }
                {p.nom}
              </Link>
              <button
                onClick={() => supprimerUserPlaylist(p._id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 mr-1 transition duration-150"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))
        }
      </div>
    </div>
  )}

</nav>

        {/* ─── MAIN CONTENT ─── */}
        <main
          className={`flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black p-4 md:p-7 pb-40 pt-30 md:pt-7 transition-all duration-300 ${showQueue ? 'md:mr-72 xl:mr-80' : ''}`}
          onClick={() => setActiveMenu(null)}
        >
          <Routes>
            <Route path="/player" element={
              <Suspense fallback={<ViewLoader/>}><FullPlayerPage
                currentSong={currentSong} setCurrentSong={setCurrentSong}
                isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                currentTime={currentTime} duration={duration}
                handleNext={handleNext} handlePrev={handlePrev}
                isShuffle={isShuffle} setIsShuffle={setIsShuffle}
                repeatMode={repeatMode} setRepeatMode={setRepeatMode}
                toggleLike={toggleLike} volume={volume} setVolume={setVolume}
                queue={queue} setQueue={setQueue} musiques={musiques}
                audioRef={audioRef} initAudioEngine={initAudioEngine}
                audioContextRef={audioContextRef} eqGains={eqGains}
                setEqGains={setEqGains} eqFiltersRef={eqFiltersRef}
                playbackRate={playbackRate} setPlaybackRate={setPlaybackRate}
                sleepTimer={sleepTimer} setSleepTimer={setSleepTimer}
                sleepRemaining={sleepRemaining} formatTime={formatTime}
                canvasRef={canvasRef} token={token} isLoggedIn={isLoggedIn}
                userId={userId} isAdmin={isAdmin}
                onOpenListenParty={() => setShowListenParty(true)}
                smartMode={smartMode} setSmartMode={setSmartMode}
              /></Suspense>
            }/>
            <Route path="/favorites"         element={<Suspense fallback={<ViewLoader/>}><FavoritesView musiques={musiques} {...songProps} isPlaying={isPlaying} setQueue={setQueue} playAll={playAll} /></Suspense>}/>
            <Route path="/playlist/:id"      element={<Suspense fallback={<ViewLoader/>}><PlaylistView playlists={playlists} {...songProps} playAll={playAll}  /></Suspense>}/>
            <Route path="/my-playlist/:id"   element={<Suspense fallback={<ViewLoader/>}><UserPlaylistView token={token} {...songProps} isOwner={isUser || isAdmin} playAll={playAll} setQueue={setQueue} /></Suspense>}/>
            <Route path="/artist/:id"        element={<Suspense fallback={<ViewLoader/>}><ArtistView {...songProps} playAll={playAll} setQueue={setQueue} /></Suspense>}/>
            <Route path="/album/:id"         element={<Suspense fallback={<ViewLoader/>}><AlbumView {...songProps} isArtist={isArtist} isAdmin={isAdmin} userArtistId={userArtistId} playAll={playAll} /></Suspense>}/>
            <Route path="/my-albums"         element={<Suspense fallback={<ViewLoader/>}><MyAlbumsView token={token} userArtistId={userArtistId} userNom={userNom} /></Suspense>}/>
            <Route path="/artists-list"      element={<Suspense fallback={<ViewLoader/>}><ArtistsListView artists={artists} /></Suspense>}/>
            <Route path="/public-playlists"  element={<Suspense fallback={<ViewLoader/>}><PublicPlaylistsView {...songProps} /></Suspense>}/>
            <Route path="/dashboard"         element={isAdmin ? <Suspense fallback={<ViewLoader/>}><DashboardView token={token}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/admin-artists"     element={isAdmin ? <Suspense fallback={<ViewLoader/>}><ArtistsAdminView token={token}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/admin-users"       element={isAdmin ? <Suspense fallback={<ViewLoader/>}><UsersAdminView token={token} musiques={musiques}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/admin-library"     element={isAdmin ? <Suspense fallback={<ViewLoader/>}><AdminLibraryView token={token} currentSong={currentSong} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} isPlaying={isPlaying}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/admin-certifications" element={isAdmin ? <Suspense fallback={<ViewLoader/>}><AdminCertificationsView token={token}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/admin-monetisation"   element={isAdmin ? <AdminMonetisationView token={token}/> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/profile/:userId"   element={<Suspense fallback={<ViewLoader/>}><PublicProfileView token={token} currentSong={currentSong} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} isPlaying={isPlaying}/></Suspense>}/>
            <Route path="/history"           element={isLoggedIn ? <HistoryView token={token} currentSong={currentSong} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}/> : <div className="p-8 text-zinc-500">Connectez-vous</div>}/>
            <Route path="/recommendations"   element={<RecommendationsView token={token} currentSong={currentSong} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} isPlaying={isPlaying}/>}/>
            <Route path="/share/:shareToken" element={<Suspense fallback={<ViewLoader/>}><SharePageView setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}/></Suspense>}/>
            <Route path="/notifications"     element={isLoggedIn
              ? <div className="w-full mx-auto py-6"><h1 className="text-xl font-black mb-6 flex items-center gap-2"><Bell size={20} className="text-red-400"/> Notifications</h1><NotificationsPanel token={token} isPage={true} onPlaySong={(sid) => { const s = musiques.find(m => m._id === sid); if (s) playSong(s); }}/></div>
              : <div className="p-8 text-zinc-500">Connectez-vous</div>
            }/>
            <Route
              path="/sessions"
              element={isLoggedIn
                ? <Suspense fallback={<ViewLoader/>}><SessionsView /></Suspense>
                : <div className="p-8 text-zinc-500">Connectez-vous</div>
              }
            />
            <Route path="/settings"          element={<Suspense fallback={<ViewLoader/>}><SettingsView token={token} isAdmin={isAdmin} isLoggedIn={isLoggedIn} userNom={userNom} userEmail={userEmail} userRole={userRole} isPrimary={isPrimary} musiques={musiques} isAudioCached={isAudioCached} cachedIds={cachedIds} cacheAudio={cacheAudio} removeCached={removeCached}/></Suspense>}/>
            <Route path="/account"           element={isLoggedIn ? <Suspense fallback={<ViewLoader/>}><AccountView token={token} userNom={userNom} userEmail={userEmail} userRole={userRole} userId={userId} userArtistId={userArtistId} isAdmin={isAdmin} isArtist={isArtist} isUser={isUser} musiques={musiques} userPlaylists={userPlaylists} onUpdateProfile={handleUpdateProfile} isLoggedIn={isLoggedIn}/></Suspense> : <div className="p-8 text-zinc-600">Connectez-vous</div>}/>
            <Route path="/premium"           element={<Suspense fallback={<ViewLoader/>}><SubscriptionView token={token} isLoggedIn={isLoggedIn}/></Suspense>}/>
            <Route path="/events"            element={<EventsView token={token} isLoggedIn={isLoggedIn} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong}/>}/>
            <Route path="/trending"          element={<TrendingView setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} isPlaying={isPlaying} token={token} musiques={musiques}/>}/>
            <Route path="/a/:slug"           element={<Suspense fallback={<ViewLoader/>}><SmartLinkPage token={token} isLoggedIn={isLoggedIn} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} isPlaying={isPlaying}/></Suspense>}/>
            <Route path="/artist-dashboard"  element={isArtist ? <Suspense fallback={<ViewLoader/>}><ArtistDashboard token={token} userArtistId={userArtistId} userNom={userNom}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/reset-password"    element={<Suspense fallback={<ViewLoader/>}><ResetPassword /></Suspense>}/>
            <Route path="/verify-email"      element={<Suspense fallback={<ViewLoader/>}><VerifyEmail /></Suspense>}/>
            <Route path="/admin-studio"      element={isAdmin ? <Suspense fallback={<ViewLoader/>}><AdminArtistView token={token} adminId={userId} adminNom={userNom}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/admin-team"        element={isAdmin ? <Suspense fallback={<ViewLoader/>}><AdminTeamView token={token} currentAdminId={userId} isPrimary={isPrimary}/></Suspense> : <div className="p-8 text-zinc-600">Accès refusé</div>}/>
            <Route path="/library"           element={<Suspense fallback={<ViewLoader/>}><OfflineLibraryView musiques={musiques} currentSong={currentSong} setIsPlaying={setIsPlaying} setCurrentSong={setCurrentSong} isPlaying={isPlaying} isAudioCached={isAudioCached} removeCached={removeCached} /></Suspense>}/>
            <Route path="/" element={
              <>
              <UserGreeting
                userNom={userNom}
                isLoggedIn={isLoggedIn}
                newSongsCount={musiques.filter(s => Date.now() - new Date(s.createdAt) < 604800000).length}
                lastArtist={musiques[0]?.artiste}
                streak={7}
              />
              <HomeView musiques={musiques} {...songProps}
                isAdmin={isAdmin} isArtist={isArtist} isUser={isUser}
                userArtistId={userArtistId} playlists={playlists} userPlaylists={userPlaylists}
                token={token} activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                ajouterAPlaylist={ajouterAPlaylist}
                dragOverId={dragOverId} dragSongId={dragSongId}
                handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
                setShowEQ={setShowEQ} initAudioEngine={initAudioEngine}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} setShowUpload={setShowUpload}
                onAddToUserPlaylist={ajouterAUserPlaylist}
                userId={userId} onDeleted={deleteSong} onRefresh={chargerMusiques}
                onTogglePlaylistVisibility={togglePlaylistVisibility}
                isAudioCached={isAudioCached} cachedIds={cachedIds}
                playAll={playAll} onInfiniteRadio={handleInfiniteRadio}
                cacheAudio={cacheAudio} removeCached={removeCached}
              />
              </>
            }/>
          </Routes>

          {/* ── Sentinel infinite scroll ── */}
          <div ref={loaderRef} style={{ height: 1 }} />
          {isFetchingMore && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#52525b', fontSize: 13 }}>
              Chargement…
            </div>
          )}
        </main>

        {/* ─── PANEL DROIT (Tendances + File d'attente) ─── */}
        <MoozikRightPanel
          musiques={musiques}
          queue={queue}
          setQueue={setQueue}
          currentSong={currentSong}
          setCurrentSong={setCurrentSong}
          setIsPlaying={setIsPlaying}
          isPlaying={isPlaying}
          visible={showQueue}
        />

      </div>{/* fin body */}

      {/* ════════ EQ MODAL ════════ */}
      {showEQ && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic flex items-center gap-2"><Sliders className="text-red-600"/> ÉGALISEUR</h3>
              <button onClick={() => setShowEQ(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition"><X size={20}/></button>
            </div>
            <div className="flex gap-2 flex-wrap mb-6">
              {Object.keys(eqPresets).map(name => (
                <button key={name} onClick={() => applyPreset(name)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${activePreset === name ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>{name}</button>
              ))}
            </div>
            {(() => {
              const BANDS = ['32','64','125','250','500','1k','2k','4k','8k','10k','14k','16k'];
              return (
                <div className="flex items-end justify-between gap-1 mb-2" style={{ height: 160 }}>
                  {BANDS.map((label, idx) => {
                    const gain = eqGains[idx] ?? 0;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-zinc-500 text-[10px] font-mono tabular-nums" style={{ minWidth: 28, textAlign: 'center' }}>{gain > 0 ? `+${gain}` : gain}</span>
                        <div className="relative flex-1 w-full flex justify-center" style={{ height: 108 }}>
                          <input type="range" orient="vertical" min="-12" max="12" step="1" value={gain}
                            onChange={e => setEqBand(idx, parseInt(e.target.value))}
                            className="appearance-none cursor-pointer accent-red-600"
                            style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 20, height: 108, background: 'transparent' }}
                          />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-bold">{label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="flex justify-between text-[10px] text-zinc-600 font-mono mb-6 px-1">
              <span>+12</span><span>0</span><span>−12</span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Gauge size={12}/> Vitesse</span>
                  <span className="text-zinc-400">{playbackRate}×</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.25" value={playbackRate} className="w-full h-1.5 accent-purple-500 bg-zinc-800 rounded-lg appearance-none cursor-pointer" onChange={e => setPlaybackRate(parseFloat(e.target.value))}/>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Timer size={12}/> Timer</span>
                  {sleepRemaining && <span className="text-green-400">{Math.floor(sleepRemaining/60)}:{String(sleepRemaining%60).padStart(2,'0')}</span>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[0,15,30,45,60].map(m => (
                    <button key={m} onClick={() => setSleepTimer(m)} className={`px-2 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${sleepTimer===m ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                      {m===0 ? 'Off' : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={resetEQ} className="w-full mt-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition">Réinitialiser</button>
          </div>
        </div>
      )}

      {/* ════════ PLAYER BAR DESKTOP ════════ */}
{currentSong && (
  <footer className="hidden sm:block fixed bottom-0 left-0 right-0 bg-zinc-950/98 border-t border-zinc-800/60 backdrop-blur-xl z-40">

    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-0.5 opacity-70 pointer-events-none" width="1000" height="4"/>

    {/* ── Ligne unique : info | contrôles+barre | actions ── */}
    <div className="flex items-center gap-3 px-4 h-16 sm:h-[72px]">

      {/* LEFT — Pochette + titre */}
      <button
        onClick={() => navigate('/player')}
        className="flex items-center gap-3 min-w-0 w-[220px] shrink-0 hover:opacity-80 transition text-left"
      >
        <div className="relative shrink-0">
          <img src={currentSong.image} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt=""/>
          {isPlaying && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse"/>}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold truncate text-zinc-200">{currentSong.titre}</div>
          <div className="text-[10px] text-zinc-500 truncate">{currentSong.artiste}</div>
        </div>
      </button>

      {/* CENTER — Boutons + barre sur une seule colonne, flex-1 */}
      <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">

        {/* Boutons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Shuffle
            onClick={() => setIsShuffle(!isShuffle)}
            size={14}
            className={`cursor-pointer transition hidden sm:block ${isShuffle ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}
          />
          <SkipBack onClick={handlePrev} size={18} className="text-zinc-400 cursor-pointer hover:text-white transition"/>
          <button
            onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
            className="w-9 h-9 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg shrink-0"
          >
            {isPlaying ? <Pause fill="white" size={15}/> : <Play fill="white" size={15}/>}
          </button>
          <SkipForward onClick={handleNext} size={18} className="text-zinc-400 cursor-pointer hover:text-white transition"/>
          <button
            onClick={() => setRepeatMode(m => (m+1)%3)}
            className={`cursor-pointer transition hidden sm:block ${repeatMode > 0 ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}
          >
            {repeatMode === 2 ? <Repeat1 size={14}/> : <Repeat size={14}/>}
          </button>
        </div>

        {/* Barre de progression + temps */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 w-7 text-right shrink-0 tabular-nums">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-zinc-700 rounded-full cursor-pointer relative group"
            onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              if (audioRef.current) audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
            }}
          >
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 w-7 shrink-0 tabular-nums">{formatTime(duration)}</span>
        </div>

      </div>

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {listeners.length > 0 && (
          <div className="hidden lg:block">
            <ListenersWidget listeners={listeners} connected={connected}/>
          </div>
        )}
        <button onClick={() => toggleLike(currentSong._id)} className="hidden sm:flex p-1.5 hover:bg-zinc-800 rounded-lg transition text-zinc-600 hover:text-white">
          <Heart size={14} fill={currentSong.liked ? '#ef4444' : 'none'} className={currentSong.liked ? 'text-red-500' : ''}/>
        </button>
        <CacheButton song={currentSong} cacheAudio={cacheAudio} removeCached={removeCached} isAudioCached={isAudioCached}/>
        <button
          onClick={() => setShowListenParty(true)}
          className="hidden md:flex p-1.5 hover:bg-zinc-800 rounded-lg transition text-zinc-600 hover:text-blue-400"
          title="Listen Party"
        >
          <Radio size={14}/>
        </button>
        <button
          onClick={() => { initAudioEngine(); navigate('/player'); }}
          className="hidden md:flex p-1.5 hover:bg-zinc-800 rounded-lg transition text-zinc-600 hover:text-white"
        >
          <Maximize2 size={14}/>
        </button>
        <Sliders
          onClick={() => { initAudioEngine(); setShowEQ(true); }}
          size={14}
          className="cursor-pointer hidden sm:block transition text-zinc-600 hover:text-red-500"
        />
        <ListOrdered
          onClick={() => setShowQueue(!showQueue)}
          size={14}
          className={`cursor-pointer hidden sm:block transition ${showQueue ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}
        />
        <div className="hidden md:flex items-center gap-2">
          <Volume2 size={14} className="text-zinc-600 shrink-0"/>
          <input
            type="range"
            value={volume}
            className="w-20 accent-red-600 h-1 cursor-pointer rounded-lg appearance-none bg-zinc-700"
            onChange={e => setVolume(parseInt(e.target.value))}
          />
        </div>
      </div>

    </div>
  </footer>
)}

      {/* ════════ MINI PLAYER MOBILE ════════ */}
<MiniPlayerMobile
  currentSong={currentSong}
  isPlaying={isPlaying}
  setIsPlaying={setIsPlaying}
  handleNext={handleNext}
  toggleLike={toggleLike}
  onOpenFullPlayer={() => navigate('/player')}
  currentTime={currentTime}
  duration={duration}
  initAudioEngine={initAudioEngine}
  audioRef={audioRef}
  cacheAudio={cacheAudio}
  removeCached={removeCached}
  isAudioCached={isAudioCached}
/>

      {/* ════════ RADIO VIEW ════════ */}
      {showRadio && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRadio(false)}/>
          <div className="relative ml-auto w-full h-full bg-zinc-950 border-l border-zinc-800/60 shadow-2xl flex flex-col overflow-hidden">
            <Suspense fallback={<ViewLoader/>}><RadioView token={token} currentSong={currentSong} setCurrentSong={setCurrentSong} isPlaying={isPlaying} setIsPlaying={setIsPlaying} musiques={musiques} onClose={() => setShowRadio(false)}/></Suspense>
          </div>
        </div>
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const MoozikWeb = () => (
  <Router>
    <AppInner />
  </Router>
);

export default MoozikWeb;