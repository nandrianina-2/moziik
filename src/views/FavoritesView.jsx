import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Loader2, Play, Pause, Shuffle, ListMusic } from 'lucide-react';
import SongRow from '../components/music/SongRow';
import { API } from '../config/api';

const FavoritesView = ({
  setCurrentSong, setIsPlaying, currentSong, isPlaying,
  toggleLike, addToQueue, setQueue, token, isLoggedIn, userNom,
  isAdmin, isArtist, userArtistId, userId,
  playlists, userPlaylists, onAddToUserPlaylist,
  ajouterAPlaylist, onDeleted, onRefresh, onTogglePlaylistVisibility,
  playAll,
}) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [shuffleActive, setShuffleActive] = useState(false);

  useEffect(() => {
    if (!token || !isLoggedIn) { setFavorites([]); return; }
    setLoading(true);
    fetch(`${API}/songs/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [token, isLoggedIn]);

  // Unlike → retire le titre de la liste localement
  const handleToggleLike = async (id) => {
    await toggleLike(id);
    setFavorites(prev => prev.filter(s => s._id !== id));
  };

  const isCurrentFavPlaying =
    currentSong && favorites.some(s => String(s._id) === String(currentSong._id)) && isPlaying;

  // ── Lire tout depuis le début ──────────────────────────────────
  const handlePlayAll = useCallback(() => {
    if (!favorites.length) return;
    playAll(favorites, 0);
  }, [favorites, playAll]);

  // ── Clic sur un titre → lecture depuis ce titre ────────────────
  const handlePlaySong = useCallback((song) => {
    const index = favorites.findIndex(s => String(s._id) === String(song._id));
    playAll(favorites, index >= 0 ? index : 0);
  }, [favorites, playAll]);

  // ── Lecture aléatoire ──────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (!favorites.length) return;
    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
    setShuffleActive(prev => !prev);
    playAll(shuffled, 0);
  }, [favorites, playAll]);

  // ── Ajouter tous les favoris à la file ────────────────────────
  const handleAddAllToQueue = useCallback(() => {
    if (!favorites.length || !addToQueue) return;
    favorites.forEach(song => addToQueue(song));
  }, [favorites, addToQueue]);

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-3">
      <Heart size={40} className="opacity-20"/>
      <p className="text-sm">Connectez-vous pour voir vos favoris</p>
    </div>
  );

  const songProps = {
    setCurrentSong,
    setIsPlaying,
    currentSong,
    isPlaying,
    toggleLike: handleToggleLike,
    addToQueue,
    token,
    isLoggedIn,
    userNom,
    isAdmin,
    isArtist,
    userArtistId,
    userId,
    playlists,
    userPlaylists,
    onAddToUserPlaylist,
    ajouterAPlaylist,
    onDeleted,
    onRefresh,
    onTogglePlaylistVisibility,
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-end gap-4 md:gap-6 mb-8
                      bg-linear-to-t from-zinc-900/50 to-red-900/40
                      p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-red-600/20 rounded-2xl shadow-2xl
                        flex items-center justify-center border border-red-500/20">
          <Heart size={48} className="text-red-600" fill="red"/>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Collection</p>
          <h2 className="text-2xl md:text-5xl font-black mb-3">Coups de cœur</h2>
          <p className="text-zinc-400 text-sm mb-4">
            {loading ? '…' : `${favorites.length} titre${favorites.length !== 1 ? 's' : ''} aimé${favorites.length !== 1 ? 's' : ''}`}
          </p>

          {/* Boutons lecture */}
          {!loading && favorites.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={isCurrentFavPlaying ? () => setIsPlaying(false) : handlePlayAll}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                            transition-all active:scale-95 shadow-lg ${
                  isCurrentFavPlaying
                    ? 'bg-white text-zinc-950 shadow-white/20 hover:bg-zinc-100'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 hover:shadow-red-500/50'
                }`}
              >
                {isCurrentFavPlaying
                  ? <><Pause size={16} fill="currentColor"/> Pause</>
                  : <><Play  size={16} fill="currentColor"/> Lire tout</>}
              </button>

              <button
                onClick={handleShuffle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border
                            transition-all active:scale-95 ${
                  shuffleActive
                    ? 'bg-red-500/15 border-red-500/40 text-red-400'
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2"/> Chargement...
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-zinc-600 gap-3">
              <Heart size={40} className="opacity-20"/>
              <p className="text-sm italic">Aucun favori pour le moment…</p>
              <p className="text-xs text-zinc-700">Appuyez sur ❤️ sur n'importe quelle musique</p>
            </div>
          ) : (
            favorites.map((song, index) => (
              <SongRow
                key={song._id}
                song={{ ...song, liked: true }}
                index={index}
                {...songProps}
                onPlay={() => handlePlaySong(song)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FavoritesView;