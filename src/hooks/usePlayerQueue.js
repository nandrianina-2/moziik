/**
 * usePlayerQueue.js
 *
 * Hook centralisé pour gérer la file de lecture (queue) d'une
 * collection de morceaux (artiste, playlist, favoris…).
 *
 * Usage :
 *   const queue = usePlayerQueue({ songs, setCurrentSong, setIsPlaying, setQueue });
 *   <button onClick={() => queue.playSong(song)}>Play</button>
 *   <button onClick={queue.playAll}>Lire tout</button>
 *   <button onClick={queue.shuffle}>Aléatoire</button>
 *   <button onClick={queue.addAllToQueue}>File d'attente</button>
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * @param {object}   options
 * @param {array}    options.songs          – liste ordonnée des morceaux de la collection
 * @param {function} options.setCurrentSong – setter du lecteur global
 * @param {function} options.setIsPlaying   – setter du lecteur global
 * @param {function} options.setQueue       – setter de la queue globale
 * @param {function} [options.addToQueue]   – ajoute UN morceau en fin de queue existante
 */
export function usePlayerQueue({ songs = [], setCurrentSong, setIsPlaying, setQueue, addToQueue }) {

  const [shuffleActive, setShuffleActive] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────
  /** Joue `song` et place les morceaux SUIVANTS (dans `list`) en queue. */
  const _play = useCallback((song, list) => {
    const idx   = list.findIndex(s => String(s._id) === String(song._id));
    const after = idx >= 0 ? list.slice(idx + 1) : [];
    setCurrentSong(song);
    setIsPlaying(true);
    if (setQueue) setQueue(after);       // ← remplace intégralement l'ancienne queue
  }, [setCurrentSong, setIsPlaying, setQueue]);

  // ─── API publique ────────────────────────────────────────────────

  /**
   * Clique sur un titre individuel → joue ce titre et met
   * TOUS les suivants dans la queue (mode normal OU shuffle courant).
   */
  const playSong = useCallback((song) => {
    if (shuffleActive) {
      // En mode shuffle : on mélange tout sauf le titre choisi
      const others   = songs.filter(s => String(s._id) !== String(song._id));
        const shuffled = [...others].sort(() => Math.random() - 0.5);      
        setCurrentSong(song);
      setIsPlaying(true);
      if (setQueue) setQueue(shuffled);
    } else {
      _play(song, songs);
    }
  }, [songs, shuffleActive, _play, setCurrentSong, setIsPlaying, setQueue]);

  /**
   * Bouton "Lire tout" → premier morceau + reste en queue.
   * Désactive le shuffle.
   */
  const playAll = useCallback(() => {
    if (!songs.length) return;
    const [first, ...rest] = songs;
    setCurrentSong(first);
    setIsPlaying(true);
    if (setQueue) setQueue(rest);
    setShuffleActive(false);
  }, [songs, setCurrentSong, setIsPlaying, setQueue]);

  /**
   * Bouton "Aléatoire" → mélange et lit depuis le début.
   * Active l'indicateur shuffle.
   */
  const shuffle = useCallback(() => {
    if (!songs.length) return;
    const shuffled        = [...songs].sort(() => Math.random() - 0.5);
    const [first, ...rest] = shuffled;
    setCurrentSong(first);
    setIsPlaying(true);
    if (setQueue) setQueue(rest);
    setShuffleActive(true);
  }, [songs, setCurrentSong, setIsPlaying, setQueue]);

  /**
   * Bouton "File d'attente" → ajoute TOUS les morceaux à la queue existante
   * (sans interrompre la lecture en cours).
   */
  const addAllToQueue = useCallback(() => {
    if (!addToQueue) return;
    songs.forEach(s => addToQueue(s));
  }, [songs, addToQueue]);

  /**
   * Navigation clavier / bouton "Suivant" :
   * retourne le morceau suivant dans l'ordre (ou null).
   */
  const getNext = useCallback((currentSong) => {
    const idx = songs.findIndex(s => String(s._id) === String(currentSong?._id));
    return idx >= 0 && idx < songs.length - 1 ? songs[idx + 1] : null;
  }, [songs]);

  /**
   * Navigation clavier / bouton "Précédent".
   */
  const getPrev = useCallback((currentSong) => {
    const idx = songs.findIndex(s => String(s._id) === String(currentSong?._id));
    return idx > 0 ? songs[idx - 1] : null;
  }, [songs]);

  /**
   * Index du morceau en cours dans cette collection (−1 si absent).
   */
  const currentIndex = useCallback((currentSong) => {
    return songs.findIndex(s => String(s._id) === String(currentSong?._id));
  }, [songs]);

  return {
    shuffleActive,
    setShuffleActive,
    playSong,
    playAll,
    shuffle,
    addAllToQueue,
    getNext,
    getPrev,
    currentIndex,
  };
}