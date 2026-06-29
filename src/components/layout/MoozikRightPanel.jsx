/**
 * MoozikRightPanel.jsx
 * Panel droit fixe : Tendances + File d'attente
 *
 * Props :
 *   musiques        – Song[]    (toutes les musiques triées trending)
 *   queue           – Song[]    (file d'attente)
 *   setQueue        – setter
 *   currentSong     – Song | null
 *   setCurrentSong  – setter
 *   setIsPlaying    – setter
 *   isPlaying       – bool
 *   onClose         – () => void  (ferme le panel)
 *   visible         – bool
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, X, ChevronRight, BarChart2, Play, Pause, Trash2,
  Music2, MoreHorizontal,
} from 'lucide-react';

/* ─── Score trending (cohérent avec App.jsx) ─────────────── */
const getTrendingScore = (song) => {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const isRecent = song.createdAt && (Date.now() - new Date(song.createdAt).getTime()) < ONE_WEEK;
  return (song.plays || 0) + (song.likes || 0) * 3 + (isRecent ? 15 : 0);
};

/* ─── Pastille de rang (1 = gold, 2 = silver, 3 = bronze) ── */
const RankBadge = ({ rank }) => {
  const colors = {
    1: 'text-amber-400 bg-amber-400/10',
    2: 'text-zinc-300 bg-zinc-600/20',
    3: 'text-orange-400 bg-orange-400/10',
  };
  return (
    <span className={`w-6 text-center text-xs font-black ${colors[rank] || 'text-zinc-600'}`}>
      {rank}
    </span>
  );
};

/* ─── Thumbnail avec overlay play ─────────────────────────── */
const SongThumb = ({ song, isPlaying, isCurrent, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 group/thumb"
  >
    <img
      src={song.image}
      alt={song.titre}
      className="w-full h-full object-cover"
    />
    <div className={`
      absolute inset-0 bg-black/50
      flex items-center justify-center
      transition-opacity duration-150
      ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover/thumb:opacity-100'}
    `}>
      {isCurrent && isPlaying
        ? <Pause size={14} fill="white" className="text-white" />
        : <Play size={14} fill="white" className="text-white" />
      }
    </div>
    {/* Barre d'animation si en lecture */}
    {isCurrent && isPlaying && (
      <div className="absolute bottom-1 left-1 right-1 flex items-end justify-center gap-0.5 h-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-0.5 bg-red-500 rounded-full"
            style={{
              height: `${40 + i * 20}%`,
              animation: `eq-bar ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    )}
  </button>
);

/* ══════════════════════════════════════════════════════════════
   MOOZIK RIGHT PANEL
══════════════════════════════════════════════════════════════ */
const MoozikRightPanel = ({
  musiques = [],
  queue = [],
  setQueue,
  currentSong,
  setCurrentSong,
  setIsPlaying,
  isPlaying = false,
  onClose,
  visible = true,
}) => {

  /* Top 5 trending */
  const top5 = useMemo(
    () => [...musiques].sort((a, b) => getTrendingScore(b) - getTrendingScore(a)).slice(0, 5),
    [musiques]
  );

  const playSong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const removeFromQueue = (idx) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const playFromQueue = (idx) => {
    const song = queue[idx];
    setCurrentSong(song);
    setIsPlaying(true);
    setQueue(prev => prev.filter((_, i) => i !== idx));
  };

  if (!visible) return null;

  return (
    <>
      {/* ── Keyframes pour les barres EQ ── */}
      <style>{`
        @keyframes eq-bar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      <aside className={`
        hidden md:flex
        fixed right-0 top-16 bottom-24
        w-72 xl:w-80
        flex-col
        bg-zinc-950/98 backdrop-blur-xl
        border-l border-zinc-800/50
        z-30
        overflow-hidden
        transition-transform duration-300
        ${visible ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* ══ TENDANCES ══════════════════════════════════════════ */}
        <section className="shrink-0 border-b border-zinc-800/50">
          {/* Header section */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-red-500" />
              <span className="text-sm font-black text-white tracking-tight">Tendances</span>
            </div>
            <Link
              to="/trending"
              className="text-[11px] font-bold text-red-500 hover:text-red-400 transition flex items-center gap-0.5"
            >
              Tout voir <ChevronRight size={11} />
            </Link>
          </div>

          {/* Liste top 5 */}
          <ul className="px-3 pb-3 space-y-0.5">
            {top5.map((song, i) => {
              const isCurrent = currentSong?._id === song._id;
              return (
                <li
                  key={song._id}
                  className={`
                    flex items-center gap-3 px-2 py-2.5 rounded-xl
                    transition-all duration-150 cursor-pointer group
                    ${isCurrent
                      ? 'bg-zinc-800/80 ring-1 ring-zinc-700/50'
                      : 'hover:bg-zinc-900/80'
                    }
                  `}
                  onClick={() => playSong(song)}
                >
                  <RankBadge rank={i + 1} />
                  <SongThumb song={song} isPlaying={isPlaying} isCurrent={isCurrent} onClick={() => playSong(song)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-zinc-200 group-hover:text-white'} transition`}>
                      {song.titre}
                    </p>
                    <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
                  </div>
                  {/* Score en hover */}
                  <span className="text-[9px] text-zinc-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <BarChart2 size={12} className="text-zinc-700" />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ══ FILE D'ATTENTE ═════════════════════════════════════ */}
        <section className="flex flex-col flex-1 min-h-0">
          {/* Header section */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Music2 size={15} className="text-zinc-400" />
              <span className="text-sm font-black text-white tracking-tight">
                File d'attente
              </span>
              {queue.length > 0 && (
                <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full font-bold">
                  {queue.length}
                </span>
              )}
            </div>
            {queue.length > 0 && (
              <button
                onClick={() => setQueue([])}
                className="text-[11px] font-bold text-red-500 hover:text-red-400 transition flex items-center gap-0.5"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Liste queue */}
          <div
            className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5"
            style={{ overscrollBehavior: 'contain', scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
          >
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                  <Music2 size={16} className="text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-700 italic">
                  La file est vide — ajoutez des titres via le menu ···
                </p>
              </div>
            ) : (
              queue.map((song, i) => {
                const isCurrent = currentSong?._id === song._id;
                return (
                  <div
                    key={`${song._id}-${i}`}
                    className={`
                      flex items-center gap-3 px-2 py-2.5 rounded-xl
                      transition-all duration-150 cursor-pointer group
                      ${isCurrent
                        ? 'bg-zinc-800/80 ring-1 ring-zinc-700/50'
                        : 'hover:bg-zinc-900/80'
                      }
                    `}
                    onClick={() => playFromQueue(i)}
                  >
                    {/* Numéro de position */}
                    <span className="text-[10px] text-zinc-700 font-mono w-4 text-center shrink-0 group-hover:opacity-0 transition-opacity">
                      {i + 1}
                    </span>

                    {/* Thumbnail */}
                    <SongThumb
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={isCurrent}
                      onClick={() => playFromQueue(i)}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-red-400' : 'text-zinc-200 group-hover:text-white'} transition`}>
                        {song.titre}
                      </p>
                      <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
                    </div>

                    {/* Actions au hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition"
                        aria-label="Retirer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </aside>
    </>
  );
};

export default MoozikRightPanel;