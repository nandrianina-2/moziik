import { useEffect, useRef } from 'react';

const API = 'https://backend-moozik.vercel.app';

/**
 * Envoie des événements de rétention audio par tranches de 5 % de progression.
 * Chaque fetch est annulable via AbortController pour éviter les fuites mémoire.
 *
 * @param {import('../types/player').Song | null} currentSong
 * @param {number} currentTime
 * @param {number} duration
 */
export const usePlayerAnalytics = (currentSong, currentTime, duration) => {
  const sentBuckets = useRef(new Set());

  // Réinitialise les buckets à chaque changement de morceau
  useEffect(() => {
    sentBuckets.current.clear();
  }, [currentSong?._id]);

  // Tick stable calculé hors du tableau de dépendances
  const tick = Math.floor(currentTime / 5);

  useEffect(() => {
    if (!currentSong || !duration) return;

    const bucket = Math.floor((currentTime / duration) * 20);
    if (bucket < 0 || bucket >= 20 || sentBuckets.current.has(bucket)) return;

    const controller = new AbortController();
    sentBuckets.current.add(bucket);

    const deviceId =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('moozik_device_id') ?? ''
        : '';

    fetch(`${API}/songs/${currentSong._id}/retention`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket,
        totalTime: Math.round(currentTime),
        completed: currentTime / duration > 0.9,
        deviceId,
      }),
      signal: controller.signal,
    }).catch((e) => {
      if (e.name !== 'AbortError') console.warn('Analytics retention failed:', e);
    });

    return () => controller.abort();
  }, [tick, currentSong?._id, duration]);
};