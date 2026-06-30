import React, { useState, useRef, useCallback } from 'react';
import {
  X, Plus, Loader2, Upload, Music, Image, CheckCircle,
  Tag, Mic2, Disc3, Sparkles, Search, AlertCircle, Zap
} from 'lucide-react';
import { API, API_UPLOAD } from '../../config/api';

// ══════════════════════════════════════════════
// COMPRESSION IMAGE (Canvas)
// Réduit la pochette à max 800×800px, qualité 0.82
// Aucune dépendance externe — fonctionne côté browser
// ══════════════════════════════════════════════
const compressImage = (file, { maxSize = 800, quality = 0.82 } = {}) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const ratio = Math.min(maxSize / width, maxSize / height, 1);
      width  = Math.round(width  * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

// ══════════════════════════════════════════════
// COMPRESSION AUDIO (Web Audio API → OfflineAudioContext)
// Réencode le PCM à 128 kbps simulé via sampleRate réduit
// Compatible MP3/WAV/M4A/OGG natif du navigateur
// ══════════════════════════════════════════════
const compressAudio = async (file, { targetSampleRate = 44100 } = {}) => {
  // Skip si déjà petit (< 8 Mo) ou format non supporté
  const SKIP_THRESHOLD = 8 * 1024 * 1024;
  if (file.size < SKIP_THRESHOLD) return { file, compressed: false, saved: 0 };

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return { file, compressed: false, saved: 0 };

    const arrayBuffer = await file.arrayBuffer();
    const audioCtx    = new AudioContext();
    let decoded;
    try {
      decoded = await audioCtx.decodeAudioData(arrayBuffer.slice());
    } catch {
      audioCtx.close();
      return { file, compressed: false, saved: 0 };
    }
    audioCtx.close();

    // Réduction du sample rate si > cible (downsampling)
    const srcRate  = decoded.sampleRate;
    const dstRate  = Math.min(srcRate, targetSampleRate);
    const duration = decoded.duration;
    const channels = Math.min(decoded.numberOfChannels, 2); // max stéréo

    const offCtx   = new OfflineAudioContext(channels, Math.ceil(dstRate * duration), dstRate);
    const src      = offCtx.createBufferSource();
    src.buffer     = decoded;
    src.connect(offCtx.destination);
    src.start(0);

    const rendered = await offCtx.startRendering();

    // Encoder en WAV PCM 16 bits
    const wavBlob  = audioBufferToWav(rendered);
    const saved    = file.size - wavBlob.size;

    // Ne garder la version compressée que si elle est plus petite
    if (wavBlob.size >= file.size) return { file, compressed: false, saved: 0 };

    const compressedFile = new File(
      [wavBlob],
      file.name.replace(/\.[^.]+$/, '.wav'),
      { type: 'audio/wav' }
    );
    return { file: compressedFile, compressed: true, saved };
  } catch {
    return { file, compressed: false, saved: 0 };
  }
};

// WAV encoder minimaliste (PCM 16 bits)
const audioBufferToWav = (buffer) => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate  = buffer.sampleRate;
  const numFrames   = buffer.length;
  const dataLength  = numFrames * numChannels * 2; // 16 bits = 2 bytes
  const totalLength = 44 + dataLength;
  const arrayBuf    = new ArrayBuffer(totalLength);
  const view        = new DataView(arrayBuf);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0,  'RIFF');
  view.setUint32(4,  totalLength - 8, true);
  writeStr(8,  'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1,  true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate,  true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuf], { type: 'audio/wav' });
};

// ── Formatage taille fichier ──────────────────
const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ══════════════════════════════════════════════
// EXTRACTION ID3
// ══════════════════════════════════════════════
const extractID3 = async (file) => {
  try {
    const buf  = await file.arrayBuffer();
    const view = new DataView(buf);
    const header = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
    if (header !== 'ID3') return {};
    const meta = {};
    let offset = 10;
    const tagSize =
      ((view.getUint8(6) & 0x7f) << 21) | ((view.getUint8(7) & 0x7f) << 14) |
      ((view.getUint8(8) & 0x7f) <<  7) |  (view.getUint8(9) & 0x7f);
    const end     = Math.min(10 + tagSize, buf.byteLength);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    while (offset + 10 < end) {
      const frameId = String.fromCharCode(
        view.getUint8(offset), view.getUint8(offset+1),
        view.getUint8(offset+2), view.getUint8(offset+3)
      );
      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;
      const frameSize = view.getUint32(offset + 4);
      if (frameSize <= 0 || offset + 10 + frameSize > end) break;
      const frameData = new Uint8Array(buf, offset + 10, frameSize);
      const encoding  = frameData[0];
      if (['TIT2','TPE1','TALB','TYER'].includes(frameId)) {
        let text = encoding === 1 || encoding === 2
          ? new TextDecoder('utf-16').decode(frameData.slice(1))
          : decoder.decode(frameData.slice(1));
        text = text.replace(/\0/g,'').trim();
        if (frameId === 'TIT2') meta.titre  = text;
        if (frameId === 'TPE1') meta.artiste = text;
        if (frameId === 'TALB') meta.album   = text;
        if (frameId === 'TYER') meta.annee   = text;
      }
      if (frameId === 'APIC') {
        try {
          let i = 1;
          while (i < frameData.length && frameData[i] !== 0) i++; i += 2;
          while (i < frameData.length && frameData[i] !== 0) i++; i++;
          meta.coverUrl = URL.createObjectURL(new Blob([frameData.slice(i)]));
        } catch {}
      }
      offset += 10 + frameSize;
    }
    return meta;
  } catch { return {}; }
};

