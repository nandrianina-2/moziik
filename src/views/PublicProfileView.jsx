import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Music, Heart, Globe, Play, Users, Disc3 } from 'lucide-react';
import { API } from '../config/api';
import { ProfileSkeleton } from '../components/ui/Skeletons';

const PublicProfileView = ({ currentSong, setCurrentSong, setIsPlaying, isPlaying, token }) => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playlists');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [profRes, plRes, favRes] = await Promise.all([
          fetch(`${API}/users/${userId}/profile`, { headers }),
          fetch(`${API}/users/${userId}/playlists`, { headers }),
          fetch(`${API}/users/${userId}/favorites`, { headers }),
        ]);
        if (profRes.ok) setProfile(await profRes.json());
        if (plRes.ok) setPlaylists(await plRes.json());
        if (favRes.ok) setFavorites(await favRes.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, [userId, token]);

  if (loading) return <div className="p-6"><ProfileSkeleton /></div>;
  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
      <Users size={40} className="mb-3 opacity-30" />
      <p>Profil introuvable</p>
    </div>
  );

  const avatarLetter = (profile.nom || profile.email || '?')[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header profil */}
      <div className="flex items-center gap-5 p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-zinc-800 flex items-center justify-center text-2xl font-black shrink-0 overflow-hidden shadow-xl">
          {profile.avatar
            ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
            : avatarLetter
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate">{profile.nom || 'Utilisateur'}</h1>
          <p className="text-zinc-500 text-sm mt-0.5 capitalize">{profile.role}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Globe size={12} /> {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1.5"><Heart size={12} /> {favorites.length} favori{favorites.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/40 rounded-xl p-1 border border-zinc-800/50">
        {[
          { key: 'playlists', icon: <Disc3 size={14} />, label: `Playlists (${playlists.length})` },
          { key: 'favorites', icon: <Heart size={14} />, label: `Favoris (${favorites.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === tab.key ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Playlists publiques */}
      {activeTab === 'playlists' && (
        <div className="space-y-2">
          {playlists.length === 0
            ? <p className="text-center text-zinc-600 py-10 text-sm">Aucune playlist publique</p>
            : playlists.map(pl => (
              <Link key={pl._id} to={`/my-playlist/${pl._id}`}
                className="flex items-center gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition group">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shrink-0">
                  <Music size={16} className="text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-red-400 transition">{pl.nom}</p>
                  <p className="text-[11px] text-zinc-600">{pl.songs?.length ?? 0} titre{pl.songs?.length !== 1 ? 's' : ''}</p>
                </div>
                <Globe size={12} className="text-green-500 shrink-0" />
              </Link>
            ))
          }
        </div>
      )}

      {/* Favoris */}
      {activeTab === 'favorites' && (
        <div className="space-y-1">
          {favorites.length === 0
            ? <p className="text-center text-zinc-600 py-10 text-sm">Aucun favori public</p>
            : favorites.map((song, i) => {
              const isActive = currentSong?._id === song._id;
              return (
                <div key={song._id}
                  onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition group ${
                    isActive ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'
                  }`}>
                  <span className="text-zinc-700 font-mono text-xs w-5 text-center shrink-0">{i + 1}</span>
                  <img src={song.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>{song.titre}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{song.artiste}</p>
                  </div>
                  <Play size={13} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
};

export default PublicProfileView;
