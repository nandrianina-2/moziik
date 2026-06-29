import React, { useState, useEffect } from 'react';
import { Globe, Music, Play, Pause, Heart, ListPlus, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API } from '../config/api';

const PublicPlaylistsView = ({ currentSong, setCurrentSong, setIsPlaying, isPlaying }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/user-playlists/public`)
      .then(r => r.json())
      .then(d => setPlaylists(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-red-500" size={28} />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
          <Globe size={20} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Playlists publiques</h2>
          <p className="text-zinc-500 text-sm">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''} partagée{playlists.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <Globe size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-bold mb-1">Aucune playlist publique</p>
          <p className="text-sm">Les utilisateurs peuvent rendre leurs playlists publiques depuis leur compte.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(p => {
            const cover = p.musiques?.[0]?.image;
            const songCount = p.musiques?.length || 0;
            return (
              <Link key={p._id} to={`/my-playlist/${p._id}`}
                className="group bg-zinc-900/50 hover:bg-zinc-800/70 border border-zinc-800/50 hover:border-zinc-700 rounded-2xl p-4 transition flex gap-4">
                {/* Cover */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0 relative">
                  {cover
                    ? <img src={cover} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-zinc-600" /></div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{p.nom}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                    <Users size={10} /> {p.userId?.nom || 'Utilisateur'}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2">{songCount} titre{songCount !== 1 ? 's' : ''}</p>
                  {/* Mini previews */}
                  {p.musiques?.slice(0, 3).length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {p.musiques.slice(0, 3).map((s, i) => (
                        <img key={i} src={s.image} className="w-5 h-5 rounded object-cover opacity-60" alt="" />
                      ))}
                      {songCount > 3 && <span className="text-[9px] text-zinc-600 self-center ml-0.5">+{songCount - 3}</span>}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicPlaylistsView;
