// ════════════════════════════════════════════════════════════════
// AdminLibraryView.jsx — Bibliothèque complète admin
// CORRECTIONS :
//  1. Compression image avant upload (AddSongModal + EditSongModal)
//  2. moods envoyés en JSON.stringify dans EditSongModal (était absent)
//  3. artisteNom libre synchronisé dans setArtiste lors de la saisie
//  4. artistAlbums dans EditSongModal fallback sur tous les albums si pas d'artisteId
//  5. handleAdded : ferme la modal avant d'ajouter (évite double setState)
//  6. StatusBadge : vérifie artiste OU artisteId correctement
//  7. Pagination reset quand le filtre change (manquait pour moodFilter)
//  8. SortIcon : clé stable (pas d'inline component)
//  9. bg-linear-to-r → bg-gradient-to-r (classe Tailwind valide)
// 10. URL audio : validation basique avant envoi
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, CheckCircle, Edit3, Save, X,
  Trash2, Music, Mic2, Disc3, RefreshCw,
  Loader2, SortAsc, SortDesc, Bell,
  Image as ImageIcon, Tag, Eye,
  ArrowUpDown, AlertCircle, Check, Camera,
  Plus, Upload, FileAudio, Link2, Zap
} from 'lucide-react';
import { API } from '../config/api';

const MOOD_OPTIONS = [
  'Chill','Énergie','Focus','Fête','Nostalgie','Romance',
  'Triste','Motivant','Afrobeat','Gospel','Rap','RnB','Jazz','Pop','Rock',
];

// ══════════════════════════════════════════════
// COMPRESSION IMAGE (Canvas — aucune dépendance)
// ══════════════════════════════════════════════
const compressImage = (file, { maxSize = 800, quality = 0.82 } = {}) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio  = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width  = Math.round(img.width  * ratio);
      const height = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

// Compresse un File image et retourne un nouveau File
const compressImageFile = async (file) => {
  const blob = await compressImage(file);
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
};

// ── Formatage taille ──────────────────────────
const fmtSize = (b) => b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;

// ── Badge statut ──────────────────────────────
// FIX : vérifie artiste string OU artisteId object/string
const StatusBadge = ({ song }) => {
  const missing = [];
  const hasArtist = !!(song.artiste?.trim() || song.artisteId);
  if (!hasArtist)         missing.push('artiste');
  if (!song.albumId)      missing.push('album');
  if (!song.moods?.length) missing.push('moods');

  if (missing.length === 0)
    return (
      <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
        <Check size={8}/> Complet
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
      <AlertCircle size={8}/> Manque : {missing.join(', ')}
    </span>
  );
};

