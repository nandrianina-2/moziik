import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Disc3, Plus, Heart, ListPlus, X, Play, Pause, Shuffle, ListMusic } from 'lucide-react';
import { API } from '../config/api';

const AlbumView = ({
  setCurrentSong, setIsPlaying, currentSong, isPlaying,
  toggleLike, addToQueue, token, isLoggedIn, userNom,
  isArtist, isAdmin, userArtistId,
  playAll,
}) => {
  const { id } = useParams();
  const [album, setAlbum]         = useState(null);
  const [allSongs, setAllSongs]   = useState([]);
  const [albumSongs, setAlbumSongs] = useState([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [shuffleActive, setShuffleActive] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/albums/${id}`).then(r => r.json()),
      fetch(`${API}/songs`).then(r => r.json()),
    ]).then(([albumData, songs]) => {
      setAlbum(albumData);
      const inAlbum = songs.filter(s => String(s.albumId) === String(id));
      setAlbumSongs(inAlbum);
      setAllSongs(songs);
      setLoading(false);
    });
  }, [id]);

  const addSongToAlbum = async (songId) => {
    await fetch(`${API}/albums/${id}/add/${songId}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    const songs = await fetch(`${API}/songs`).then(r => r.json());
    setAlbumSongs(songs.filter(s => String(s.albumId) === String(id)));
    setAllSongs(songs);
  };

  const removeSongFromAlbum = async (songId) => {
    await fetch(`${API}/albums/${id}/remove/${songId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setAlbumSongs(prev => prev.filter(s => s._id !== songId));
  };

  const canManage = isAdmin || (isArtist && album && String(album.artisteId) === String(userArtistId));
  const availableSongs = allSongs.filter(s =>
    !albumSongs.some(as => as._id === s._id) &&
    (!isArtist || String(s.artisteId) === String(userArtistId))
  );

  const isCurrentAlbumPlaying =
    currentSong && albumSongs.some(s => String(s._id) === String(currentSong._id)) && isPlaying;

  // ── Lire tout depuis le début ────────────────────────────────
  const handlePlayAll = useCallback(() => {
    if (!albumSongs.length) return;
    playAll(albumSongs, 0);
  }, [albumSongs, playAll]);

  // ── Clic sur un titre ────────────────────────────────────────
  const handlePlaySong = useCallback((song) => {
    const index = albumSongs.findIndex(s => String(s._id) === String(song._id));
    playAll(albumSongs, index >= 0 ? index : 0);
  }, [albumSongs, playAll]);

  // ── Lecture aléatoire ────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (!albumSongs.length) return;
    const shuffled = [...albumSongs].sort(() => Math.random() - 0.5);
    setShuffleActive(prev => !prev);
    playAll(shuffled, 0);
  }, [albumSongs, playAll]);

  // ── Ajouter tout à la file ───────────────────────────────────
  const handleAddAllToQueue = useCallback(() => {
    if (!albumSongs.length || !addToQueue) return;
    albumSongs.forEach(song => addToQueue(song));
  }, [albumSongs, addToQueue]);

  if (loading) return (
    <div className="p-8 text-zinc-500 flex items-center gap-2">
      <Loader2 className="animate-spin" size={16}/> Chargement...
    </div>
  );
  if (!album) return <div className="p-8 text-zinc-500">Album introuvable</div>;

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Hero ── */}
      <div className="flex items-end gap-4 md:gap-6 mb-8
                      bg-gradient-to-t from-zinc-900/50 to-indigo-900/20
                      p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-zinc-800 rounded-2xl shadow-2xl
                        flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
          {album.image
            ? <img src={album.image} className="w-full h-full object-cover" alt=""/>
            : <Disc3 size={48} className="text-indigo-400"/>}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
            Album · {album.annee}
          </p>
          <h2 className="text-2xl md:text-5xl font-black mb-1">{album.titre}</h2>
          <p className="text-zinc-400 text-sm">{album.artiste}</p>
          <p className="text-zinc-500 text-xs mt-1 mb-4">
            {albumSongs.length} titre{albumSongs.length !== 1 ? 's' : ''}
          </p>

          {/* Boutons lecture */}
          {albumSongs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={isCurrentAlbumPlaying ? () => setIsPlaying(false) : handlePlayAll}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                            transition-all active:scale-95 shadow-lg ${
                  isCurrentAlbumPlaying
                    ? 'bg-white text-zinc-950 shadow-white/20 hover:bg-zinc-100'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
                }`}
              >
                {isCurrentAlbumPlaying
                  ? <><Pause size={16} fill="currentColor"/> Pause</>
                  : <><Play  size={16} fill="currentColor"/> Lire tout</>}
              </button>

              <button
                onClick={handleShuffle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border
                            transition-all active:scale-95 ${
                  shuffleActive
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
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

      {/* ── Bouton ajout (admin/artiste) ── */}
      {canManage && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40
                       border border-indigo-600/30 text-indigo-300 px-4 py-2 rounded-xl transition"
          >
            <Plus size={14}/> Ajouter des titres
          </button>
        </div>
      )}

      {/* ── Panel ajout de titres ── */}
      {showAdd && availableSongs.length > 0 && (
        <div className="mb-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3">Sélectionner des titres :</p>
          {availableSongs.map(s => (
            <button key={s._id} onClick={() => addSongToAlbum(s._id)}
              className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition text-left">
              <img src={s.image} className="w-8 h-8 rounded object-cover shrink-0" alt=""/>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{s.titre}</p>
                <p className="text-[10px] text-zinc-500 truncate">{s.artiste}</p>
              </div>
              <Plus size={14} className="text-zinc-500 ml-auto shrink-0"/>
            </button>
          ))}
        </div>
      )}

      {/* ── Liste des titres ── */}
      <div className="flex flex-col gap-1">
        {albumSongs.length === 0
          ? <p className="p-8 text-zinc-500 italic">Aucun titre dans cet album.</p>
          : albumSongs.map((song, index) => (
            <div
              key={song._id}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition ${
                currentSong?._id === song._id ? 'bg-indigo-600/10' : 'hover:bg-white/5'
              }`}
              onClick={() => handlePlaySong(song)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-zinc-600 font-mono text-xs w-4 shrink-0">{index + 1}</span>
                <img src={song.image} className="w-10 h-10 rounded-md object-cover shrink-0" alt=""/>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    currentSong?._id === song._id ? 'text-indigo-400' : ''
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
                {canManage && (
                  <button onClick={e => { e.stopPropagation(); removeSongFromAlbum(song._id); }}>
                    <X size={14} className="text-zinc-600 hover:text-red-500 transition"/>
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AlbumView;