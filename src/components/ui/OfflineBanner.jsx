import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Download, Check } from 'lucide-react';

// ── Bannière hors-ligne ────────────────────────
export const OfflineBanner = ({ isOnline, wasOffline }) => {
  if (isOnline && !wasOffline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-500 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all duration-500
      ${isOnline
        ? 'bg-green-600/90 text-white backdrop-blur-sm'
        : 'bg-zinc-900/95 text-zinc-300 border-b border-zinc-800 backdrop-blur-sm'
      }`}>
      {isOnline
        ? <><Wifi size={13} /> Connexion rétablie !</>
        : <><WifiOff size={13} /> Mode hors-ligne — musiques en cache disponibles</>
      }
    </div>
  );
};

// ── Bouton cache audio dans le player ──────────
export const CacheButton = ({ song, cacheAudio, removeCached, isAudioCached }) => {
  const [loading, setLoading] = useState(false);
  const cached = isAudioCached(song?._id);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!song) return;
    setLoading(true);
    if (cached) await removeCached(song);
    else await cacheAudio(song);
    setLoading(false);
  };

  if (!song || !('caches' in window)) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={cached ? 'Retirer du cache hors-ligne' : 'Écouter hors-ligne'}
      className={`p-1.5 rounded-lg transition ${
        cached
          ? 'text-green-400 hover:text-red-400 hover:bg-red-500/10'
          : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
      } disabled:opacity-40`}>
      {loading
        ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
        : cached
          ? <Check size={14} />
          : <Download size={14} />
      }
    </button>
  );
};