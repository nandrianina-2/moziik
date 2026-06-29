import { useEffect } from 'react';

/**
 * Remplit automatiquement la file d'attente avec le reste de la playlist
 * lorsqu'elle est vide et qu'un morceau est en cours.
 *
 * @param {import('../types/player').Song | null} currentSong
 * @param {import('../types/player').Song[]} musiques
 * @param {import('../types/player').Song[]} queue
 * @param {React.Dispatch<React.SetStateAction<import('../types/player').Song[]>>} setQueue
 */
export const useAutoQueue = (currentSong, musiques, queue, setQueue) => {
  useEffect(() => {
    if (!musiques?.length || !currentSong || queue.length > 0) return;

    const idx = musiques.findIndex((s) => s._id === currentSong._id);
    if (idx === -1) return;

    setQueue([...musiques.slice(idx + 1), ...musiques.slice(0, idx)]);
  }, [currentSong?._id]);
};