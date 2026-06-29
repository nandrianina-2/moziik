/**
 * RadioView.jsx — Page Radio IA MOOZIK (v2)
 * - UI repensée : layout cinématique, plein écran responsive
 * - Filtres moods intelligents avec tous les moods affichés
 * - Algorithme de scoring mood amélioré
 * - Lucide React pour toutes les icônes
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Radio, Play, Pause, SkipForward, Heart,
  X, Sparkles, Shuffle, ChevronRight, Mic2,
  Zap, WifiOff, RefreshCw, StopCircle, ListMusic,
  Music2, Flame, Waves, Target, PartyPopper,
  Sunrise, Flower2, Church, Dice6, Coffee,
  Headphones, Moon, Sun, Dumbbell, Leaf,
  Smile, Drum, Guitar, Piano, CloudRain,
  Star, Wind, Compass, Clock, BarChart3,
  ChevronDown, ChevronUp, Check, SlidersHorizontal,
} from 'lucide-react';
import { API } from '../config/api';

// ════════════════════════════════════════════════════════════
// TOUS LES MOODS — étendu avec scoring
// ════════════════════════════════════════════════════════════

const ALL_MOODS = [
  // Groupe Énergie
  {
    id: 'energie',   label: 'Énergie',   group: 'Énergie',
    icon: Flame,     emoji: '⚡',
    gradient: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300',
    keywords: ['energie', 'energique', 'dynamique', 'pump', 'boost'],
    scoreBoost: { danceability: 0.9, energy: 1.0, valence: 0.7 },
  },
  {
    id: 'workout',   label: 'Workout',   group: 'Énergie',
    icon: Dumbbell,  emoji: '💪',
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300',
    keywords: ['sport', 'workout', 'gym', 'fitness', 'training'],
    scoreBoost: { energy: 1.0, danceability: 0.8, tempo: 'fast' },
  },
  {
    id: 'fete',      label: 'Fête',      group: 'Énergie',
    icon: PartyPopper, emoji: '🎉',
    gradient: 'from-pink-500 to-fuchsia-500',
    bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-300',
    keywords: ['fete', 'party', 'dance', 'club', 'soiree'],
    scoreBoost: { danceability: 1.0, energy: 0.9, valence: 1.0 },
  },
  {
    id: 'afrobeat',  label: 'Afrobeat',  group: 'Énergie',
    icon: Drum,      emoji: '🥁',
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300',
    keywords: ['afrobeat', 'afro', 'africain', 'groove'],
    scoreBoost: { danceability: 0.95, energy: 0.85, valence: 0.8 },
  },
  // Groupe Calme
  {
    id: 'chill',     label: 'Chill',     group: 'Calme',
    icon: Waves,     emoji: '🌊',
    gradient: 'from-sky-500 to-cyan-500',
    bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-300',
    keywords: ['chill', 'relaxe', 'cool', 'detendu', 'laid-back'],
    scoreBoost: { energy: 0.3, acousticness: 0.7, valence: 0.6 },
  },
  {
    id: 'lofi',      label: 'Lo-Fi',     group: 'Calme',
    icon: Coffee,    emoji: '☕',
    gradient: 'from-stone-500 to-amber-700',
    bg: 'bg-stone-500/10', border: 'border-stone-500/30', text: 'text-stone-300',
    keywords: ['lofi', 'lo-fi', 'study', 'cafe', 'ambiant'],
    scoreBoost: { energy: 0.2, acousticness: 0.9, instrumentalness: 0.8 },
  },
  {
    id: 'sommeil',   label: 'Sommeil',   group: 'Calme',
    icon: Moon,      emoji: '🌙',
    gradient: 'from-indigo-700 to-violet-900',
    bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300',
    keywords: ['sommeil', 'sleep', 'nuit', 'calme', 'dodo'],
    scoreBoost: { energy: 0.1, acousticness: 1.0, tempo: 'slow' },
  },
  {
    id: 'nature',    label: 'Nature',    group: 'Calme',
    icon: Leaf,      emoji: '🌿',
    gradient: 'from-green-600 to-emerald-700',
    bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300',
    keywords: ['nature', 'vert', 'foret', 'zen', 'organique'],
    scoreBoost: { acousticness: 0.9, energy: 0.3, instrumentalness: 0.7 },
  },
  // Groupe Focus
  {
    id: 'focus',     label: 'Focus',     group: 'Focus',
    icon: Target,    emoji: '🎯',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300',
    keywords: ['focus', 'concentration', 'travail', 'productif'],
    scoreBoost: { energy: 0.5, instrumentalness: 0.8, valence: 0.5 },
  },
  {
    id: 'classique', label: 'Classique', group: 'Focus',
    icon: Piano,     emoji: '🎹',
    gradient: 'from-slate-400 to-zinc-600',
    bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300',
    keywords: ['classique', 'piano', 'orchestral', 'symphonie'],
    scoreBoost: { instrumentalness: 1.0, acousticness: 0.9, energy: 0.3 },
  },
  {
    id: 'jazz',      label: 'Jazz',      group: 'Focus',
    icon: Music2,    emoji: '🎷',
    gradient: 'from-amber-600 to-yellow-800',
    bg: 'bg-amber-600/10', border: 'border-amber-600/30', text: 'text-amber-400',
    keywords: ['jazz', 'blues', 'swing', 'improvisation'],
    scoreBoost: { acousticness: 0.8, instrumentalness: 0.7, energy: 0.4 },
  },
  // Groupe Émotions
  {
    id: 'nostalgie', label: 'Nostalgie', group: 'Émotions',
    icon: Sunrise,   emoji: '🌅',
    gradient: 'from-amber-500 to-rose-500',
    bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300',
    keywords: ['nostalgie', 'retro', 'vintage', 'souvenir', 'throwback'],
    scoreBoost: { valence: 0.4, acousticness: 0.6, energy: 0.4 },
  },
  {
    id: 'romance',   label: 'Romance',   group: 'Émotions',
    icon: Flower2,   emoji: '💕',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300',
    keywords: ['romance', 'amour', 'love', 'romantique', 'couple'],
    scoreBoost: { valence: 0.7, energy: 0.4, acousticness: 0.6 },
  },
  {
    id: 'melancolie',label: 'Mélancolie',group: 'Émotions',
    icon: CloudRain, emoji: '🌧️',
    gradient: 'from-blue-700 to-slate-700',
    bg: 'bg-blue-700/10', border: 'border-blue-700/30', text: 'text-blue-300',
    keywords: ['melancolie', 'triste', 'sad', 'nostalgique', 'introspectif'],
    scoreBoost: { valence: 0.2, energy: 0.3, acousticness: 0.7 },
  },
  {
    id: 'bonne-humeur', label: 'Bonne humeur', group: 'Émotions',
    icon: Smile,     emoji: '😄',
    gradient: 'from-yellow-400 to-lime-500',
    bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'text-yellow-300',
    keywords: ['joie', 'happy', 'bonheur', 'positif', 'feel-good'],
    scoreBoost: { valence: 1.0, energy: 0.7, danceability: 0.7 },
  },
  // Groupe Spirituel / Univers
  {
    id: 'gospel',    label: 'Gospel',    group: 'Spirituel',
    icon: Church,    emoji: '✝️',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300',
    keywords: ['gospel', 'louange', 'worship', 'chretien', 'spirituel'],
    scoreBoost: { valence: 0.8, energy: 0.6, acousticness: 0.5 },
  },
  {
    id: 'acoustique', label: 'Acoustique', group: 'Spirituel',
    icon: Guitar,    emoji: '🎸',
    gradient: 'from-orange-600 to-amber-700',
    bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300',
    keywords: ['acoustique', 'guitar', 'unplugged', 'organique'],
    scoreBoost: { acousticness: 1.0, instrumentalness: 0.6, energy: 0.4 },
  },
  {
    id: 'surprise',  label: 'Surprise',  group: 'Spirituel',
    icon: Dice6,     emoji: '🎲',
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300',
    keywords: [],
    scoreBoost: {},  // random
  },
];

const MOOD_GROUPS = ['Énergie', 'Calme', 'Focus', 'Émotions', 'Spirituel'];

// ════════════════════════════════════════════════════════════
// ALGORITHME DE SCORING MOOD
// ════════════════════════════════════════════════════════════

/**
 * Calcule un score de compatibilité entre une musique et un mood.
 * Score entre 0 et 100.
 */
