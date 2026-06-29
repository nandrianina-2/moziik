import { useRef, useState, useCallback } from 'react';

/**
 * Gère le drag-and-drop des éléments de la file d'attente.
 *
 * @param {React.Dispatch<React.SetStateAction<any[]>>} setQueue
 * @returns {{ dragOver: number|null, onDragStart: Function, onDragOver: Function, onDrop: Function }}
 */
export const useQueueDrag = (setQueue) => {
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const onDragStart = useCallback((i) => {
    dragIdx.current = i;
  }, []);

  const onDragOver = useCallback((e, i) => {
    e.preventDefault();
    setDragOver(i);
  }, []);

  const onDrop = useCallback((i) => {
    if (dragIdx.current === null || dragIdx.current === i) {
      setDragOver(null);
      return;
    }
    setQueue((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx.current, 1);
      arr.splice(i, 0, moved);
      return arr;
    });
    dragIdx.current = null;
    setDragOver(null);
  }, [setQueue]);

  return { dragOver, onDragStart, onDragOver, onDrop };
};