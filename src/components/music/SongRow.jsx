import React, { useState, useRef, useEffect } from 'react';
import {
  Heart, ListPlus, Eye, MoreHorizontal, Trash2, Edit2,
  Plus, Check, X, Play, Pause, Globe, Lock, Camera,
  Loader2, Image as ImageIcon, Mic2, Disc3, AlertCircle, ShoppingCart,
  Tag, Radio
} from 'lucide-react';
import ReactionsBar from './ReactionsBar.jsx';
import CommentsSection from './CommentsSection.jsx';
import { API } from '../../config/api.js';
import { ShareButton } from '../social/SocialFeatures.jsx';
import ConfirmDialog, { useConfirm } from '../ui/ConfirmDialog.jsx';
import { SongPriceModal } from '../RevenueComponents';

// ════════════════════════════════════════════
// MODAL ÉDITION COMPLÈTE (Admin)
// ════════════════════════════════════════════
const EditSongModal = ({ song, token, onClose, onSaved }) => {
  const [titre, setTitre]       = useState(song.titre || '');
  const [artiste, setArtiste]   = useState(song.artiste || '');
  const [artisteId, setArtisteId] = useState(song.artisteId?._id || song.artisteId || '');
  const [albumId, setAlbumId]   = useState(song.albumId?._id || song.albumId || '');
  const [artists, setArtists]   = useState([]);
  const [albums, setAlbums]     = useState([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [imgFile, setImgFile]   = useState(null);
  const [imgPrev, setImgPrev]   = useState(song.image || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  // Moods / tags
  const [selectedMoods, setSelectedMoods] = useState(song.moods || []);
  const fileRef = useRef();

  const MOOD_OPTIONS = ['Chill','Énergie','Focus','Fête','Nostalgie','Romance','Triste','Motivant','Afrobeat','Gospel','Rap','RnB'];

  useEffect(() => {
    fetch(`${API}/artists`).then(r => r.json()).then(d => setArtists(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!artisteId) { setAlbums([]); setAlbumId(''); return; }
    fetch(`${API}/albums?artisteId=${artisteId}`)
      .then(r => r.json()).then(d => setAlbums(Array.isArray(d) ? d : [])).catch(() => {});
  }, [artisteId]);

  const filteredArtists = artists.filter(a =>
    !artistSearch || a.nom.toLowerCase().includes(artistSearch.toLowerCase())
  );

  const handleImg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader(); r.onload = () => setImgPrev(r.result); r.readAsDataURL(f);
  };

  const handleSelectArtist = (a) => {
    setArtisteId(a._id); setArtiste(a.nom); setArtistSearch(''); setAlbumId('');
  };

  const toggleMood = (mood) => {
    setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('titre', titre.trim());
      fd.append('artiste', artiste.trim());
      fd.append('artisteId', artisteId || '');
      fd.append('albumId', albumId || '');
      fd.append('moods', JSON.stringify(selectedMoods));
      if (imgFile) fd.append('image', imgFile);
      const res = await fetch(`${API}/songs/${song._id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      onSaved(data); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-350 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h4 className="font-black text-sm flex items-center gap-2">
            <Edit2 size={15} className="text-red-400" /> Modifier la musique
          </h4>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"><X size={15} /></button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">

          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                {imgPrev ? <img src={imgPrev} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={24} className="text-zinc-600 m-auto mt-6" />}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition">
                <Camera size={12} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
            </div>
            <div className="text-xs text-zinc-500">
              <p className="font-bold text-zinc-300 mb-0.5">Pochette</p>
              <p>JPG, PNG, WEBP · max 5 Mo</p>
              {imgFile && <p className="text-green-400 mt-1">✓ Nouvelle photo prête</p>}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Titre *</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} required
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
          </div>

          {/* Artiste */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Mic2 size={9} /> Artiste
            </label>
            {artisteId && (
              <div className="flex items-center gap-2 mb-2 bg-purple-600/10 border border-purple-600/20 rounded-xl px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-[10px] font-black text-purple-300">{artiste[0]}</div>
                <span className="text-sm font-bold text-purple-300 flex-1">{artiste}</span>
                <button type="button" onClick={() => { setArtisteId(''); setArtiste(''); setAlbums([]); setAlbumId(''); }} className="text-zinc-500 hover:text-white"><X size={13} /></button>
              </div>
            )}
            {!artisteId && (
              <>
                <input value={artistSearch} onChange={e => setArtistSearch(e.target.value)}
                  placeholder="Rechercher un artiste..."
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 mb-1" />
                {artistSearch && (
                  <div className="max-h-32 overflow-y-auto bg-zinc-800 rounded-xl border border-zinc-700">
                    {filteredArtists.length === 0
                      ? <p className="px-4 py-2 text-xs text-zinc-600 italic">Aucun artiste</p>
                      : filteredArtists.slice(0, 6).map(a => (
                        <button key={a._id} type="button" onClick={() => handleSelectArtist(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition text-left">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                            {a.image ? <img src={a.image} className="w-full h-full object-cover" alt="" /> : <Mic2 size={12} className="text-zinc-500 m-auto mt-0.5" />}
                          </div>
                          <span className="text-sm">{a.nom}</span>
                        </button>
                      ))}
                  </div>
                )}
                <input value={artiste} onChange={e => setArtiste(e.target.value)}
                  placeholder="Ou saisir le nom de l'artiste manuellement"
                  className="w-full bg-zinc-800/50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-zinc-600 text-zinc-400 placeholder-zinc-700 mt-1" />
              </>
            )}
          </div>

          {/* Album */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Disc3 size={9} /> Album (optionnel)
            </label>
            <select value={albumId} onChange={e => setAlbumId(e.target.value)}
              disabled={albums.length === 0}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white disabled:opacity-40">
              <option value="">Aucun album</option>
              {albums.map(a => <option key={a._id} value={a._id}>{a.titre} ({a.annee})</option>)}
            </select>
            {!artisteId && <p className="text-[10px] text-zinc-600 mt-1">Sélectionnez d'abord un artiste</p>}
          </div>

          {/* Moods / Tags */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Tag size={9} /> Ambiance / Mood
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_OPTIONS.map(mood => (
                <button key={mood} type="button" onClick={() => toggleMood(mood)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${
                    selectedMoods.includes(mood)
                      ? 'bg-red-600/20 border-red-500/50 text-red-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'
                  }`}>
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-xl">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 active:scale-[0.98]">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</> : <><Check size={14} /> Sauvegarder</>}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// SONG ROW
// ════════════════════════════════════════════
const SongRow = ({
  song, index, currentSong, setCurrentSong, setIsPlaying, toggleLike,
  addToQueue, token, isLoggedIn, userNom, isAdmin, isArtist, userArtistId,
  userId, playlists, userPlaylists, onAddToUserPlaylist, ajouterAPlaylist,
  onDeleted, onRefresh, isPlaying, onTogglePlaylistVisibility,
  // Radio infinie
  onInfiniteRadio,
}) => {
  // ── Tous les états en haut — AVANT tout return conditionnel ──
  const [menuOpen, setMenuOpen]             = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  // FIX: showPriceModal était déclaré ligne 275 (après utilisation ligne 370) → remonté ici
  const [showPriceModal, setShowPriceModal] = useState(false);

  const menuRef  = useRef();
  const isActive = currentSong?._id === song._id;
  const canManage = isAdmin || (isArtist && String(song.artisteId?._id || song.artisteId) === String(userArtistId));
  const { confirmDialog, ask, close: closeConfirm } = useConfirm();

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleDelete = () => {
    setMenuOpen(false);
    ask({
      title: `Supprimer "${song.titre}" ?`,
      message: 'Cette musique sera définitivement supprimée ainsi que ses commentaires et réactions.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        await fetch(`${API}/songs/${song._id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        if (onDeleted) onDeleted(song._id);
      }
    });
  };

  const handleToggleVisibility = async (playlist) => {
    try {
      const res = await fetch(`${API}/user-playlists/${playlist._id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublic: !playlist.isPublic })
      });
      if (res.ok && onTogglePlaylistVisibility) onTogglePlaylistVisibility();
    } catch {}
  };

  const myPlaylists    = userPlaylists || [];
  const adminPlaylists = isAdmin ? (playlists || []) : [];
  const allMyPlaylists = [...myPlaylists, ...adminPlaylists];

  const MOOD_COLORS = {
    'Chill': 'bg-blue-500/15 text-blue-400',
    'Énergie': 'bg-orange-500/15 text-orange-400',
    'Focus': 'bg-green-500/15 text-green-400',
    'Fête': 'bg-purple-500/15 text-purple-400',
    'Nostalgie': 'bg-amber-500/15 text-amber-400',
    'Romance': 'bg-pink-500/15 text-pink-400',
    'Triste': 'bg-indigo-500/15 text-indigo-400',
    'Motivant': 'bg-yellow-500/15 text-yellow-400',
  };

  return (
    <>
      <ConfirmDialog config={confirmDialog} onClose={closeConfirm} />

      {/* FIX: SongPriceModal sorti du menu déroulant (évite le portail imbriqué) */}
      {showPriceModal && (
        <SongPriceModal song={song} token={token} onClose={() => setShowPriceModal(false)} onSaved={() => {}} />
      )}

      {showEditModal && (
        <EditSongModal
          song={song} token={token}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { if (onRefresh) onRefresh(); setShowEditModal(false); }}
        />
      )}

      <div className={`p-3 rounded-xl transition-all duration-200 group relative ${
        isActive ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'
      }`}>
        <div className="flex items-center gap-3">

          {/* Index / Play indicator */}
          <div className="w-5 shrink-0 flex items-center justify-center">
            {isActive && isPlaying
              ? <div className="flex gap-0.5 items-end h-4">
                  <div className="w-0.5 bg-red-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ height: '60%' }} />
                  <div className="w-0.5 bg-red-500 rounded-full animate-[bounce_0.8s_0.15s_infinite]" style={{ height: '100%' }} />
                  <div className="w-0.5 bg-red-500 rounded-full animate-[bounce_0.8s_0.3s_infinite]" style={{ height: '40%' }} />
                </div>
              : <span className="text-zinc-600 font-mono text-xs group-hover:hidden">{index + 1}</span>
            }
            {!isActive && (
              <button className="hidden group-hover:flex items-center justify-center text-white"
                onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
                <Play size={12} fill="white" />
              </button>
            )}
          </div>

          {/* Cover */}
          <div className="relative shrink-0 cursor-pointer" onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
            <img src={song.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
            {isActive && isPlaying && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Pause size={12} fill="white" className="text-white" />
              </div>
            )}
          </div>

          {/* Info + mood tags */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
            <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>{song.titre}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
              {/* Mood tags */}
              {song.moods?.slice(0, 2).map(mood => (
                <span key={mood} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${MOOD_COLORS[mood] || 'bg-zinc-700 text-zinc-400'}`}>
                  {mood}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
            <button onClick={e => { e.stopPropagation(); toggleLike(song._id); }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <Heart size={14} fill={song.liked ? 'red' : 'none'}
                className={song.liked ? 'text-red-500' : 'text-zinc-400 hover:text-white'} />
            </button>
            <button onClick={e => { e.stopPropagation(); addToQueue(song); }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <ListPlus size={14} className="text-zinc-400 hover:text-white" />
            </button>
            {/* Radio infinie */}
            {onInfiniteRadio && (
              <button onClick={e => { e.stopPropagation(); onInfiniteRadio(song); }}
                title="Radio infinie à partir de ce titre"
                className="p-1.5 hover:bg-white/10 rounded-lg transition">
                <Radio size={14} className="text-zinc-400 hover:text-violet-400" />
              </button>
            )}
            <div onClick={e => e.stopPropagation()}
              className="p-1.5 hover:bg-white/10 rounded-lg transition flex items-center justify-center">
              <ShareButton song={song} size={14} />
            </div>
          </div>

          {/* Play count */}
          {song.plays > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[10px] text-zinc-700 shrink-0 group-hover:opacity-0 transition">
              <Eye size={9} /> {song.plays}
            </div>
          )}

          {/* Context menu */}
          {(canManage || isLoggedIn) && (
            <div className="relative shrink-0" ref={menuRef}>
              <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition opacity-100 md:opacity-0 md:group-hover:opacity-100">
                <MoreHorizontal size={14} className="text-zinc-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-100 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl py-1 min-w-50 overflow-hidden">

                  {isLoggedIn && (
                    <>
                      <button onClick={e => { e.stopPropagation(); setShowPlaylistPicker(!showPlaylistPicker); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition">
                        <Plus size={13} /> Ajouter à une playlist
                      </button>

                      {/* FIX: SongPriceModal trigger (le modal lui-même est hors du menu, plus haut) */}
                      {canManage && (
                        <button onClick={e => { e.stopPropagation(); setMenuOpen(false); setShowPriceModal(true); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition">
                          <ShoppingCart size={13}/> Gérer la vente
                        </button>
                      )}

                      {/* Radio infinie dans le menu */}
                      {onInfiniteRadio && (
                        <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onInfiniteRadio(song); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition">
                          <Radio size={13}/> Radio infinie
                        </button>
                      )}

                      {showPlaylistPicker && (
                        <div className="border-t border-zinc-800 py-1 max-h-48 overflow-y-auto">
                          {allMyPlaylists.length === 0
                            ? <p className="px-4 py-2 text-[11px] text-zinc-600 italic">Aucune playlist</p>
                            : allMyPlaylists.map(p => {
                              const isUserPl = myPlaylists.some(up => up._id === p._id);
                              return (
                                <div key={p._id} className="flex items-center gap-1 pr-2">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (isUserPl) onAddToUserPlaylist?.(p._id, song._id);
                                      else ajouterAPlaylist?.(p._id, song._id);
                                      setMenuOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-2 px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition text-left">
                                    {p.isPublic !== undefined
                                      ? p.isPublic ? <Globe size={10} className="text-green-500 shrink-0" /> : <Lock size={10} className="text-zinc-600 shrink-0" />
                                      : <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                                    }
                                    <span className="truncate">{p.nom}</span>
                                  </button>
                                  {isUserPl && (
                                    <button onClick={e => { e.stopPropagation(); handleToggleVisibility(p); }}
                                      title={p.isPublic ? 'Rendre privée' : 'Rendre publique'}
                                      className="p-1.5 rounded-lg hover:bg-white/10 transition shrink-0">
                                      {p.isPublic ? <Globe size={11} className="text-green-500" /> : <Lock size={11} className="text-zinc-600 hover:text-zinc-400" />}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </>
                  )}

                  {canManage && (
                    <div className="border-t border-zinc-800 mt-1 pt-1">
                      <button onClick={e => { e.stopPropagation(); setMenuOpen(false); setShowEditModal(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition">
                        <Edit2 size={13} /> Modifier
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pl-8 mt-0.5">
          <ReactionsBar songId={song._id} token={token} isLoggedIn={isLoggedIn} />
          <CommentsSection songId={song._id} token={token} userNom={userNom} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </>
  );
};

export default SongRow;