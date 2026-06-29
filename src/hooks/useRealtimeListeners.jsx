import React, { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://moozik-gft1.onrender.com';

export function useRealtimeListeners(token, currentSong) {
  const [listeners, setListeners] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);
  const retryDelay = useRef(2000);


  const connect = useCallback(() => {
    // Ne pas reconnecter si pas de token ou déjà connecté
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // const ws = new WebSocket(`${WS_URL}/ws/listeners`);
    const ws = new WebSocket(
      `${WS_URL}/ws/listeners?token=${encodeURIComponent(token)}`
    );
    wsRef.current = ws;

    try {

      ws.onopen = () => {

        if (!mountedRef.current) {
          ws.close(); // ← fermer proprement si déjà démonté
          return;
        }
        if (currentSong) {
          ws.send(JSON.stringify({
            type: 'join', token,
            songId: currentSong._id,
            songTitle: currentSong.titre,
            artiste: currentSong.artiste,
            image: currentSong.image,
          }));
        }
        setConnected(true);
        retryDelay.current = 2000;
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'listeners') setListeners(msg.users || []);
        } catch {}
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setConnected(false);
        // Ne pas reconnecter sur fermeture normale (1000) ou auth échouée (4001)
        if (event.code === 1000 || event.code === 4001) return;
        reconnectRef.current = setTimeout(connect, retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 60000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, [token]); // currentSong volontairement exclu pour éviter reconnexions

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // empêche la reconnexion au unmount
        wsRef.current.close();
      }
    };
  }, [token]);

  // Notifie le serveur quand la chanson change (sans reconnecter)
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentSong || !token) return;
    wsRef.current.send(JSON.stringify({
      type: 'join', token,
      songId: currentSong._id,
      songTitle: currentSong.titre,
      artiste: currentSong.artiste,
      image: currentSong.image,
    }));
  }, [currentSong?._id]);

  return { listeners, connected };
}

export const ListenersWidget = ({ listeners, connected }) => {
  if (!connected || !listeners || listeners.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
      </div>
      <div className="flex -space-x-2">
        {listeners.slice(0, 5).map((u, i) => (
          <div key={i}
            title={`${u.nom} — ${u.songTitle}`}
            className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0">
            {u.avatar
              ? <img src={u.avatar} className="w-full h-full object-cover" alt="" />
              : (u.nom || '?')[0].toUpperCase()
            }
          </div>
        ))}
        {listeners.length > 5 && (
          <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[9px] text-zinc-500 shrink-0">
            +{listeners.length - 5}
          </div>
        )}
      </div>
      <span className="text-[11px] text-zinc-500 truncate">
        {listeners.length === 1 ? '1 auditeur' : `${listeners.length} auditeurs`}
      </span>
    </div>
  );
};