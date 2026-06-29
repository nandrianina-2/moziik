import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play, Pause, Music, Disc3, Loader2, CheckCircle, Star, ExternalLink, Users, UserPlus, UserCheck, Mic2
} from 'lucide-react';
import { API } from '../config/api';
import { FaInstagram, FaYoutube, FaXTwitter, FaFacebook, FaTiktok } from 'react-icons/fa6';

// Icônes réseaux sociaux
const SocialIcon = ({ network }) => {
  const icons = {
    instagram: <FaInstagram size={18} />,
    youtube:   <FaYoutube size={18} />,
    twitter:   <FaXTwitter size={18} />,
    facebook:  <FaFacebook size={18} />,
    tiktok:    <FaTiktok size={18} />,
  };
  return icons[network] || <ExternalLink size={16} />;
};

const SmartLinkPage = ({ token, isLoggedIn, setCurrentSong, setIsPlaying, currentSong, isPlaying }) => {
  const { slug } = useParams();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [followInfo, setFollowInfo] = useState({ count: 0, following: false });
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab]   = useState('songs');

  useEffect(() => {
    fetch(`${API}/a/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d);
        if (d?.artist?._id && isLoggedIn && token) {
          fetch(`${API}/artists/${d.artist._id}/follow`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null).then(fi => fi && setFollowInfo(fi)).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Track clic
    fetch(`${API}/a/${slug}/click`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  const handleFollow = async () => {
    if (!isLoggedIn || !data?.artist?._id) return;
    setFollowLoading(true);
    const res = await fetch(`${API}/artists/${data.artist._id}/follow`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).catch(() => null);
    if (res) setFollowInfo(prev => ({ count: prev.count + (res.following ? 1 : -1), following: res.following }));
    setFollowLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-red-500" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-600 gap-3">
      <Music size={40} className="opacity-20"/>
      <p className="text-sm">Lien introuvable ou expiré</p>
      <Link to="/" className="text-xs text-red-500 hover:underline">← Retour à MOOZIK</Link>
    </div>
  );

  const { artist, songs, albums, socialLinks } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* ── Header artiste ── */}
      <div className="relative overflow-hidden">
        {/* Background blur */}
        {artist.image && (
          <div className="absolute inset-0">
            <img src={artist.image} className="w-full h-full object-cover opacity-20 blur-3xl scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-zinc-900"/>
          </div>
        )}
        <div className="relative max-w-lg mx-auto px-5 py-12 text-center">
          {/* Photo */}
          <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800">
            {artist.image
              ? <img src={artist.image} className="w-full h-full object-cover" alt="" />
              : <Mic2 size={40} className="text-zinc-600 m-auto mt-8"/>
            }
          </div>
          {/* Nom + badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-black">{artist.nom}</h1>
            {artist.certified && (
              artist.certLevel === 'gold'
                ? <Star size={18} className="text-yellow-400" fill="currentColor"/>
                : <CheckCircle size={18} className="text-blue-400"/>
            )}
          </div>
          {/* Abonnés */}
          <p className="text-zinc-400 text-sm mb-4 flex items-center justify-center gap-1.5">
            <Users size={13}/> {followInfo.count.toLocaleString()} abonné{followInfo.count > 1 ? 's' : ''}
          </p>
          {/* Bio */}
          {(data.customBio || artist.bio) && (
            <p className="text-zinc-400 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
              {data.customBio || artist.bio}
            </p>
          )}
          {/* Bouton suivre */}
          <div className="flex items-center justify-center gap-3">
            {isLoggedIn && (
              <button onClick={handleFollow} disabled={followLoading}
                className={`flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-full transition active:scale-95 ${
                  followInfo.following
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}>
                {followLoading ? <Loader2 size={14} className="animate-spin"/>
                  : followInfo.following ? <><UserCheck size={14}/> Abonné</> : <><UserPlus size={14}/> S'abonner</>
                }
              </button>
            )}
            <Link to={`/artist/${artist._id}`}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10">
              Voir le profil
            </Link>
          </div>
          {/* Réseaux sociaux */}
          {socialLinks && Object.entries(socialLinks).filter(([,v]) => v).length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              {Object.entries(socialLinks).filter(([,v]) => v).map(([k, url]) => (
                <a key={k} href={url} target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-zinc-300 hover:text-white">
                  <SocialIcon network={k}/>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="max-w-lg mx-auto px-4 pb-16">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/60 rounded-xl p-1 mb-6 border border-zinc-800/50">
          {[['songs',`Titres (${songs.length})`],['albums',`Albums (${albums.length})`]].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${activeTab===k?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Titres */}
        {activeTab === 'songs' && (
          <div className="space-y-2">
            {songs.map((song, i) => {
              const isActive = currentSong?._id === song._id;
              return (
                <div key={song._id}
                  onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition group ${isActive ? 'bg-red-600/15 border border-red-600/30' : 'bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent'}`}>
                  <div className="relative shrink-0">
                    <img src={song.image} className="w-11 h-11 rounded-xl object-cover" alt="" />
                    <div className={`absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center transition ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isActive && isPlaying ? <Pause fill="white" size={14}/> : <Play fill="white" size={14} className="ml-0.5"/>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>{song.titre}</p>
                    <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">{song.plays?.toLocaleString()} 🎧</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Albums */}
        {activeTab === 'albums' && (
          <div className="grid grid-cols-2 gap-4">
            {albums.map(album => (
              <Link key={album._id} to={`/album/${album._id}`} className="group">
                <div className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden mb-2 group-hover:scale-105 transition shadow-lg">
                  {album.image ? <img src={album.image} className="w-full h-full object-cover" alt="" /> : <Disc3 size={32} className="text-indigo-400 m-auto mt-[38%]"/>}
                </div>
                <p className="text-sm font-bold truncate">{album.titre}</p>
                <p className="text-[10px] text-zinc-500">{album.annee}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Footer MOOZIK */}
        <div className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white transition text-sm">
            <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center">
              <Music size={11} className="text-white"/>
            </div>
            Créé avec <span className="font-black text-zinc-400">MOOZIK</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SmartLinkPage;