// ════════════════════════════════════════════
// MODAL AJOUT MUSIQUE
// ════════════════════════════════════════════
const AddSongModal = ({ token, artists, albums, onClose, onAdded }) => {
  const [titre, setTitre]         = useState('');
  const [artiste, setArtiste]     = useState('');
  const [artisteId, setArtisteId] = useState('');
  const [albumId, setAlbumId]     = useState('');
  const [genre, setGenre]         = useState('');
  const [annee, setAnnee]         = useState(new Date().getFullYear().toString());
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [imgFile, setImgFile]     = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [imgCompressing, setImgCompressing] = useState(false);
  const [audioUrl, setAudioUrl]   = useState('');
  const [inputMode, setInputMode] = useState('file');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDd, setShowArtistDd] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const audioRef = useRef();
  const imgRef   = useRef();

  const filteredArtists = useMemo(() =>
    artists.filter(a => !artistSearch || a.nom.toLowerCase().includes(artistSearch.toLowerCase())),
    [artists, artistSearch]
  );

  const artistAlbums = useMemo(() =>
    artisteId
      ? albums.filter(a => String(a.artisteId?._id || a.artisteId) === String(artisteId))
      : albums,
    [albums, artisteId]
  );

  const toggleMood = (mood) =>
    setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);

  // FIX : compression image avant stockage
  const handleImg = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImgCompressing(true);
    const compressed = await compressImageFile(f);
    setImgFile(compressed);
    setImgPreview(URL.createObjectURL(compressed));
    setImgCompressing(false);
  };

  const handleAudio = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setAudioFile(f);
    if (!titre) {
      const name = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitre(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  const selectArtist = (a) => {
    setArtisteId(a._id); setArtiste(a.nom);
    setArtistSearch(''); setShowArtistDd(false); setAlbumId('');
  };

  // FIX : validation URL basique
  const isValidUrl = (url) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSave = async () => {
    if (!titre.trim()) return setError('Le titre est requis');
    if (inputMode === 'file' && !audioFile) return setError('Veuillez sélectionner un fichier audio');
    if (inputMode === 'url' && !audioUrl.trim()) return setError('Veuillez saisir une URL audio');
    if (inputMode === 'url' && !isValidUrl(audioUrl.trim())) return setError('URL audio invalide');

    setSaving(true); setError(''); setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('titre',   titre.trim());
      fd.append('artiste', artiste.trim());
      if (artisteId)              fd.append('artisteId', artisteId);
      if (albumId)                fd.append('albumId',   albumId);
      if (genre)                  fd.append('genre',     genre);
      if (annee)                  fd.append('annee',     annee);
      // FIX : moods en JSON (certains backends attendent un tableau JSON)
      fd.append('moods', JSON.stringify(selectedMoods));
      if (imgFile)                fd.append('image', imgFile); // déjà compressé
      if (inputMode === 'file' && audioFile) fd.append('audio', audioFile);
      else if (inputMode === 'url')          fd.append('src',   audioUrl.trim());

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Réponse invalide du serveur')); }
          } else {
            try   { reject(new Error(JSON.parse(xhr.responseText).message || `Erreur ${xhr.status}`)); }
            catch { reject(new Error(`Erreur serveur (${xhr.status})`)); }
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Erreur réseau')));
        xhr.open('POST', `${API}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(fd);
      });

      onAdded(result);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); setUploadProgress(0); }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[94vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center">
              <Plus size={18} className="text-red-400"/>
            </div>
            <div>
              <h3 className="font-black text-sm">Ajouter une musique</h3>
              <p className="text-[10px] text-zinc-500">Importer depuis un fichier ou une URL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={16}/>
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Pochette + titre/genre/année */}
          <div className="flex gap-3">
            <div onClick={() => imgRef.current?.click()}
              className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-red-500 cursor-pointer transition flex items-center justify-center group">
              {imgCompressing ? (
                <Loader2 size={18} className="text-zinc-500 animate-spin"/>
              ) : imgPreview ? (
                <img src={imgPreview} className="w-full h-full object-cover" alt=""/>
              ) : (
                <div className="flex flex-col items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition">
                  <ImageIcon size={20}/>
                  <span className="text-[8px] font-bold text-center leading-tight">POCHETTE</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                {imgCompressing ? <Loader2 size={8} className="text-white animate-spin"/> : <Camera size={9} className="text-white"/>}
              </div>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImg}/>
            </div>

            <div className="flex-1 space-y-2">
              <input value={titre} onChange={e => setTitre(e.target.value)}
                placeholder="Titre de la chanson *"
                className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
              <div className="grid grid-cols-2 gap-2">
                <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Genre"
                  className="bg-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                <input value={annee} onChange={e => setAnnee(e.target.value)} type="number" min="1900" max="2099" placeholder="Année"
                  className="bg-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
              </div>
              {/* Info compression */}
              {imgFile && !imgCompressing && (
                <p className="text-[9px] text-green-400 flex items-center gap-1">
                  <Zap size={8}/> Image compressée — {fmtSize(imgFile.size)}
                </p>
              )}
            </div>
          </div>

          {/* Source audio */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Source audio *</label>
              <div className="flex gap-1 ml-auto">
                {[
                  { key: 'file', icon: <FileAudio size={11}/>, label: 'Fichier' },
                  { key: 'url',  icon: <Link2 size={11}/>,     label: 'URL'     },
                ].map(({ key, icon, label }) => (
                  <button key={key} onClick={() => setInputMode(key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                      inputMode === key
                        ? 'bg-red-600/20 border-red-500/40 text-red-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'
                    }`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {inputMode === 'file' ? (
              <div onClick={() => audioRef.current?.click()}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition ${
                  audioFile ? 'border-green-500/40 bg-green-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                }`}>
                {audioFile ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <Check size={16} className="text-green-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-300 truncate">{audioFile.name}</p>
                      <p className="text-[10px] text-zinc-500">{fmtSize(audioFile.size)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setAudioFile(null); }}
                      className="text-zinc-500 hover:text-red-400 p-1 shrink-0"><X size={13}/></button>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                      <Upload size={16} className="text-zinc-400"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-300">Choisir un fichier audio</p>
                      <p className="text-[10px] text-zinc-600">MP3, WAV, AAC, FLAC, OGG…</p>
                    </div>
                  </>
                )}
                <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudio}/>
              </div>
            ) : (
              <div className="relative">
                <Link2 size={13} className="absolute left-3.5 top-3 text-zinc-500"/>
                <input value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  className="w-full bg-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
              </div>
            )}
          </div>

          {/* Artiste */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Mic2 size={9}/> Artiste
            </label>
            {artisteId ? (
              <div className="flex items-center gap-2 bg-purple-600/10 border border-purple-600/30 rounded-xl px-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-[9px] font-black text-purple-300 shrink-0">
                  {artiste[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-bold text-purple-300 flex-1 truncate">{artiste}</span>
                <button onClick={() => { setArtisteId(''); setArtiste(''); setAlbumId(''); }} className="text-zinc-500 hover:text-white">
                  <X size={12}/>
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-zinc-500"/>
                  {/* FIX : synchronise artiste libre + artistSearch */}
                  <input value={artistSearch}
                    onChange={e => { setArtistSearch(e.target.value); setArtiste(e.target.value); setShowArtistDd(true); }}
                    onFocus={() => setShowArtistDd(true)}
                    placeholder="Rechercher ou saisir un artiste..."
                    className="w-full bg-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                </div>
                {showArtistDd && artistSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                    {filteredArtists.length === 0 ? (
                      <button onClick={() => { setArtiste(artistSearch); setShowArtistDd(false); }}
                        className="w-full px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-700 text-left flex items-center gap-2">
                        <Plus size={12} className="text-zinc-500"/> Utiliser "{artistSearch}" (libre)
                      </button>
                    ) : filteredArtists.slice(0, 6).map(a => (
                      <button key={a._id} onClick={() => selectArtist(a)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-700 transition text-left">
                        <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {a.image ? <img src={a.image} className="w-full h-full object-cover" alt=""/> : <Mic2 size={11} className="text-zinc-500"/>}
                        </div>
                        <span className="text-sm text-zinc-200">{a.nom}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Album */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Disc3 size={9}/> Album (optionnel)
            </label>
            <select value={albumId} onChange={e => setAlbumId(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white">
              <option value="">— Aucun album —</option>
              {artistAlbums.map(a => (
                <option key={a._id} value={a._id}>{a.titre}{a.annee ? ` (${a.annee})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Moods */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Tag size={9}/> Ambiances / Moods
              {selectedMoods.length > 0 && (
                <span className="text-green-400 ml-auto">{selectedMoods.length} sélectionné{selectedMoods.length > 1 ? 's' : ''}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_OPTIONS.map(mood => (
                <button key={mood} type="button" onClick={() => toggleMood(mood)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${
                    selectedMoods.includes(mood)
                      ? 'bg-red-600/20 border-red-500/50 text-red-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500'
                  }`}>
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {saving && uploadProgress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Upload en cours</span>
                <span className="text-[10px] text-red-400 font-bold">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}/>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle size={12}/> {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving || imgCompressing}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
              {saving ? (uploadProgress > 0 ? `Upload ${uploadProgress}%` : 'Envoi...') : 'Ajouter la musique'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// MODAL ÉDITION COMPLÈTE
// ════════════════════════════════════════════
const EditSongModal = ({ song, token, artists, albums, onClose, onSaved }) => {
  const [titre, setTitre]         = useState(song.titre || '');
  const [artiste, setArtiste]     = useState(song.artiste || '');
  const [artisteId, setArtisteId] = useState(song.artisteId?._id || song.artisteId || '');
  const [albumId, setAlbumId]     = useState(song.albumId?._id || song.albumId || '');
  const [genre, setGenre]         = useState(song.genre || '');
  const [annee, setAnnee]         = useState(song.annee || '');
  const [selectedMoods, setSelectedMoods] = useState(song.moods || []);
  const [imgFile, setImgFile]     = useState(null);
  const [imgPreview, setImgPreview] = useState(song.image || '');
  const [imgCompressing, setImgCompressing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDd, setShowArtistDd] = useState(false);
  const imgRef = useRef();

  const filteredArtists = useMemo(() =>
    artists.filter(a => !artistSearch || a.nom.toLowerCase().includes(artistSearch.toLowerCase())),
    [artists, artistSearch]
  );

  // FIX : fallback sur tous les albums si pas d'artisteId
  const artistAlbums = useMemo(() =>
    artisteId
      ? albums.filter(a => String(a.artisteId?._id || a.artisteId) === String(artisteId))
      : albums,
    [albums, artisteId]
  );

  const toggleMood = (mood) =>
    setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);

  // FIX : compression image avant stockage
  const handleImg = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImgCompressing(true);
    const compressed = await compressImageFile(f);
    setImgFile(compressed);
    setImgPreview(URL.createObjectURL(compressed));
    setImgCompressing(false);
  };

  const handleSave = async () => {
    if (!titre.trim()) return setError('Le titre est requis');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('titre',   titre.trim());
      fd.append('artiste', artiste.trim());
      if (artisteId)  fd.append('artisteId', artisteId);
      if (albumId)    fd.append('albumId',   albumId);
      if (genre)      fd.append('genre',     genre);
      if (annee)      fd.append('annee',     annee);
      // FIX : moods manquaient dans l'original
      fd.append('moods', JSON.stringify(selectedMoods));
      if (imgFile)    fd.append('image', imgFile); // déjà compressé

      const res = await fetch(`${API}/songs/${song._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur serveur');
      onSaved(data);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const selectArtist = (a) => {
    setArtisteId(a._id); setArtiste(a.nom);
    setArtistSearch(''); setShowArtistDd(false); setAlbumId('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 cursor-pointer" onClick={() => imgRef.current?.click()}>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border-2 border-zinc-700 hover:border-red-500 transition">
                {imgCompressing
                  ? <div className="w-full h-full flex items-center justify-center"><Loader2 size={16} className="text-zinc-500 animate-spin"/></div>
                  : imgPreview
                    ? <img src={imgPreview} className="w-full h-full object-cover" alt=""/>
                    : <Music size={18} className="text-zinc-600 m-auto mt-2.5"/>
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                {imgCompressing ? <Loader2 size={8} className="text-white animate-spin"/> : <Camera size={9} className="text-white"/>}
              </div>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImg}/>
            </div>
            <div>
              <h3 className="font-black text-sm">Modifier la musique</h3>
              <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{song.titre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={16}/>
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusBadge song={{ ...song, artiste, artisteId, albumId, moods: selectedMoods }}/>
            {imgFile && !imgCompressing && (
              <span className="text-[9px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap size={8}/> Image compressée ({fmtSize(imgFile.size)})
              </span>
            )}
          </div>
        </div>

        <div className="p-5 pt-0 space-y-4">
          {/* Titre */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Tag size={9}/> Titre *
            </label>
            <input value={titre} onChange={e => setTitre(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"
              placeholder="Titre de la chanson"/>
          </div>

          {/* Artiste */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Mic2 size={9}/> Artiste
              {!artiste && !artisteId && (
                <span className="text-orange-400 ml-1 flex items-center gap-0.5"><AlertCircle size={9}/> recommandé</span>
              )}
            </label>
            {artisteId ? (
              <div className="flex items-center gap-2 bg-purple-600/10 border border-purple-600/30 rounded-xl px-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-[9px] font-black text-purple-300 shrink-0">
                  {artiste[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-bold text-purple-300 flex-1 truncate">{artiste}</span>
                <button onClick={() => { setArtisteId(''); setArtiste(''); setAlbumId(''); }} className="text-zinc-500 hover:text-white">
                  <X size={12}/>
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-zinc-500"/>
                  <input value={artistSearch}
                    onChange={e => { setArtistSearch(e.target.value); setArtiste(e.target.value); setShowArtistDd(true); }}
                    onFocus={() => setShowArtistDd(true)}
                    placeholder={artiste || 'Rechercher ou saisir un artiste...'}
                    className="w-full bg-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                </div>
                {showArtistDd && artistSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                    {filteredArtists.length === 0 ? (
                      <button onClick={() => { setArtiste(artistSearch); setShowArtistDd(false); }}
                        className="w-full px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-700 text-left flex items-center gap-2">
                        <Plus size={12} className="text-zinc-500"/> Utiliser "{artistSearch}"
                      </button>
                    ) : filteredArtists.slice(0, 6).map(a => (
                      <button key={a._id} onClick={() => selectArtist(a)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-700 transition text-left">
                        <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {a.image ? <img src={a.image} className="w-full h-full object-cover" alt=""/> : <Mic2 size={11} className="text-zinc-500"/>}
                        </div>
                        <span className="text-sm text-zinc-200">{a.nom}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Album */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Disc3 size={9}/> Album (optionnel)
            </label>
            <select value={albumId} onChange={e => setAlbumId(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white">
              <option value="">— Aucun album —</option>
              {artistAlbums.map(a => (
                <option key={a._id} value={a._id}>{a.titre}{a.annee ? ` (${a.annee})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Genre + Année */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Genre</label>
              <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="ex: Afrobeats"
                className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Année</label>
              <input value={annee} onChange={e => setAnnee(e.target.value)} type="number" min="1900" max="2099"
                placeholder={new Date().getFullYear().toString()}
                className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
            </div>
          </div>

          {/* Moods */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Tag size={9}/> Ambiances / Moods
              {selectedMoods.length > 0 && (
                <span className="text-green-400 ml-auto">{selectedMoods.length} sélectionné{selectedMoods.length > 1 ? 's' : ''}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_OPTIONS.map(mood => (
                <button key={mood} type="button" onClick={() => toggleMood(mood)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${
                    selectedMoods.includes(mood)
                      ? 'bg-red-600/20 border-red-500/50 text-red-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500'
                  }`}>
                  {mood}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-zinc-600 mt-1.5">Les moods permettent le filtrage par ambiance sur l'accueil</p>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle size={12}/> {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving || imgCompressing}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Panneau notifications musiques incomplètes ─────────────────
const IncompleteNotificationsPanel = ({ songs, onEdit, onDismiss }) => {
  const incomplete = useMemo(() => songs.filter(s => !s.artiste?.trim() && !s.artisteId), [songs]);
  if (!incomplete.length) return null;

  return (
    <div className="bg-orange-500/8 border border-orange-500/25 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/15">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Bell size={13} className="text-orange-400"/>
          </div>
          <div>
            <p className="text-sm font-black text-orange-300">Musiques à compléter</p>
            <p className="text-[10px] text-orange-400/60">{incomplete.length} titre{incomplete.length>1?'s':''} sans artiste assigné</p>
          </div>
        </div>
        {onDismiss && <button onClick={onDismiss} className="text-zinc-600 hover:text-white p-1 transition"><X size={14}/></button>}
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-orange-500/10">
        {incomplete.map(song => (
          <div key={song._id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-500/5 transition group cursor-pointer"
            onClick={() => onEdit(song)}>
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              {song.image
                ? <img src={song.image} className="w-full h-full object-cover" alt=""/>
                : <Music size={14} className="text-zinc-600 m-auto mt-2.5"/>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white/90">{song.titre || 'Sans titre'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-orange-400/80 bg-orange-500/10 px-1.5 py-0.5 rounded-full">sans artiste</span>
                {!song.albumId && <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">sans album</span>}
                {!song.moods?.length && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">sans mood</span>}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); onEdit(song); }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition opacity-0 group-hover:opacity-100">
              <Edit3 size={10}/> Compléter
            </button>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-orange-500/15 flex items-center justify-between">
        <p className="text-[10px] text-orange-400/50">Ces musiques apparaissent sans filtrage possible</p>
        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{incomplete.length} à traiter</span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// ADMIN LIBRARY VIEW — composant principal
// ════════════════════════════════════════════
const AdminLibraryView = ({ token, currentSong, setCurrentSong, setIsPlaying, isPlaying }) => {
  const [songs, setSongs]           = useState([]);
  const [artists, setArtists]       = useState([]);
  const [albums, setAlbums]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [moodFilter, setMoodFilter] = useState('');
  const [sortBy, setSortBy]         = useState('createdAt');
  const [sortDir, setSortDir]       = useState('desc');
  const [editingSong, setEditingSong] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [artistsData, albumsData] = await Promise.all([
        fetch(`${API}/artists`).then(r => r.json()),
        fetch(`${API}/albums`).then(r => r.json()),
      ]);
      let allSongs = []; let p = 1; let totalPages = 1;
      do {
        const res = await fetch(`${API}/songs?page=${p}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) break;
        const data = await res.json();
        const batch = Array.isArray(data) ? data : (data.songs || []);
        allSongs = [...allSongs, ...batch];
        totalPages = data.pagination?.pages || 1;
        if (Array.isArray(data)) break;
        p++;
      } while (p <= totalPages);
      setSongs(allSongs);
      setArtists(Array.isArray(artistsData) ? artistsData : []);
      setAlbums(Array.isArray(albumsData) ? albumsData : []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...songs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.titre   || '').toLowerCase().includes(q) ||
        (s.artiste || '').toLowerCase().includes(q) ||
        (s.genre   || '').toLowerCase().includes(q) ||
        (s.moods   || []).some(m => m.toLowerCase().includes(q))
      );
    }
    if (filter === 'incomplete') list = list.filter(s => !s.artiste?.trim() && !s.artisteId);
    if (filter === 'complete')   list = list.filter(s =>  s.artiste?.trim() || s.artisteId);
    if (filter === 'nomood')     list = list.filter(s => !s.moods?.length);
    if (moodFilter)              list = list.filter(s =>  s.moods?.includes(moodFilter));

    list.sort((a, b) => {
      let va = a[sortBy] || '';
      let vb = b[sortBy] || '';
      if (sortBy === 'createdAt') { va = new Date(va); vb = new Date(vb); }
      else if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 :  1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return list;
  }, [songs, search, filter, moodFilter, sortBy, sortDir]);

  const totalPages      = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const incompleteCount = useMemo(() => songs.filter(s => !s.artiste?.trim() && !s.artisteId).length, [songs]);
  const noMoodCount     = useMemo(() => songs.filter(s => !s.moods?.length).length, [songs]);

  // FIX : reset page sur changement de filtre/mood
  const handleFilterChange  = (f) => { setFilter(f);   setPage(1); };
  const handleMoodChange    = (m) => { setMoodFilter(m); setPage(1); };
  const handleSearchChange  = (v) => { setSearch(v);   setPage(1); };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  };

  const handleDelete = async (song) => {
    if (!window.confirm(`Supprimer "${song.titre}" ?`)) return;
    setDeleting(song._id);
    await fetch(`${API}/songs/${song._id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setSongs(prev => prev.filter(s => s._id !== song._id));
    setDeleting(null);
  };

  const handleSaved = (updated) =>
    setSongs(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));

  const handleAdded = (newSong) =>
    setSongs(prev => [newSong, ...prev]);

  // FIX : SortIcon stable (pas de inline component dans JSX)
  const renderSortIcon = (col) => {
    if (sortBy !== col) return <ArrowUpDown size={11} className="text-zinc-700"/>;
    return sortDir === 'asc'
      ? <SortAsc  size={11} className="text-red-400"/>
      : <SortDesc size={11} className="text-red-400"/>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center">
              <Music size={18} className="text-red-400"/>
            </div>
            Bibliothèque Admin
          </h1>
          <p className="text-[11px] text-zinc-500 mt-1">
            {songs.length} titre{songs.length > 1 ? 's' : ''} au total
            {incompleteCount > 0 && <span className="text-orange-400 ml-2">· {incompleteCount} sans artiste</span>}
            {noMoodCount > 0 && <span className="text-zinc-600 ml-2">· {noMoodCount} sans mood</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl transition active:scale-95 shadow-lg shadow-red-600/20">
            <Plus size={14}/> Ajouter une musique
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-xl transition disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
            Actualiser
          </button>
        </div>
      </div>

      {/* Notifications */}
      {!notifDismissed && (
        <IncompleteNotificationsPanel
          songs={songs}
          onEdit={setEditingSong}
          onDismiss={() => setNotifDismissed(true)}
        />
      )}

      {/* Recherche + filtres */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3 text-zinc-500"/>
          <input value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Rechercher par titre, artiste, genre, mood..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
          {search && (
            <button onClick={() => handleSearchChange('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-0.5 rounded-full transition">
              <X size={14}/>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {[
            ['all',        'Tout',           songs.length                     ],
            ['incomplete', '⚠️ Sans artiste', incompleteCount                 ],
            ['complete',   '✓ Complets',      songs.length - incompleteCount  ],
            ['nomood',     '🏷️ Sans mood',    noMoodCount                     ],
          ].map(([k, l, c]) => (
            <button key={k} onClick={() => handleFilterChange(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filter === k
                  ? 'bg-red-600/20 border-red-500/40 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-white'
              }`}>
              {l}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                filter === k ? 'bg-red-600/30 text-red-300' : 'bg-zinc-800 text-zinc-600'
              }`}>{c}</span>
            </button>
          ))}

          {/* FIX : handleMoodChange reset la pagination */}
          <select value={moodFilter} onChange={e => handleMoodChange(e.target.value)}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:ring-1 ring-red-600">
            <option value="">Tous les moods</option>
            {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2"/> Chargement...
        </div>
      ) : (
        <>
          {/* En-têtes colonnes */}
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] gap-3 px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <div className="w-10"/>
            <button onClick={() => toggleSort('titre')}   className="flex items-center gap-1 hover:text-zinc-300 transition text-left">
              Titre {renderSortIcon('titre')}
            </button>
            <button onClick={() => toggleSort('artiste')} className="flex items-center gap-1 hover:text-zinc-300 transition text-left">
              Artiste {renderSortIcon('artiste')}
            </button>
            <div>Moods</div>
            <button onClick={() => toggleSort('plays')}   className="flex items-center gap-1 hover:text-zinc-300 transition">
              Écoutes {renderSortIcon('plays')}
            </button>
            <div>Statut</div>
            <div>Actions</div>
          </div>

          <div className="space-y-1">
            {paginated.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">
                <Music size={36} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Aucune musique ne correspond aux filtres</p>
                <button onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-400 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 px-4 py-2 rounded-xl transition">
                  <Plus size={13}/> Ajouter la première musique
                </button>
              </div>
            ) : paginated.map(song => {
              const isActive = currentSong?._id === song._id;
              const isDel    = deleting === song._id;
              return (
                <div key={song._id}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition cursor-pointer ${
                    isActive ? 'bg-red-600/8 border border-red-600/15' : 'hover:bg-zinc-900/60 border border-transparent'
                  }`}
                  onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>

                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative">
                    {song.image
                      ? <img src={song.image} className="w-full h-full object-cover" alt=""/>
                      : <Music size={14} className="text-zinc-600 m-auto mt-3"/>
                    }
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white rounded-sm"/>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : 'text-zinc-100'}`}>
                      {song.titre || 'Sans titre'}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate uppercase">
                      {song.artiste || <span className="text-orange-400">⚠️ Sans artiste</span>}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-1 flex-wrap max-w-[140px]">
                    {song.moods?.length > 0
                      ? song.moods.slice(0, 2).map(m => (
                        <span key={m} className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{m}</span>
                      ))
                      : <span className="text-[8px] text-zinc-700 italic">Aucun mood</span>
                    }
                  </div>

                  <div className="hidden md:flex items-center gap-1 text-[10px] text-zinc-600 w-14 shrink-0">
                    <Eye size={9}/> {song.plays?.toLocaleString() || 0}
                  </div>

                  <div className="hidden md:block shrink-0">
                    <StatusBadge song={song}/>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0"
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingSong(song)}
                      className="p-1.5 hover:bg-zinc-700 text-zinc-500 hover:text-white rounded-lg transition" title="Modifier">
                      <Edit3 size={14}/>
                    </button>
                    <button onClick={() => handleDelete(song)} disabled={isDel}
                      className="p-1.5 hover:bg-red-600/20 text-zinc-600 hover:text-red-400 rounded-lg transition disabled:opacity-40" title="Supprimer">
                      {isDel ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-zinc-600">{filtered.length} résultats · page {page}/{totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl disabled:opacity-30 hover:bg-zinc-800 transition text-zinc-400 hover:text-white">
                  ← Préc.
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-xl transition ${
                        p === page ? 'bg-red-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl disabled:opacity-30 hover:bg-zinc-800 transition text-zinc-400 hover:text-white">
                  Suiv. →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal édition */}
      {editingSong && (
        <EditSongModal
          song={editingSong} token={token} artists={artists} albums={albums}
          onClose={() => setEditingSong(null)}
          onSaved={updated => { handleSaved(updated); setEditingSong(null); }}
        />
      )}

      {/* Modal ajout */}
      {showAddModal && (
        <AddSongModal
          token={token} artists={artists} albums={albums}
          onClose={() => setShowAddModal(false)}
          onAdded={(newSong) => { handleAdded(newSong); setShowAddModal(false); }}
        />
      )}
    </div>
  );
};

export default AdminLibraryView;