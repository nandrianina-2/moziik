/**
 * useSmartRecommendations.js
 * Placez ce fichier dans : src/hooks/useSmartRecommendations.js
 *
 * Moteur de recommandation hybride — 100% client-side, zéro dépendance externe.
 * Utilise le localStorage pour mémoriser l'historique d'écoute entre sessions.
 */

import { useMemo } from 'react';

// ─── Constantes ───────────────────────────────────────────────────────────────
const HISTORY_KEY  = 'moozik_listen_history';
const MAX_HISTORY  = 200;
const ONE_MONTH_MS = 30 * 24 * 3600 * 1000;
const ONE_WEEK_MS  =  7 * 24 * 3600 * 1000;
const COOLDOWN_MS  = 30 * 60 * 1000;

// ─── Mots-clés par mood (même liste que dans HomeView) ───────────────────────
const MOOD_KW = {
  'Chill':     ['chill','calme','doux','relax','slow','lounge','ambient','soir'],
  'Énergie':   ['énergie','energie','energy','fast','rapide','power','boost','dance','danse'],
  'Focus':     ['focus','concentration','study','travail','work','deep','instrumental'],
  'Fête':      ['fête','fete','party','club','festif','nuit','afrobeats','dancehall'],
  'Nostalgie': ['nostalgie','nostalgia','retro','oldschool','old','classic','souvenir'],
  'Romance':   ['romance','amour','love','romantique','tendresse','coeur'],
  'Motivant':  ['motivant','motivation','inspire','gospel','victoire','triumph','champion'],
  'Gospel':    ['gospel','dieu','jesus','christ','praise','worship','gloire','seigneur'],
};

// ─── API publique ─────────────────────────────────────────────────────────────
/**
 * Enregistrer une écoute dans l'historique local.
 * À appeler à chaque changement de chanson (voir usage dans App.jsx).
 *
 * @param {string} songId
 * @param {number} duration  secondes effectivement écoutées
 */
export const recordListenHistory = (songId, duration = 0) => {
  if (!songId) return;
  try {
    const raw     = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({ id: songId, ts: Date.now(), duration });
    if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* quota localStorage dépassé — ignorer silencieusement */ }
};

// ─── Utilitaires internes ─────────────────────────────────────────────────────
const readHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const timeOfDay = () => {
  const d = new Date();
  return (d.getHours() * 60 + d.getMinutes()) / 1440; // fraction [0, 1)
};

// ─── Profilage utilisateur ────────────────────────────────────────────────────
const buildProfile = (songs, history) => {
  const genreScore  = {};
  const artistScore = {};
  const likedIds    = new Set(songs.filter(s => s.liked).map(s => s._id));
  const recentIds   = new Set();
  const cooldownIds = new Set();
  const now         = Date.now();

  history.forEach(({ id, ts, duration }) => {
    const age        = now - ts;
    const timeWeight = Math.max(0, 1 - age / ONE_MONTH_MS); // décroît avec le temps
    const engagement = Math.min(1, (duration || 30) / 180); // 3 min = engagement max
    const w          = timeWeight * engagement;

    if (age < 24 * 3600 * 1000) recentIds.add(id);
    if (age < COOLDOWN_MS)      cooldownIds.add(id);

    const song = songs.find(s => s._id === id);
    if (!song) return;

    const g = song.genre || song.categorie || song.category;
    if (g)           genreScore[g]         = (genreScore[g]         || 0) + w;
    if (song.artiste) artistScore[song.artiste] = (artistScore[song.artiste] || 0) + w;
  });

  // Boost additionnel pour les likes
  songs.filter(s => s.liked).forEach(song => {
    const g = song.genre || song.categorie || song.category;
    if (g)           genreScore[g]         = (genreScore[g]         || 0) + 1.5;
    if (song.artiste) artistScore[song.artiste] = (artistScore[song.artiste] || 0) + 1.5;
  });

  return { genreScore, artistScore, likedIds, recentIds, cooldownIds };
};

// ─── Score hybride pour une chanson ──────────────────────────────────────────
const hybridScore = (song, profile, mood, tod) => {
  const { genreScore, artistScore, likedIds } = profile;
  let score = 0;

  // 1. Popularité logarithmique (évite l'effet "une seule star")
  score += Math.log1p(song.plays || 0) * 2;
  score += Math.log1p(song.likes || 0) * 4;

  // 2. Affinité genre
  const genre    = song.genre || song.categorie || song.category;
  const genreMax = Math.max(1, ...Object.values(genreScore));
  if (genre && genreScore[genre]) score += (genreScore[genre] / genreMax) * 30;

  // 3. Affinité artiste
  const artistMax = Math.max(1, ...Object.values(artistScore));
  if (song.artiste && artistScore[song.artiste])
    score += (artistScore[song.artiste] / artistMax) * 25;

  // 4. Like direct
  if (likedIds.has(song._id)) score += 10;

  // 5. Fraîcheur (date de sortie annee+mois ou createdAt)
  const releaseYear  = parseInt(song.annee) || 0;
  const releaseMonth = parseInt(song.mois)  || 6;
  const curYear      = new Date().getFullYear();
  const curMonth     = new Date().getMonth() + 1;
  if (releaseYear > 0) {
    const monthsOld = (curYear - releaseYear) * 12 + (curMonth - releaseMonth);
    score += Math.max(0, 15 - monthsOld * 0.3);
  } else if (song.createdAt) {
    const ageMs = Date.now() - new Date(song.createdAt).getTime();
    if (ageMs < ONE_WEEK_MS)  score += 10;
    if (ageMs < ONE_MONTH_MS) score += 5;
  }

  // 6. Contexte temporel : matin → énergie, soir → chill
  const text      = [song.titre, song.artiste, song.genre, song.description]
    .filter(Boolean).join(' ').toLowerCase();
  const isMorning = tod >= 0.25 && tod < 0.42; // 6h–10h
  const isEvening = tod >= 0.83;                // 20h–24h
  if (isMorning && MOOD_KW['Énergie'].some(k => text.includes(k))) score += 6;
  if (isEvening && MOOD_KW['Chill'].some(k => text.includes(k)))   score += 6;

  // 7. Boost mood actif (tag ou mot-clé)
  if (mood) {
    const hasMoodTag = Array.isArray(song.moods) && song.moods.includes(mood);
    const kwMatch    = (MOOD_KW[mood] || []).some(k => text.includes(k));
    if (hasMoodTag || kwMatch) score += 20;
  }

  return score;
};

// ─── Diversification artistes ─────────────────────────────────────────────────
const diversify = (songs, maxPerArtist = 2, limit = 20) => {
  const counts  = {};
  const primary = [];
  const rest    = [];
  for (const s of songs) {
    const a = s.artiste || '__unknown__';
    counts[a] = (counts[a] || 0) + 1;
    if (counts[a] <= maxPerArtist) primary.push(s);
    else rest.push(s);
  }
  return [...primary, ...rest].slice(0, limit);
};

// ─── Hook principal ───────────────────────────────────────────────────────────
/**
 * @param {{
 *   songs:        object[],
 *   selectedMood: string|null,
 *   limit?:       number
 * }} options
 *
 * @returns {{
 *   pourVous:             object[],
 *   trendingHybrid:       object[],
 *   nouveautes:           object[],
 *   decouverteduJour:     object|null,
 *   ambianceContextuelle: { songs: object[], label: string, mood: string },
 *   gems:                 object[],
 *   artistesTendance:     { nom: string, plays: number, score: number, song: object }[],
 *   isPersonalized:       boolean,
 * }}
 */
const useSmartRecommendations = ({ songs = [], selectedMood = null, limit = 20 }) => {
  const history = useMemo(readHistory, []);
  const tod     = useMemo(timeOfDay,   []);

  const profile = useMemo(
    () => buildProfile(songs, history),
    // songs.length suffit comme dépendance — on évite de recalculer à chaque render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [songs.length, history.length]
  );

  const isPersonalized = history.length >= 5;

  // Toutes les chansons scorées et triées
  const scored = useMemo(() => {
    if (!songs.length) return [];
    return [...songs]
      .map(s => ({ ...s, _score: hybridScore(s, profile, selectedMood, tod) }))
      .sort((a, b) => b._score - a._score);
  }, [songs, profile, selectedMood, tod]);

  // ── "Pour vous" ──────────────────────────────────────────────────────────────
  const pourVous = useMemo(() => {
    const base             = scored.filter(s => !profile.cooldownIds.has(s._id));
    const serendipityCount = Math.max(1, Math.ceil(limit * 0.1));
    const serendipityPool  = songs
      .filter(s => (s.plays || 0) < 50 && !profile.cooldownIds.has(s._id))
      .sort(() => Math.random() - 0.5)
      .slice(0, serendipityCount);
    const serendipityIds = new Set(serendipityPool.map(s => s._id));
    const merged = [
      ...base.filter(s => !serendipityIds.has(s._id)).slice(0, limit - serendipityCount),
      ...serendipityPool,
    ].sort((a, b) => (b._score || 0) - (a._score || 0));
    return diversify(merged, 3, limit);
  }, [scored, profile, songs, limit]);

  // ── Trending hybride ─────────────────────────────────────────────────────────
  const trendingHybrid = useMemo(
    () => diversify(scored, 3, limit),
    [scored, limit]
  );

  // ── Nouveautés : date de sortie d'abord, score en départage ─────────────────
  const nouveautes = useMemo(() => {
    const getReleaseVal = s => {
      if (s.annee) return parseInt(s.annee) * 100 + (parseInt(s.mois) || 0);
      return new Date(s.createdAt || 0).getTime() / 1e9;
    };
    return [...songs]
      .sort((a, b) => {
        const dd = getReleaseVal(b) - getReleaseVal(a);
        if (Math.abs(dd) > 1) return dd;
        return (b._score || hybridScore(b, profile, null, tod))
             - (a._score || hybridScore(a, profile, null, tod));
      })
      .slice(0, limit);
  }, [songs, profile, tod, limit]);

  // ── Découverte du jour personnalisée ────────────────────────────────────────
  const decouverteduJour = useMemo(() => {
    if (!songs.length) return null;
    const pool   = songs.filter(s => (s.plays || 0) < 200 && !profile.recentIds.has(s._id));
    const source = pool.length >= 3 ? pool : songs;
    const withBoost = source.map(s => ({
      ...s,
      _dScore: (profile.artistScore[s.artiste] || 0) * 0.5
             + (profile.genreScore[s.genre || s.categorie || s.category] || 0) * 0.5,
    })).sort((a, b) => b._dScore - a._dScore);
    // Déterministe par date (même chanson toute la journée)
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
    return withBoost[hash % Math.min(withBoost.length, 10)];
  }, [songs, profile]);

  // ── Ambiance contextuelle ────────────────────────────────────────────────────
  const ambianceContextuelle = useMemo(() => {
    const SESSIONS = [
      { start: 0.25, end: 0.42, mood: 'Énergie',   label: 'Bonne énergie ce matin'  },
      { start: 0.42, end: 0.58, mood: 'Focus',      label: 'Focus pour la journée'   },
      { start: 0.58, end: 0.75, mood: 'Motivant',   label: "Boost de l'après-midi"   },
      { start: 0.75, end: 0.83, mood: 'Chill',      label: 'Début de soirée'         },
      { start: 0.83, end: 1.00, mood: 'Romance',    label: 'Soirée romantique'        },
      { start: 0.00, end: 0.25, mood: 'Chill',      label: 'Nuit calme'              },
    ];
    const session    = SESSIONS.find(s => tod >= s.start && tod < s.end) || SESSIONS[0];
    const activeMood = selectedMood || session.mood;
    const keywords   = MOOD_KW[activeMood] || [];

    const filtered = songs.filter(s => {
      if (Array.isArray(s.moods) && s.moods.includes(activeMood)) return true;
      const text = [s.titre, s.artiste, s.genre, s.description, s.album]
        .filter(Boolean).join(' ').toLowerCase();
      return keywords.some(k => text.includes(k));
    });

    const source = filtered.length >= 3 ? filtered : scored;
    const final  = [...source]
      .map(s => ({ ...s, _score: hybridScore(s, profile, activeMood, tod) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    return { songs: final, label: session.label, mood: activeMood };
  }, [songs, scored, profile, selectedMood, tod, limit]);

  // ── Gemmes cachées ───────────────────────────────────────────────────────────
  const gems = useMemo(() =>
    [...songs]
      .filter(s => (s.plays || 0) < 100)
      .map(s => ({ ...s, _score: hybridScore(s, profile, null, tod) + (s.liked ? 20 : 0) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit),
    [songs, profile, tod, limit]
  );

  // ── Artistes tendance (popularité × affinité) ────────────────────────────────
  const artistesTendance = useMemo(() => {
    const map = {};
    songs.forEach(s => {
      if (!s.artiste) return;
      if (!map[s.artiste]) map[s.artiste] = { nom: s.artiste, plays: 0, score: 0, song: s };
      map[s.artiste].plays += s.plays || 0;
      map[s.artiste].score += (s.plays || 0) + (s.likes || 0) * 3
                            + (profile.artistScore[s.artiste] || 0) * 10;
    });
    return Object.values(map).sort((a, b) => b.score - a.score).slice(0, limit);
  }, [songs, profile, limit]);

  return {
    pourVous,
    trendingHybrid,
    nouveautes,
    decouverteduJour,
    ambianceContextuelle,
    gems,
    artistesTendance,
    isPersonalized,
  };
};

export default useSmartRecommendations;