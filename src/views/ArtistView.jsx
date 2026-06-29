import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, Mic2, Disc3, Music, CheckCircle, Star,
  UserPlus, UserCheck, Clock, Users, Play, Pause,
  ExternalLink, Calendar, ListMusic, Shuffle
} from 'lucide-react';
import { FaInstagram, FaYoutube } from 'react-icons/fa';

import { API } from '../config/api';
import SongRow from '../components/music/SongRow';
import { TipButton } from '../components/MonetisationComponents';

// ── Badge certifié ─────────────────────────────────────────────────
const CertBadge = ({ level }) => {
  if (!level) return null;
  return level === 'gold'
    ? <span title="Artiste certifié Or"
        className="inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[9px] font-black px-2 py-0.5 rounded-full">
        <Star size={8} fill="currentColor"/> GOLD
      </span>
    : <span title="Artiste vérifié"
        className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full">
        <CheckCircle size={8}/> VÉRIFIÉ
      </span>;
};

// ── Countdown sortie ────────────────────────────────────────────────
const Countdown = ({ releaseAt }) => {
  const [diff, setDiff] = useState(new Date(releaseAt) - Date.now());
  useEffect(() => {
    const t = setInterval(() => setDiff(new Date(releaseAt) - Date.now()), 1000);
    return () => clearInterval(t);
  }, [releaseAt]);
  if (diff <= 0) return <span className="text-green-400 text-xs font-bold">Disponible !</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="flex items-center gap-2">
      {[['J', d], ['H', h], ['M', m], ['S', s]].map(([l, v]) => (
        <div key={l} className="text-center">
          <div className="text-lg font-black text-white tabular-nums w-10 bg-zinc-800 rounded-lg py-1">
            {String(v).padStart(2, '0')}
          </div>
          <div className="text-[9px] text-zinc-600 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
};

// ── Composant principal ─────────────────────────────────────────────
const ArtistView = ({
  setCurrentSong, setIsPlaying, currentSong, isPlaying, toggleLike,
  addToQueue, setQueue, token, isLoggedIn, userNom, isAdmin, isArtist, userArtistId,
  playlists, userPlaylists, onAddToUserPlaylist, ajouterAPlaylist,
  onDeleted, onRefresh, onTogglePlaylistVisibility,
  // ← playAll vient directement de App.jsx (déjà correct)
  playAll,
}) => {
  const { id } = useParams();
  const [data, setData]             = useState(null);
  const [albums, setAlbums]         = useState([]);
  const [cert, setCert]             = useState(null);
  const [followInfo, setFollowInfo] = useState({ count: 0, following: false });
  const [featurings, setFeaturings] = useState([]);
  const [smartLink, setSmartLink]   = useState(null);
  const [scheduled, setScheduled]   = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [certLoading, setCertLoading]     = useState(false);
  const [tab, setTab]               = useState('songs');
  const [shuffleActive, setShuffleActive] = useState(false);

  const isOwnProfile = isArtist && String(userArtistId) === String(id);
  const canManage    = isAdmin || isOwnProfile;

  const songs = data?.songs ?? [];

  // ── Indique si le lecteur joue un titre de CET artiste ─────────
  const isCurrentArtistPlaying =
    currentSong && songs.some(s => String(s._id) === String(currentSong._id)) && isPlaying;

  // ── Fetch données artiste ───────────────────────────────────────
  useEffect(() => {
    setData(null);
    Promise.all([
      fetch(`${API}/artists/${id}`).then(r => r.json()),
      fetch(`${API}/albums?artisteId=${id}`).then(r => r.json()).catch(() => []),
      fetch(`${API}/artists/${id}/certification`).then(r => r.json()).catch(() => null),
      fetch(`${API}/artists/${id}/follow`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then(r => r.json()).catch(() => ({ count: 0, following: false })),
      fetch(`${API}/artists/${id}/featurings`).then(r => r.json()).catch(() => []),
      fetch(`${API}/a/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([artistData, albumData, certData, followData, feats, sl]) => {
      setData(artistData);
      setAlbums(Array.isArray(albumData) ? albumData : []);
      setCert(certData);
      setFollowInfo(followData || { count: 0, following: false });
      setFeaturings(Array.isArray(feats) ? feats : []);
      if (sl?.artist) setSmartLink(sl);
    });

    if (canManage && token) {
      fetch(`${API}/artists/${id}/schedule`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setScheduled(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }, [id]);

  // ── Follow ──────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!isLoggedIn) return;
    setFollowLoading(true);
    const res = await fetch(`${API}/artists/${id}/follow`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).catch(() => null);
    if (res) setFollowInfo(prev => ({
      count: prev.count + (res.following ? 1 : -1),
      following: res.following,
    }));
    setFollowLoading(false);
  };

  // ── Certification ───────────────────────────────────────────────
  const handleRequestCert = async () => {
    if (!canManage) return;
    setCertLoading(true);
    const res = await fetch(`${API}/artists/${id}/certification`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).catch(() => null);
    if (res) setCert(res);
    setCertLoading(false);
  };

  // ── Lecture d'un titre → reconstruit la queue depuis ce titre ───
  // On passe l'index de départ à playAll pour respecter l'ordre de la liste
  const handlePlaySong = useCallback((song) => {
    const index = songs.findIndex(s => String(s._id) === String(song._id));
    playAll(songs, index >= 0 ? index : 0);
  }, [songs, playAll]);

  // ── Lire tout depuis le début ───────────────────────────────────
  const handlePlayAll = useCallback(() => {
    if (!songs.length) return;
    playAll(songs, 0);
  }, [songs, playAll]);

  // ── Lecture aléatoire ───────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setShuffleActive(prev => !prev);
    playAll(shuffled, 0);
  }, [songs, playAll]);

  // ── Ajouter tous les titres à la file d'attente ─────────────────
  const handleAddAllToQueue = useCallback(() => {
    if (!songs.length || !addToQueue) return;
    songs.forEach(song => addToQueue(song));
  }, [songs, addToQueue]);

  if (!data) return (
    <div className="p-8 text-zinc-500 flex items-center gap-2">
      <Loader2 className="animate-spin" size={16}/> Chargement...
    </div>
  );

  const { artist } = data;

  // Props partagés avec SongRow
  const songProps = {
    setCurrentSong,
    setIsPlaying,
    currentSong,
    isPlaying,
    toggleLike,
    addToQueue,
    token,
    isLoggedIn,
    userNom,
    isAdmin,
    isArtist,
    userArtistId,
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

      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-5 md:gap-6 mb-8
                      bg-gradient-to-t from-zinc-900/50 to-red-900/20 p-5 md:p-7 rounded-3xl">

        {/* Photo artiste */}
        <div className="w-28 h-28 md:w-44 md:h-44 bg-zinc-800 rounded-2xl shadow-2xl
                        flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
          {artist.image
            ? <img src={artist.image} className="w-full h-full object-cover" alt={artist.nom}/>
            : <Mic2 size={48} className="text-red-600"/>}
        </div>

        {/* Infos + actions */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Artiste</p>

          {/* Nom + badge */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h2 className="text-3xl md:text-5xl font-black">{artist.nom}</h2>
            {(artist.certified || cert?.status === 'approved') && (
              <CertBadge level={artist.certLevel || cert?.level || 'blue'}/>
            )}
          </div>

          {/* Bio */}
          {artist.bio && (
            <p className="text-zinc-400 text-sm mb-3 max-w-xl line-clamp-2">{artist.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Music size={12}/> {songs.length} titre{songs.length > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Disc3 size={12}/> {albums.length} album{albums.length > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-zinc-300">
              <Users size={12}/> {followInfo.count.toLocaleString()} abonné{followInfo.count > 1 ? 's' : ''}
            </span>
          </div>

          {/* ── Boutons lecture ── */}
          {songs.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">

              {/* Lire tout / Pause */}
              <button
                onClick={isCurrentArtistPlaying ? () => setIsPlaying(false) : handlePlayAll}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                            transition-all active:scale-95 shadow-lg ${
                  isCurrentArtistPlaying
                    ? 'bg-white text-zinc-950 shadow-white/20 hover:bg-zinc-100'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 hover:shadow-red-500/50'
                }`}
              >
                {isCurrentArtistPlaying
                  ? <><Pause size={16} fill="currentColor"/> Pause</>
                  : <><Play  size={16} fill="currentColor"/> Lire tout</>}
              </button>

              {/* Aléatoire */}
              <button
                onClick={handleShuffle}
                title="Lecture aléatoire"
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

              {/* Ajouter tout à la file */}
              {addToQueue && (
                <button
                  onClick={handleAddAllToQueue}
                  title="Ajouter tous les titres à la file d'attente"
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

          {/* ── Autres actions (follow, tip, certif, réseaux) ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {isLoggedIn && !isOwnProfile && (
              <>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl
                             bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10
                             transition active:scale-95"
                >
                  {followLoading
                    ? <Loader2 size={13} className="animate-spin"/>
                    : followInfo.following
                      ? <><UserCheck size={13}/> Abonné</>
                      : <><UserPlus  size={13}/> S'abonner</>}
                </button>

                <TipButton artistId={id} artistNom={artist.nom} token={token} isLoggedIn={isLoggedIn}/>
              </>
            )}

            {smartLink && (
              <a
                href={`${window.location.origin}/a/${smartLink.slug || id}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl
                           bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                <ExternalLink size={13}/>
                moozik.app/a/{smartLink.slug || artist.nom.toLowerCase().replace(/\s/g, '')}
              </a>
            )}

            {isOwnProfile && !artist.certified
              && cert?.status !== 'approved' && cert?.status !== 'pending' && (
              <button
                onClick={handleRequestCert}
                disabled={certLoading}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl
                           bg-blue-600/20 border border-blue-600/30 text-blue-400
                           hover:bg-blue-600/30 transition"
              >
                {certLoading
                  ? <Loader2 size={12} className="animate-spin"/>
                  : <CheckCircle size={12}/>}
                Demander la certification
              </button>
            )}

            {isOwnProfile && cert?.status === 'pending' && (
              <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20
                               px-3 py-2 rounded-xl flex items-center gap-1.5">
                <Clock size={12}/> Certification en attente
              </span>
            )}

            {smartLink?.socialLinks
              && Object.entries(smartLink.socialLinks)
                  .filter(([, v]) => v)
                  .map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noreferrer"
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition"
                title={k}>
                {k === 'instagram' ? <FaInstagram size={15}/> : k === 'youtube' ? <FaYoutube size={15}/> : <ExternalLink size={13}/>}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Planning (admin / propriétaire) ── */}
      {canManage && scheduled.length > 0 && (
        <div className="mb-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-zinc-300">
            <Calendar size={15} className="text-orange-400"/> Sorties programmées
          </h3>
          <div className="space-y-3">
            {scheduled.map(r => (
              <div key={r._id} className="flex items-center gap-4 p-3 bg-zinc-800/40 rounded-xl">
                {r.songId?.image && (
                  <img src={r.songId.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt=""/>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{r.songId?.titre}</p>
                  <p className="text-[10px] text-zinc-500">
                    Sortie : {new Date(r.releaseAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <Countdown releaseAt={r.releaseAt}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-zinc-900/40 rounded-xl p-1 mb-6 border border-zinc-800/50">
        {[
          ['songs',      `Titres (${songs.length})`],
          ['albums',     `Albums (${albums.length})`],
          ['featurings', `Featurings (${featurings.length})`],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === k ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Tab : Titres ── */}
      {tab === 'songs' && (
        <div className="flex flex-col gap-1">
          {songs.length === 0
            ? <p className="p-8 text-zinc-600 text-sm text-center italic">Aucun titre publié</p>
            : songs.map((song, index) => (
              <SongRow
                key={song._id}
                song={song}
                index={index}
                {...songProps}
                // ← clic sur une ligne → lecture depuis ce titre avec toute la liste
                onPlay={() => handlePlaySong(song)}
              />
            ))}
        </div>
      )}

      {/* ── Tab : Albums ── */}
      {tab === 'albums' && (
        albums.length === 0
          ? <p className="p-8 text-zinc-600 text-sm text-center italic">Aucun album</p>
          : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map(album => (
                <Link key={album._id} to={`/album/${album._id}`} className="group">
                  <div className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden shadow-lg mb-2
                                  group-hover:scale-105 transition">
                    {album.image
                      ? <img src={album.image} className="w-full h-full object-cover" alt=""/>
                      : <Disc3 size={32} className="text-indigo-400 m-auto mt-[40%]"/>}
                  </div>
                  <p className="text-sm font-bold truncate">{album.titre}</p>
                  <p className="text-[10px] text-zinc-500">{album.annee}</p>
                </Link>
              ))}
            </div>
      )}

      {/* ── Tab : Featurings ── */}
      {tab === 'featurings' && (
        featurings.length === 0
          ? <p className="p-8 text-zinc-600 text-sm text-center italic">Aucun featuring officiel</p>
          : <div className="flex flex-col gap-2">
              {featurings.map(feat => {
                const isMain  = String(feat.mainArtistId?._id) === String(id);
                const partner = isMain ? feat.featArtistId : feat.mainArtistId;
                const song    = feat.songId;
                if (!song) return null;
                return (
                  <div
                    key={feat._id}
                    onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition group"
                  >
                    <img src={song.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt=""/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{song.titre}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full uppercase">
                          {feat.role}
                        </span>
                        {partner && (
                          <Link
                            to={`/artist/${partner._id}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition"
                          >
                            <img src={partner.image} className="w-4 h-4 rounded-full object-cover" alt=""/>
                            {partner.nom}
                            {partner.certified && <CheckCircle size={9} className="text-blue-400"/>}
                          </Link>
                        )}
                      </div>
                    </div>
                    <Play size={13} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition shrink-0"/>
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
};

export default ArtistView;