// ══════════════════════════════════════════════
// EXTRACTION IA (Anthropic) — optionnelle
// ══════════════════════════════════════════════
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

const extractFromFilenameAI = async (filename) => {
  if (!ANTHROPIC_API_KEY) return {};
  try {
    const clean = filename.replace(/\.(mp3|m4a|ogg|wav|flac)$/i,'').replace(/[_-]/g,' ').trim();
    const res   = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Extrait le titre et l'artiste de ce nom de fichier audio: "${clean}"\nRéponds UNIQUEMENT en JSON strict: {"titre":"...","artiste":"..."}\nSi tu ne peux pas déterminer l'artiste, mets "".`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch { return {}; }
};

// ══════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════
const UploadModal = ({
  token, artists = [], albums = [], onClose, onSuccess,
  userRole, userArtistId, userNom
}) => {
  const [titre, setTitre]             = useState('');
  const [artisteId, setArtisteId]     = useState(userRole === 'artist' ? userArtistId : '');
  const [artisteNom, setArtisteNom]   = useState(userRole === 'artist' ? userNom : '');
  const [albumId, setAlbumId]         = useState('');
  const [audioFile, setAudioFile]     = useState(null);      // fichier final (compressé ou non)
  const [audioOriginal, setAudioOriginal] = useState(null);  // fichier original pour affichage taille
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coverBlob, setCoverBlob]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [progress, setProgress]       = useState(0);
  const [done, setDone]               = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [aiLoading, setAiLoading]     = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null); // { saved, compressed }
  const [isDragging, setIsDragging]   = useState(false);
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  // Albums filtrés selon l'artiste sélectionné
  const artistAlbums = React.useMemo(() => {
    if (!artisteId) return [];
    return albums.filter(a => String(a.artisteId?._id || a.artisteId) === String(artisteId));
  }, [albums, artisteId]);

  const filteredArtists = React.useMemo(() =>
    artists.filter(a => !artistSearch || a.nom.toLowerCase().includes(artistSearch.toLowerCase())),
    [artists, artistSearch]
  );

  // ── Traitement audio : ID3 + compression + IA ──
  const processAudio = useCallback(async (file) => {
    if (!file) return;
    setAudioOriginal(file);
    const rawName = file.name.replace(/\.(mp3|mpeg|m4a|ogg|wav|flac)$/i,'').replace(/[_-]/g,' ').trim();
    setTitre(t => t || rawName);

    // 1. Compression audio (si fichier > 8 Mo)
    setCompressing(true);
    const { file: compressed, compressed: wasCompressed, saved } = await compressAudio(file);
    setAudioFile(compressed);
    setCompressionInfo(wasCompressed ? { saved, compressed: true } : { compressed: false });
    setCompressing(false);

    // 2. Extraction métadonnées ID3
    setMetaLoading(true);
    const meta = await extractID3(file); // on lit l'original pour les ID3
    if (meta.titre) setTitre(meta.titre);
    if (meta.coverUrl && !imagePreview) {
      setImagePreview(meta.coverUrl);
      try { const r = await fetch(meta.coverUrl); setCoverBlob(await r.blob()); } catch {}
    }
    setMetaLoading(false);

    // 3. IA si pas de métadonnées
    if (!meta.titre && !meta.artiste && rawName.length > 3) {
      setAiLoading(true);
      try {
        const aiMeta = await extractFromFilenameAI(file.name);
        if (aiMeta.titre && !titre) setTitre(aiMeta.titre);
        if (aiMeta.artiste && !artisteNom && userRole === 'admin') {
          const match = artists.find(a => a.nom.toLowerCase() === aiMeta.artiste.toLowerCase());
          if (match) { setArtisteId(match._id); setArtisteNom(match.nom); }
          else setArtisteNom(aiMeta.artiste);
        }
      } catch {}
      setAiLoading(false);
    }

    // 4. Matching artiste via ID3
    if (meta.artiste && userRole === 'admin') {
      const match = artists.find(a => a.nom.toLowerCase() === meta.artiste.toLowerCase());
      if (match) { setArtisteId(match._id); setArtisteNom(match.nom); }
      else setArtisteNom(meta.artiste);
    }
  }, [imagePreview, artists, userRole, artisteNom, titre]);

  // ── Changement image + compression ──
  const handleImageChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setCoverBlob(null);
    // Compression image avant preview
    const compressed = await compressImage(file);
    setImageFile(new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
    setImagePreview(URL.createObjectURL(compressed));
  };

  const onDrop = useCallback(async (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = [...e.dataTransfer.files].find(f =>
      f.type.includes('audio') || /\.(mp3|m4a|ogg|wav|flac)$/i.test(f.name)
    );
    if (file) await processAudio(file);
  }, [processAudio]);

  const handleSelectArtist = (a) => {
    setArtisteId(a._id); setArtisteNom(a.nom);
    setArtistSearch(''); setShowArtistDropdown(false);
    setAlbumId('');
  };

  // ── Soumission ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return setError('Fichier audio requis');
    setLoading(true); setProgress(0); setError('');

    const fd = new FormData();
    fd.append('audio', audioFile);

    // Image compressée
    if (imageFile)      fd.append('image', imageFile);
    else if (coverBlob) fd.append('image', new File([coverBlob], 'cover.jpg', { type: 'image/jpeg' }));

    if (titre.trim())                               fd.append('titre',    titre.trim());
    if (artisteId)                                  fd.append('artisteId', artisteId);
    else if (artisteNom.trim() && userRole==='admin') fd.append('artiste', artisteNom.trim());
    if (albumId)                                    fd.append('albumId',  albumId);

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_UPLOAD}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload  = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(JSON.parse(xhr.responseText||'{}').message || 'Erreur upload'));
        xhr.onerror = () => reject(new Error('Erreur réseau'));
        xhr.send(fd);
      });
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 900);
    } catch (err) {
      setError(err.message); setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-300 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-7 rounded-3xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-black italic flex items-center gap-2">
            <Upload size={18} className="text-red-500" /> Ajouter une musique
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Drag & Drop audio ── */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('audio-inp-modal').click()}
            className={`w-full rounded-2xl border-2 border-dashed px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition
              ${isDragging    ? 'border-red-500 bg-red-500/10'
              : audioFile     ? 'border-red-600/40 bg-red-600/5'
              :                 'border-zinc-700 hover:border-zinc-500'}`}
          >
            <Music size={22} className={audioFile ? 'text-red-400' : 'text-zinc-600'} />

            {audioFile ? (
              <>
                <p className="text-sm font-bold text-red-400 truncate max-w-xs">{audioOriginal?.name}</p>

                {/* Tailles original vs compressé */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-zinc-500">{fmtSize(audioOriginal?.size || 0)}</span>
                  {compressionInfo?.compressed && (
                    <>
                      <span className="text-zinc-600">→</span>
                      <span className="text-green-400 font-bold flex items-center gap-1">
                        <Zap size={9}/> {fmtSize(audioFile.size)}
                        <span className="text-green-600">(-{fmtSize(compressionInfo.saved)})</span>
                      </span>
                    </>
                  )}
                  {compressionInfo?.compressed === false && audioOriginal && (
                    <span className="text-zinc-600">· déjà optimisé</span>
                  )}
                </div>

                {/* États de chargement */}
                {(compressing || metaLoading || aiLoading) && (
                  <p className="text-[10px] flex items-center gap-1.5">
                    <Loader2 size={9} className="animate-spin text-blue-400" />
                    <span className="text-blue-400">
                      {compressing  ? '⚡ Compression audio...'
                      : metaLoading ? 'Lecture des métadonnées...'
                      :               '✨ Analyse IA du fichier...'}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-zinc-400">Glisser un MP3 ici</p>
                <p className="text-[10px] text-zinc-600">ou cliquer pour sélectionner</p>
                <p className="text-[9px] text-zinc-700 flex items-center gap-1 mt-1">
                  <Sparkles size={8}/> Titre, artiste et compression automatiques
                </p>
              </>
            )}
            <input
              id="audio-inp-modal"
              type="file"
              accept="audio/mp3,audio/mpeg,audio/m4a,audio/ogg,audio/wav"
              className="hidden"
              onChange={e => processAudio(e.target.files[0])}
            />
          </div>

          {/* ── Pochette ── */}
          <label className="cursor-pointer block">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Image size={10} /> Pochette
              {imagePreview && <span className="text-green-400 ml-1">✓ détectée</span>}
            </p>
            <div className={`w-full h-20 rounded-xl border-2 border-dashed transition flex items-center justify-center overflow-hidden relative group
              ${imagePreview ? 'border-transparent' : 'border-zinc-700 hover:border-zinc-500'}`}>
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <p className="text-xs font-bold">Changer</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-zinc-600">
                  <Image size={16} />
                  <p className="text-[10px]">Sélectionner une image</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          {/* ── Titre ── */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex mb-1.5 items-center gap-1">
              <Tag size={9} /> Titre
            </label>
            <input
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Nom de la musique"
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"
            />
          </div>

          {/* ── Artiste (admin) ── */}
          {userRole === 'admin' && (
            <div className="relative">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex mb-1.5 items-center gap-1">
                <Mic2 size={9} /> Artiste
              </label>
              {artisteId ? (
                <div className="flex items-center gap-2 bg-purple-600/10 border border-purple-600/20 rounded-xl px-3 py-2">
                  <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center text-[9px] font-black text-purple-300 shrink-0">
                    {artisteNom[0]}
                  </div>
                  <span className="text-sm font-bold text-purple-300 flex-1 truncate">{artisteNom}</span>
                  <button
                    type="button"
                    onClick={() => { setArtisteId(''); setArtisteNom(''); setAlbumId(''); }}
                    className="text-zinc-500 hover:text-white shrink-0"
                  >
                    <X size={12}/>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      value={artistSearch}
                      onChange={e => { setArtistSearch(e.target.value); setShowArtistDropdown(true); }}
                      onFocus={() => setShowArtistDropdown(true)}
                      placeholder="Rechercher ou saisir un artiste..."
                      className="w-full bg-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"
                    />
                  </div>
                  {showArtistDropdown && artistSearch && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {filteredArtists.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => { setArtisteNom(artistSearch); setShowArtistDropdown(false); }}
                          className="w-full px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-700 text-left flex items-center gap-2"
                        >
                          <Plus size={12} className="text-zinc-500"/> Utiliser "{artistSearch}"
                        </button>
                      ) : filteredArtists.slice(0, 6).map(a => (
                        <button
                          key={a._id}
                          type="button"
                          onClick={() => handleSelectArtist(a)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-700 transition text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {a.image
                              ? <img src={a.image} className="w-full h-full object-cover" alt="" />
                              : <Mic2 size={11} className="text-zinc-500"/>}
                          </div>
                          <span className="text-sm text-zinc-200">{a.nom}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!showArtistDropdown && artistSearch && !artisteId && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Artiste libre: "{artistSearch}" (sans liaison artiste)
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Artiste info (mode artiste) ── */}
          {userRole === 'artist' && (
            <div className="bg-purple-600/10 border border-purple-600/20 rounded-xl px-4 py-3 text-sm text-purple-300 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black">
                {(userNom||'?')[0]}
              </div>
              Publié sous : <span className="font-bold">{userNom}</span>
            </div>
          )}

          {/* ── Album ── */}
          {(userRole === 'admin'
            ? artistAlbums.length > 0
            : albums.filter(a => String(a.artisteId) === String(userArtistId)).length > 0
          ) && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                <Disc3 size={9} className="inline mr-1" /> Album (optionnel)
              </label>
              <select
                value={albumId}
                onChange={e => setAlbumId(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white"
              >
                <option value="">Aucun album</option>
                {(userRole === 'admin'
                  ? artistAlbums
                  : albums.filter(a => String(a.artisteId) === String(userArtistId))
                ).map(a => <option key={a._id} value={a._id}>{a.titre}</option>)}
              </select>
            </div>
          )}

          {/* ── Progress ── */}
          {loading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-400">{progress < 100 ? 'Envoi en cours...' : 'Traitement...'}</span>
                <span className="text-red-400">{progress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle size={16} /> Ajouté avec succès !
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || done || !audioFile || compressing || metaLoading}
            className="mt-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {compressing  ? <><Loader2 size={17} className="animate-spin"/> Compression...</>
            : loading     ? <><Loader2 size={17} className="animate-spin"/> Envoi ({progress}%)</>
            : done        ? <><CheckCircle size={17}/> Terminé !</>
            :               <><Plus size={17}/> Ajouter</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;