import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Globe, Lock, Heart, ListPlus, Trash2, Play, Pause, Shuffle, ListMusic } from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';

const UserPlaylistView = ({
  token, setCurrentSong, setIsPlaying, currentSong, isPlaying,
  toggleLike, addToQueue, setQueue, isOwner, isLoggedIn, userNom,
  playAll,
}) => {
  const { id } = useParams();
  const [playlist, setPlaylist]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [shuffleActive, setShuffleActive] = useState(false);
  const { confirmDialog, ask, close } = useConfirm();

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/user-playlists/${id}`, { headers })
      .then(r => r.json())
      .then(data => { setPlaylist(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, token]);

  const songs = playlist?.musiques ?? [];

  const isCurrentPlaylistPlaying =
    currentSong && songs.some(s => String(s._id) === String(currentSong._id)) && isPlaying;

  // ── Lire tout depuis le début ──────────────────────────────────
  const handlePlayAll = useCallback(() => {
    if (!songs.length) return;
    playAll(songs, 0);
  }, [songs, playAll]);

  // ── Clic sur un titre → lecture depuis ce titre ────────────────
  const handlePlaySong = useCallback((song) => {
    const index = songs.findIndex(s => String(s._id) === String(song._id));
    playAll(songs, index >= 0 ? index : 0);
  }, [songs, playAll]);

  // ── Lecture aléatoire ──────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setShuffleActive(prev => !prev);
    playAll(shuffled, 0);
  }, [songs, playAll]);

  // ── Ajouter tout à la file ─────────────────────────────────────
  const handleAddAllToQueue = useCallback(() => {
    if (!songs.length || !addToQueue) return;
    songs.forEach(song => addToQueue(song));
  }, [songs, addToQueue]);

  // ── Retirer un titre ──────────────────────────────────────────
  const removeFromPlaylist = (songId, titre) => {
    ask({
      title: `Retirer "${titre}" de la playlist ?`,
      confirmLabel: 'Retirer',
      variant: 'warning',
      onConfirm: async () => {
        await fetch(`${API}/user-playlists/${id}/remove/${songId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaylist(prev => ({
          ...prev,
          musiques: prev.musiques.filter(s => s._id !== songId),
        }));
      },
    });
  };

  if (loading) return (
    <div className="p-8 text-zinc-500 flex items-center gap-2">
      <Loader2 className="animate-spin" size={16}/> Chargement...
    </div>
  );
  if (!playlist) return (
    <div className="p-8 text-zinc-500">Playlist introuvable ou accès refusé.</div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <ConfirmDialog config={confirmDialog} onClose={close}/>

      {/* ── Hero ── */}
      <div className="flex items-end gap-4 md:gap-6 mb-8
                      bg-gradient-to-t from-zinc-900/50 to-purple-900/20
                      p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-purple-900/30 rounded-2xl shadow-2xl
                        flex items-center justify-center border border-purple-500/20 shrink-0">
          {playlist.isPublic
            ? <Globe size={48} className="text-purple-400"/>
            : <Lock  size={48} className="text-purple-400"/>}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Ma Playlist</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
              playlist.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
            }`}>
              {playlist.isPublic ? 'Publique' : 'Privée'}
            </span>
          </div>

          <h2 className="text-2xl md:text-5xl font-black mb-2 truncate">{playlist.nom}</h2>
          <p className="text-zinc-500 text-xs mb-4">
            {songs.length} titre{songs.length !== 1 ? 's' : ''}
          </p>

          {/* Boutons lecture */}
          {songs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={isCurrentPlaylistPlaying ? () => setIsPlaying(false) : handlePlayAll}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                            transition-all active:scale-95 shadow-lg ${
                  isCurrentPlaylistPlaying
                    ? 'bg-white text-zinc-950 shadow-white/20 hover:bg-zinc-100'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30 hover:shadow-purple-500/50'
                }`}
              >
                {isCurrentPlaylistPlaying
                  ? <><Pause size={16} fill="currentColor"/> Pause</>
                  : <><Play  size={16} fill="currentColor"/> Lire tout</>}
              </button>

              <button
                onClick={handleShuffle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border
                            transition-all active:scale-95 ${
                  shuffleActive
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <Shuffle size={15}/>
                <span className="hidden sm:inline">Aléatoire</span>
              </button>

              {addToQueue && (
                <button
                  onClick={handleAddAllToQueue}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border
                             bg-white/5 border-white/10 text-zinc-400 hover:text-white
                             hover:border-white/20 hover:bg-white/8 transition-all active:scale-95"
                >
                  <ListMusic size={15}/>
                  <span className="hidden sm:inline">File d'attente</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Liste des titres ── */}
      <div className="flex flex-col gap-1">
        {songs.length === 0 ? (
          <p className="p-8 text-zinc-500 italic text-center">
            Playlist vide. Ajoutez des musiques depuis la bibliothèque.
          </p>
        ) : (
          songs.map((song, index) => (
            <div
              key={song._id}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition ${
                currentSong?._id === song._id ? 'bg-purple-600/10' : 'hover:bg-white/5'
              }`}
              onClick={() => handlePlaySong(song)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-zinc-600 font-mono text-xs w-4 shrink-0">{index + 1}</span>
                <img src={song.image} className="w-10 h-10 rounded-md object-cover shrink-0" alt=""/>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    currentSong?._id === song._id ? 'text-purple-400' : ''
                  }`}>
                    {song.titre}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition shrink-0 ml-3">
                <button onClick={e => { e.stopPropagation(); toggleLike(song._id); }}>
                  <Heart
                    size={16}
                    fill={song.liked ? 'red' : 'none'}
                    className={song.liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-400 transition'}
                  />
                </button>
                <button onClick={e => { e.stopPropagation(); addToQueue(song); }}>
                  <ListPlus size={16} className="text-zinc-500 hover:text-white transition"/>
                </button>
                {isOwner && (
                  <button onClick={e => { e.stopPropagation(); removeFromPlaylist(song._id, song.titre); }}>
                    <Trash2 size={14} className="text-zinc-600 hover:text-red-500 transition"/>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserPlaylistView;