import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Music, Play, Pause, Shuffle, ListMusic } from 'lucide-react';
import SongRow from '../components/music/SongRow';

const PlaylistView = ({
  playlists, setCurrentSong, setIsPlaying, currentSong, isPlaying,
  toggleLike, addToQueue, token, isLoggedIn, userNom,
  playAll,
}) => {
  const { id } = useParams();
  const playlist = playlists.find(p => p._id === id);
  const [shuffleActive, setShuffleActive] = useState(false);

  if (!playlist) return <div className="p-8 text-zinc-500">Playlist introuvable...</div>;

  const songs = playlist.musiques ?? [];

  const isCurrentPlaylistPlaying =
    currentSong && songs.some(s => String(s._id) === String(currentSong._id)) && isPlaying;

  const handlePlayAll = useCallback(() => {
    if (!songs.length) return;
    playAll(songs, 0);
  }, [songs, playAll]);

  const handlePlaySong = useCallback((song) => {
    const index = songs.findIndex(s => String(s._id) === String(song._id));
    playAll(songs, index >= 0 ? index : 0);
  }, [songs, playAll]);

  const handleShuffle = useCallback(() => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setShuffleActive(prev => !prev);
    playAll(shuffled, 0);
  }, [songs, playAll]);

  const handleAddAllToQueue = useCallback(() => {
    if (!songs.length || !addToQueue) return;
    songs.forEach(song => addToQueue(song));
  }, [songs, addToQueue]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Hero ── */}
      <div className="flex items-end gap-4 md:gap-6 mb-8
                      bg-gradient-to-t from-zinc-900/50 to-red-900/20
                      p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-zinc-800 rounded-2xl shadow-2xl
                        flex items-center justify-center border border-white/5 shrink-0">
          <Music size={48} className="text-red-600"/>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Playlist</p>
          <h2 className="text-2xl md:text-5xl font-black mb-3">{playlist.nom}</h2>
          <p className="text-zinc-400 text-sm mb-4">
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
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 hover:shadow-red-500/50'
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

      {/* ── Liste des titres ── */}
      <div className="flex flex-col gap-1">
        {songs.map((song, index) => (
          <SongRow
            key={song._id}
            song={song}
            index={index}
            currentSong={currentSong}
            setCurrentSong={setCurrentSong}
            setIsPlaying={setIsPlaying}
            isPlaying={isPlaying}
            toggleLike={toggleLike}
            addToQueue={addToQueue}
            token={token}
            isLoggedIn={isLoggedIn}
            userNom={userNom}
            onPlay={() => handlePlaySong(song)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;