export function scoreSongForMood(song, moodId) {
  const mood = ALL_MOODS.find(m => m.id === moodId);
  if (!mood) return 50;
  if (moodId === 'surprise') return Math.random() * 100;

  let score = 0;
  let totalWeight = 0;

  // 1. Match des moods déclarés sur la chanson
  const songMoods = (song.moods || []).map(m => m.toLowerCase());
  const keywordMatch = mood.keywords.some(kw =>
    songMoods.some(sm => sm.includes(kw) || kw.includes(sm))
  );
  if (keywordMatch) score += 40;
  totalWeight += 40;

  // 2. Attributs audio (si disponibles)
  const boosts = mood.scoreBoost;
  const audioAttrs = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];

  audioAttrs.forEach(attr => {
    if (boosts[attr] !== undefined && song[attr] !== undefined && typeof boosts[attr] === 'number') {
      const target = boosts[attr];
      const value = song[attr]; // 0-1
      const diff = Math.abs(target - value);
      const attrScore = (1 - diff) * 15;
      score += attrScore;
      totalWeight += 15;
    }
  });

  // 3. Tempo
  if (boosts.tempo) {
    const bpm = song.tempo || song.bpm;
    if (bpm) {
      if (boosts.tempo === 'fast' && bpm >= 120) score += 10;
      if (boosts.tempo === 'slow' && bpm <= 90) score += 10;
    }
    totalWeight += 10;
  }

  // Normaliser sur 100
  if (totalWeight === 0) return 50;
  return Math.round(Math.min(100, (score / totalWeight) * 100));
}

/**
 * Trie une liste de chansons par score de compatibilité mood.
 */
export function sortSongsByMood(songs, moodId) {
  if (!moodId || moodId === 'surprise') return [...songs].sort(() => Math.random() - 0.5);
  return [...songs]
    .map(s => ({ song: s, score: scoreSongForMood(s, moodId) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.song);
}

// ════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ════════════════════════════════════════════════════════════

const WaveVisualizer = ({ isPlaying, color = '#ef4444' }) => (
  <div className="flex items-end gap-[2px] h-5" aria-hidden="true">
    {[3, 5, 8, 5, 3].map((h, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full transition-all duration-300"
        style={{
          height: isPlaying ? `${h * (isPlaying ? 1 : 0.3)}px` : '3px',
          backgroundColor: color,
          animation: isPlaying ? `wave ${0.6 + i * 0.1}s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
        }}
      />
    ))}
    <style>{`
      @keyframes wave {
        from { transform: scaleY(0.4); }
        to { transform: scaleY(1.2); }
      }
    `}</style>
  </div>
);

const DJBubble = ({ comment, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 9000);
    return () => clearTimeout(t);
  }, [comment, onDismiss]);

  if (!comment) return null;
  return (
    <div className="flex items-start gap-3 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent border border-red-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30 ring-2 ring-red-500/20">
        <Mic2 size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse inline-block" />
          DJ MOOZIK IA · LIVE
        </p>
        <p className="text-sm text-zinc-200 leading-relaxed">"{comment}"</p>
      </div>
      <button onClick={onDismiss} className="text-zinc-700 hover:text-zinc-400 transition mt-0.5 shrink-0">
        <X size={13} />
      </button>
    </div>
  );
};

const QueueItem = ({ song, index, isNext }) => (
  <div className={`flex items-center gap-3 px-4 py-3 transition group ${isNext ? 'bg-white/5' : 'hover:bg-white/3'}`}>
    <span className="text-[10px] text-zinc-700 font-mono w-4 shrink-0 text-right tabular-nums">
      {isNext ? '▶' : index + 1}
    </span>
    <div className="relative shrink-0">
      <img src={song.image} className="w-9 h-9 rounded-lg object-cover" alt="" />
      {isNext && (
        <div className="absolute inset-0 rounded-lg bg-red-500/20 flex items-center justify-center">
          <Headphones size={12} className="text-red-300" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-semibold truncate ${isNext ? 'text-white' : 'text-zinc-300'}`}>{song.titre}</p>
      <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
    </div>
    {song.moods?.[0] && (
      <span className="text-[8px] text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded-full truncate max-w-[60px] shrink-0">
        {song.moods[0]}
      </span>
    )}
  </div>
);

// Badge de compatibilité mood
const CompatBadge = ({ score }) => {
  if (!score) return null;
  const color = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-zinc-600';
  return (
    <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${color}`}>
      <BarChart3 size={9} />
      {score}% match
    </span>
  );
};

// Pill mood compact
const MoodPill = ({ mood, selected, onClick, showScore, score }) => {
  const Icon = mood.icon;
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 text-left group ${
        selected
          ? `bg-gradient-to-r ${mood.gradient} bg-opacity-20 ${mood.border} shadow-lg`
          : `bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40`
      }`}
    >
      <span className="text-base shrink-0">{mood.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${selected ? mood.text : 'text-zinc-400 group-hover:text-zinc-200'}`}>
          {mood.label}
        </p>
        {showScore && score !== undefined && <CompatBadge score={score} />}
      </div>
      {selected && (
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Check size={9} className="text-white" />
        </div>
      )}
    </button>
  );
};

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════

const RadioView = ({
  token,
  currentSong,
  setCurrentSong,
  isPlaying,
  setIsPlaying,
  musiques = [],
  onClose,
}) => {
  const [phase, setPhase]               = useState('setup');
  const [sessionId, setSessionId]       = useState(null);
  const [radioName, setRadioName]       = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]); // multi-mood
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [suggestions, setSuggestions]   = useState({ topSongs: [], recent: [], forYou: [] });
  const [queue, setQueue]               = useState([]);
  const [songsPlayed, setSongsPlayed]   = useState(0);
  const [djIntro, setDjIntro]           = useState(null);
  const [djComment, setDjComment]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [loadingNext, setLoadingNext]   = useState(false);
  const [error, setError]               = useState(null);
  const [showQueue, setShowQueue]       = useState(false);
  const [likedIds, setLikedIds]         = useState(new Set());
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [moodScores, setMoodScores]     = useState({});
  const sessionRef = useRef(null);

  // Calcul scores moods si une seed est sélectionnée
  useEffect(() => {
    if (!selectedSeed) { setMoodScores({}); return; }
    const scores = {};
    ALL_MOODS.forEach(m => {
      scores[m.id] = scoreSongForMood(selectedSeed, m.id);
    });
    setMoodScores(scores);
  }, [selectedSeed]);

  // Suggestions filtrées et triées selon moods sélectionnés
  const sortedSuggestions = useMemo(() => {
    const raw = [
      ...suggestions.forYou,
      ...suggestions.topSongs,
      ...suggestions.recent,
    ].filter((s, i, a) => a.findIndex(x => String(x._id) === String(s._id)) === i);

    if (selectedMoods.length === 0) return raw.slice(0, 8);
    // Moyenne des scores sur tous les moods sélectionnés
    return raw
      .map(s => ({
        song: s,
        score: Math.round(selectedMoods.reduce((acc, mId) => acc + scoreSongForMood(s, mId), 0) / selectedMoods.length),
      }))
      .filter(x => x.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(x => ({ ...x.song, _matchScore: x.score }));
  }, [suggestions, selectedMoods]);

  // Chargement suggestions
  useEffect(() => {
    fetch(`${API}/radio/config/suggestions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : {})
      .then(d => setSuggestions({ topSongs: d.topSongs || [], recent: d.recent || [], forYou: d.forYou || [] }))
      .catch(() => {});
  }, [token]);

  // Nettoyage session
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        fetch(`${API}/radio/${sessionRef.current}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => {});
      }
    };
  }, [token]);

  const toggleMood = (moodId) => {
    setSelectedMoods(prev =>
      prev.includes(moodId) ? prev.filter(m => m !== moodId) : [...prev, moodId]
    );
  };

  // Démarrer session
  const startRadio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/radio/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mood:       selectedMoods[0] || null,
          moods:      selectedMoods,
          seedSongId: selectedSeed?._id || null,
          djEnabled:  true,
        }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setSessionId(data.sessionId);
      sessionRef.current = data.sessionId;
      setRadioName(data.name);
      setQueue(data.queue || []);
      setDjIntro(data.djIntro);
      setSongsPlayed(0);
      if (data.seedSong) { setCurrentSong(data.seedSong); setIsPlaying(true); }
      setPhase('active');
    } catch {
      setError("Impossible de démarrer la radio. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [selectedMoods, selectedSeed, token, setCurrentSong, setIsPlaying]);

  // Titre suivant
  const playNext = useCallback(async (isSkip = false) => {
    if (!sessionId || loadingNext) return;
    setLoadingNext(true);
    if (isSkip && currentSong) {
      fetch(`${API}/radio/${sessionId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ songId: currentSong._id }),
      }).catch(() => {});
    }
    try {
      const res = await fetch(`${API}/radio/${sessionId}/next`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 204) { setError("Plus de titres disponibles."); setLoadingNext(false); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrentSong(data.song);
      setIsPlaying(true);
      setQueue(prev => prev.filter(s => String(s._id) !== String(data.song._id)));
      setSongsPlayed(data.songsPlayed || 0);
      if (data.djComment) setDjComment(data.djComment);
    } catch {
      setError("Erreur lors du chargement du titre suivant.");
    } finally {
      setLoadingNext(false);
    }
  }, [sessionId, currentSong, loadingNext, token, setCurrentSong, setIsPlaying]);

  // Like
  const likeCurrent = useCallback(async () => {
    if (!sessionId || !currentSong) return;
    const id = String(currentSong._id);
    setLikedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    if (!likedIds.has(id)) {
      fetch(`${API}/radio/${sessionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ songId: id }),
      }).catch(() => {});
    }
  }, [sessionId, currentSong, likedIds, token]);

  const stopRadio = useCallback(() => {
    if (sessionId) {
      fetch(`${API}/radio/${sessionId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
      sessionRef.current = null;
    }
    setPhase('setup'); setSessionId(null); setQueue([]);
    setDjIntro(null); setDjComment(null); setSongsPlayed(0);
    setLikedIds(new Set()); setIsPlaying(false);
  }, [sessionId, token, setIsPlaying]);

  const isLiked = currentSong && likedIds.has(String(currentSong._id));
  const canStart = selectedMoods.length > 0 || selectedSeed;

  // ══════════════════════════════════════════
  // RENDER — SETUP
  // ══════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="min-h-screen md:min-h-0 flex flex-col gap-0 bg-zinc-950 md:bg-transparent rounded-3xl overflow-hidden">
        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-950/60 via-zinc-950 to-zinc-950 px-6 pt-6 pb-8 border-b border-zinc-800/50">
          <div className="absolute inset-0 opacity-5">
            <div style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} className="w-full h-full" />
          </div>
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30">
                <Radio size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Radio IA</h1>
                <p className="text-[9px] text-red-400/70 uppercase tracking-[0.2em] font-bold">Propulsée par Claude</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-600 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed relative">
            Sélectionnez <span className="text-white font-semibold">une ou plusieurs ambiances</span> — l'IA composera une radio personnalisée et intelligente.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">

          {/* ── Tous les moods par groupe ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <SlidersHorizontal size={10} />
                Ambiances
              </p>
              {selectedMoods.length > 0 && (
                <button onClick={() => setSelectedMoods([])} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition font-bold">
                  Tout effacer
                </button>
              )}
            </div>

            {/* Moods sélectionnés en haut */}
            {selectedMoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedMoods.map(mId => {
                  const m = ALL_MOODS.find(x => x.id === mId);
                  if (!m) return null;
                  return (
                    <button
                      key={mId}
                      onClick={() => toggleMood(mId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r ${m.gradient} text-white text-xs font-bold shadow-md`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                      <X size={10} className="opacity-70" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Groupes collapsibles */}
            {MOOD_GROUPS.map(group => {
              const groupMoods = ALL_MOODS.filter(m => m.group === group);
              const isExpanded = expandedGroup === group || selectedMoods.some(id => groupMoods.find(m => m.id === id));
              const hasSelected = selectedMoods.some(id => groupMoods.find(m => m.id === id));

              return (
                <div key={group} className="mb-2 border border-zinc-800/60 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(prev => prev === group ? null : group)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/60 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-300">{group}</span>
                      {hasSelected && (
                        <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">
                          {selectedMoods.filter(id => groupMoods.find(m => m.id === id)).length} sélectionné{selectedMoods.filter(id => groupMoods.find(m => m.id === id)).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 px-3 pb-3">
                      {groupMoods.map(mood => (
                        <MoodPill
                          key={mood.id}
                          mood={mood}
                          selected={selectedMoods.includes(mood.id)}
                          onClick={() => toggleMood(mood.id)}
                          showScore={!!selectedSeed}
                          score={moodScores[mood.id]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* ── Titre de départ ── */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-1.5">
              <Music2 size={10} />
              Démarrer depuis un titre {sortedSuggestions.length > 0 && `(${sortedSuggestions.length} titres${selectedMoods.length > 0 ? ' compatibles' : ''})`}
            </p>

            {sortedSuggestions.length === 0 && selectedMoods.length > 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">Aucun titre compatible avec ces ambiances.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {sortedSuggestions.map(song => (
                  <button
                    key={song._id}
                    onClick={() => setSelectedSeed(prev => prev?._id === song._id ? null : song)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedSeed?._id === song._id
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <img src={song.image} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
                      <p className="text-[10px] text-zinc-600 truncate uppercase">{song.artiste}</p>
                      {song._matchScore !== undefined && (
                        <CompatBadge score={song._matchScore} />
                      )}
                    </div>
                    {selectedSeed?._id === song._id && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                        <Zap size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>
          )}
        </div>

        {/* CTA sticky en bas */}
        <div className="px-4 py-4 border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-sm">
          {selectedMoods.length > 0 && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {selectedMoods.map(mId => {
                const m = ALL_MOODS.find(x => x.id === mId);
                return m ? (
                  <span key={mId} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${m.bg} ${m.border} ${m.text}`}>
                    {m.emoji} {m.label}
                  </span>
                ) : null;
              })}
              {selectedSeed && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-zinc-800 border-zinc-700 text-zinc-300">
                  🎵 {selectedSeed.titre}
                </span>
              )}
            </div>
          )}

          <button
            onClick={startRadio}
            disabled={loading || !canStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" />L'IA compose votre radio…</>
            ) : (
              <><Sparkles size={16} />Lancer la Radio IA<ChevronRight size={16} /></>
            )}
          </button>

          {!canStart && (
            <p className="text-center text-[10px] text-zinc-700 mt-2">
              Choisissez au moins une ambiance ou un titre
            </p>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — ACTIVE (lecture en cours)
  // ══════════════════════════════════════════
  const activeMoodObj = ALL_MOODS.find(m => m.id === selectedMoods[0]);

  return (
    <div className="min-h-screen md:min-h-0 flex flex-col bg-zinc-950 md:bg-transparent rounded-3xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
            <Radio size={17} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-zinc-950 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white truncate">{radioName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {selectedMoods.slice(0, 2).map(mId => {
                const m = ALL_MOODS.find(x => x.id === mId);
                return m ? <span key={mId} className={`text-[9px] font-bold ${m.text}`}>{m.emoji} {m.label}</span> : null;
              })}
              <span className="text-[9px] text-zinc-600">· {songsPlayed} joué{songsPlayed > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowQueue(q => !q)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition ${
              showQueue ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-700'
            }`}
          >
            <ListMusic size={11} />
            {queue.length}
          </button>
          <button onClick={stopRadio} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-600 hover:text-red-400">
            <StopCircle size={15} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-600 hover:text-white">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Corps principal */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">

        {/* Zone lecture */}
        <div className="flex-1 flex flex-col gap-5 p-5">

          {djIntro && <DJBubble comment={djIntro} onDismiss={() => setDjIntro(null)} />}

          {/* Player card */}
          {currentSong && (
            <div className="relative rounded-3xl overflow-hidden flex-1 min-h-[360px] md:min-h-0 flex flex-col">
              {/* Bg artwork flou */}
              <img
                src={currentSong.image}
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-25 transition-all duration-1000"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/20" />

              {/* Contenu */}
              <div className="relative flex flex-col items-center justify-between h-full p-6 gap-6">

                {/* Pochette */}
                <div className="flex-1 flex items-center justify-center pt-2">
                  <div className="relative group">
                    <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-40 transition-all duration-500 ${
                      isPlaying ? 'scale-110' : 'scale-100'
                    } bg-gradient-to-br ${activeMoodObj?.gradient || 'from-red-500 to-orange-500'}`} />
                    <img
                      src={currentSong.image}
                      className={`relative w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl border border-white/10 transition-all duration-500 ${
                        isPlaying ? 'scale-100 shadow-red-500/20' : 'scale-95 opacity-60'
                      }`}
                      alt=""
                    />
                    {/* Visualizer en bas de la pochette */}
                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
                      <WaveVisualizer isPlaying={isPlaying} />
                    </div>
                  </div>
                </div>

                {/* Infos titre */}
                <div className="text-center w-full px-4">
                  <h2 className="text-2xl font-black text-white truncate leading-tight">{currentSong.titre}</h2>
                  <p className="text-sm text-zinc-400 uppercase tracking-widest truncate mt-1.5 font-medium">{currentSong.artiste}</p>

                  {/* Tags moods de la chanson */}
                  {currentSong.moods?.length > 0 && (
                    <div className="flex justify-center flex-wrap gap-1.5 mt-3">
                      {currentSong.moods.slice(0, 4).map(m => {
                        const moodObj = ALL_MOODS.find(x => x.keywords?.some(kw => m.toLowerCase().includes(kw)) || x.id === m.toLowerCase());
                        return (
                          <span key={m} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            moodObj ? `${moodObj.bg} ${moodObj.border} ${moodObj.text}` : 'bg-white/5 border-white/10 text-zinc-500'
                          } uppercase tracking-wide`}>
                            {moodObj?.emoji} {m}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Contrôles */}
                <div className="flex items-center gap-5 pb-2">
                  <button
                    onClick={likeCurrent}
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 ${
                      isLiked
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 scale-110'
                        : 'bg-white/5 border-white/10 text-zinc-500 hover:text-red-400 hover:border-red-500/30'
                    }`}
                  >
                    <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(p => !p)}
                    className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-transform ring-4 ring-red-500/20"
                  >
                    {isPlaying
                      ? <Pause size={28} fill="white" className="text-white" />
                      : <Play size={28} fill="white" className="text-white ml-1" />
                    }
                  </button>

                  <button
                    onClick={() => playNext(true)}
                    disabled={loadingNext}
                    className="w-12 h-12 rounded-2xl border bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 flex items-center justify-center transition-all disabled:opacity-40"
                  >
                    {loadingNext
                      ? <RefreshCw size={20} className="animate-spin" />
                      : <SkipForward size={20} />
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {djComment && <DJBubble comment={djComment} onDismiss={() => setDjComment(null)} />}

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <WifiOff size={15} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button onClick={() => { setError(null); playNext(false); }} className="text-xs text-red-400 hover:text-red-300 font-bold shrink-0">
                Réessayer
              </button>
            </div>
          )}

          {/* Changer ambiance */}
          <button
            onClick={stopRadio}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-600 text-xs font-bold transition"
          >
            <Shuffle size={12} />
            Changer d'ambiance
          </button>
        </div>

        {/* File d'attente — panneau latéral sur md+ */}
        {showQueue && queue.length > 0 && (
          <div className="md:w-72 border-t md:border-t-0 md:border-l border-zinc-800/50 flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <ListMusic size={10} />
                À venir · {queue.length}
              </p>
              <button onClick={() => setShowQueue(false)} className="text-zinc-700 hover:text-zinc-500 transition">
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/30">
              {queue.slice(0, 12).map((song, i) => (
                <QueueItem key={song._id} song={song} index={i} isNext={i === 0} />
              ))}
              {queue.length > 12 && (
                <p className="text-center text-[10px] text-zinc-700 py-3">+ {queue.length - 12} autres titres</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadioView;