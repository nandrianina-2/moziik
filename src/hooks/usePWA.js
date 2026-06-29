import { useState, useEffect, useRef, useCallback } from 'react';

// ════════════════════════════════════════════
// HOOK: Media Session API
// ════════════════════════════════════════════
export const useMediaSession = (currentSong, isPlaying, { onPlay, onPause, onNext, onPrev }) => {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title:   currentSong.titre   || 'Titre inconnu',
      artist:  currentSong.artiste || 'Artiste inconnu',
      album:   currentSong.album   || 'Moozik',
      artwork: [
        { src: currentSong.image || '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: currentSong.image || '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    const handlers = [
      ['play',           onPlay],
      ['pause',          onPause],
      ['nexttrack',      onNext],
      ['previoustrack',  onPrev],
      ['stop',           onPause],
    ];
    handlers.forEach(([action, handler]) => {
      if (handler) try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    });
    return () => {
      handlers.forEach(([action]) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      });
    };
  }, [currentSong, isPlaying, onPlay, onPause, onNext, onPrev]);
};

// ════════════════════════════════════════════
// HOOK: Wake Lock API
// ════════════════════════════════════════════
export const useWakeLock = (isPlaying) => {
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch {}
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) requestWakeLock(); else releaseWakeLock();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) requestWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseWakeLock();
    };
  }, [isPlaying, requestWakeLock, releaseWakeLock]);
};

// ════════════════════════════════════════════
// HOOK: App Badge API
// ════════════════════════════════════════════
export const useAppBadge = (unreadCount) => {
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    if (unreadCount > 0) navigator.setAppBadge(unreadCount).catch(() => {});
    else navigator.clearAppBadge().catch(() => {});
  }, [unreadCount]);
};

// ════════════════════════════════════════════
// HOOK: Offline Detection
// ════════════════════════════════════════════
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline]   = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  setWasOffline(true); setTimeout(() => setWasOffline(false), 3000); };
    const onOffline = () => { setIsOnline(false); setWasOffline(false); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};

// ════════════════════════════════════════════
// HOOK: Audio Cache — CORRIGÉ
//
// PROBLÈME ORIGINAL :
//   loadCachedIds() tentait de retrouver l'ID MongoDB depuis l'URL Cloudinary.
//   URL Cloudinary = "https://res.cloudinary.com/.../v123/moozik/audio/abc.mp3"
//   → url.searchParams.get('songId') → null  (pas de param songId)
//   → url.pathname.split('/').pop() → "abc.mp3"  (ID Cloudinary, pas MongoDB)
//   → cachedIds était toujours vide après refresh → isAudioCached() = false
//
// SOLUTION :
//   On stocke la correspondance { songId → audioUrl } dans localStorage.
//   Le Cache API garde les fichiers audio.
//   localStorage garde la liste des IDs → persiste après refresh/fermeture.
//
// ARCHITECTURE :
//   Cache API  : stocke les blobs audio (persistant, plusieurs Mo)
//   localStorage: stocke { "moozik_cache_index": { songId: audioUrl } }
//
// ════════════════════════════════════════════
const CACHE_NAME   = 'moozik-audio-offline';
const INDEX_KEY    = 'moozik_cache_index';

/** Lit l'index depuis localStorage → { songId: audioUrl } */
const readIndex = () => {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

/** Écrit l'index dans localStorage */
const writeIndex = (index) => {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(index)); } catch {}
};

export const useAudioCache = () => {
  // FIX: initialiser depuis localStorage dès le premier render
  const [cachedIds, setCachedIds] = useState(() => {
    const index = readIndex();
    return new Set(Object.keys(index));
  });

  // FIX: au montage, vérifier la cohérence Cache API ↔ localStorage
  // (au cas où l'utilisateur a vidé le cache navigateur manuellement)
  const syncWithCacheAPI = useCallback(async () => {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys  = await cache.keys();
      const cachedUrls = new Set(keys.map(r => r.url));

      const index  = readIndex();
      let changed  = false;

      // Supprimer de l'index les entrées dont le blob n'est plus en cache
      for (const [songId, audioUrl] of Object.entries(index)) {
        if (!cachedUrls.has(audioUrl)) {
          delete index[songId];
          changed = true;
        }
      }

      if (changed) {
        writeIndex(index);
        setCachedIds(new Set(Object.keys(index)));
      }
    } catch {}
  }, []);

  useEffect(() => { syncWithCacheAPI(); }, [syncWithCacheAPI]);

  // ── Mettre en cache une chanson ────────────
const cacheAudio = useCallback(async (song) => {
    if (!('caches' in window) || !song?.src || !song?._id) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      // Vérifier si déjà en cache
      const existing = await cache.match(song.src);
      if (existing) {
        // Mettre à jour l'index au cas où il serait désynchronisé
        const index = readIndex();
        if (!index[song._id]) {
          index[song._id] = song.src;
          writeIndex(index);
          setCachedIds(prev => new Set([...prev, song._id]));
        }
        return true;
      }
      // Télécharger et mettre en cache
      const response = await fetch(song.src, { 
        mode: 'cors',
        headers: { 'Range': 'bytes=0-' }, // force réponse complète
      });

      if (!response.ok && response.status !== 206) return false;

      // Reconstruire une réponse 200 pour éviter l'erreur Cache + 206
      const blob = await response.blob();
      const fullResponse = new Response(blob, {
        status: 200,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg' },
      });

      await cache.put(song.src, fullResponse);
      // Sauvegarder dans l'index localStorage
      const index = readIndex();
      index[song._id] = song.src;
      writeIndex(index);
      setCachedIds(prev => new Set([...prev, song._id]));
      return true;
    } catch (e) {
      console.warn('cacheAudio error:', e);
      return false;
    }
  }, []);

  // ── Retirer du cache ───────────────────────
  const removeCached = useCallback(async (song) => {
    if (!song?._id) return;
    try {
      const index = readIndex();
      const audioUrl = index[song._id] || song.src;

      if (audioUrl && ('caches' in window)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(audioUrl);
      }

      // FIX: Supprimer de l'index localStorage
      delete index[song._id];
      writeIndex(index);
      setCachedIds(prev => { const s = new Set(prev); s.delete(song._id); return s; });
    } catch {}
  }, []);

  // ── Vérifier si une chanson est en cache ───
  // FIX: lit depuis le state qui est initialisé depuis localStorage → toujours correct
  const isAudioCached = useCallback((songId) => {
    if (!songId) return false;
    return cachedIds.has(String(songId));
  }, [cachedIds]);

  // ── Récupérer l'URL locale (pour lecture hors-ligne) ──
  const getCachedUrl = useCallback(async (song) => {
    if (!song?.src || !('caches' in window)) return song?.src;
    try {
      const cache    = await caches.open(CACHE_NAME);
      const response = await cache.match(song.src);
      if (!response) return song.src;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch { return song.src; }
  }, []);

  // ── Vider tout le cache ────────────────────
  const clearAllCache = useCallback(async () => {
    try {
      if ('caches' in window) await caches.delete(CACHE_NAME);
      localStorage.removeItem(INDEX_KEY);
      setCachedIds(new Set());
    } catch {}
  }, []);

  // ── Taille du cache ────────────────────────
  const getCacheSize = useCallback(async () => {
    if (!('caches' in window)) return 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys  = await cache.keys();
      let total = 0;
      for (const key of keys) {
        const res = await cache.match(key);
        if (res) { const blob = await res.blob(); total += blob.size; }
      }
      return total; // en octets
    } catch { return 0; }
  }, []);

  return {
    cacheAudio,
    removeCached,
    isAudioCached,
    getCachedUrl,
    clearAllCache,
    getCacheSize,
    cachedIds,
  };
};