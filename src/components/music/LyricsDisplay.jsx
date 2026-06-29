import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music2, Upload, X, Check, Loader2, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { API } from '../../config/api';

// ════════════════════════════════════════════
// LYRICS DISPLAY — affichage karaoké temps réel
// ════════════════════════════════════════════
export const LyricsDisplay = ({ songId, currentTime, isPlaying }) => {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef(null);
  const activeRef    = useRef(null);

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    fetch(`${API}/songs/${songId}/lyrics`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setLyrics(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [songId]);

  // Trouver la ligne active selon currentTime
  useEffect(() => {
    if (!lyrics?.lines?.length) return;
    const idx = lyrics.lines.reduce((best, line, i) => {
      return line.time <= currentTime ? i : best;
    }, -1);
    if (idx !== activeIdx) setActiveIdx(idx);
  }, [currentTime, lyrics]);

  // Auto-scroll vers la ligne active
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx]);

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-zinc-600">
      <Loader2 size={18} className="animate-spin mr-2" /> Chargement des paroles...
    </div>
  );

  if (!lyrics) return (
    <div className="flex flex-col items-center py-10 text-zinc-700 gap-2">
      <Music2 size={28} className="opacity-30" />
      <p className="text-sm">Paroles non disponibles</p>
    </div>
  );

  return (
    <div ref={containerRef} className="max-h-72 overflow-y-auto space-y-2 px-2 py-4 scroll-smooth"
      style={{ scrollbarWidth: 'none' }}>
      {lyrics.lines.map((line, i) => {
        const isActive = i === activeIdx;
        const isPast   = i < activeIdx;
        return (
          <p key={i}
            ref={isActive ? activeRef : null}
            className={`text-center text-sm leading-relaxed transition-all duration-300 select-none ${
              isActive
                ? 'text-white font-black text-base scale-105 drop-shadow-lg'
                : isPast
                ? 'text-zinc-600 font-medium'
                : 'text-zinc-500 font-medium'
            }`}>
            {line.text}
          </p>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════
// LYRICS EDITOR — upload .lrc (artiste/admin)
// ════════════════════════════════════════════
export const LyricsEditor = ({ songId, songTitre, token, canEdit }) => {
  const [open, setOpen]       = useState(false);
  const [lyrics, setLyrics]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [lrcFile, setLrcFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [tab, setTab]         = useState('lrc'); // 'lrc' | 'manual'
  const fileRef = useRef();

  const load = useCallback(async () => {
    if (!songId) return;
    setLoading(true);
    const res = await fetch(`${API}/songs/${songId}/lyrics`).catch(() => null);
    if (res?.ok) setLyrics(await res.json());
    else setLyrics(null);
    setLoading(false);
  }, [songId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      if (tab === 'lrc' && lrcFile) {
        fd.append('lrc', lrcFile);
      } else if (tab === 'manual' && manualText.trim()) {
        // Convertir texte simple en lignes (sans timestamp → spacing uniforme)
        const lines = manualText.trim().split('\n')
          .filter(l => l.trim())
          .map((text, i) => ({ time: i * 3, text: text.trim() }));
        fd.append('lines', JSON.stringify(lines));
      } else {
        setError('Aucune parole fournie'); setSaving(false); return;
      }
      const res = await fetch(`${API}/songs/${songId}/lyrics`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setSuccess('Paroles sauvegardées !');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm) return;
    setSaving(true);
    await fetch(`${API}/songs/${songId}/lyrics`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setLyrics(null); setSaving(false);
  };

  if (!canEdit) return null;

  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-white transition font-bold px-2 py-1 rounded-lg hover:bg-zinc-800">
        <Music2 size={11} />
        {lyrics ? 'Modifier les paroles' : 'Ajouter des paroles'}
        <ChevronDown size={10} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-300">
              {lyrics ? `Paroles de "${songTitre}"` : `Ajouter des paroles à "${songTitre}"`}
            </p>
            {lyrics && (
              <button onClick={handleDelete} className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition">
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Preview si paroles existantes */}
          {lyrics && (
            <div className="bg-zinc-800/40 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
              {lyrics.lines.slice(0, 8).map((l, i) => (
                <p key={i} className="text-xs text-zinc-400 truncate">
                  <span className="text-zinc-600 font-mono mr-2">{formatTime(l.time)}</span>
                  {l.text}
                </p>
              ))}
              {lyrics.lines.length > 8 && <p className="text-[10px] text-zinc-600">+{lyrics.lines.length - 8} lignes...</p>}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-zinc-800/50 rounded-lg p-0.5 gap-0.5">
            {[['lrc','Fichier .lrc'],['manual','Texte libre']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${tab===k?'bg-zinc-700 text-white':'text-zinc-500 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'lrc' ? (
            <div>
              <p className="text-[10px] text-zinc-600 mb-2">Format LRC standard : <code className="bg-zinc-800 px-1 rounded">[00:12.34]Paroles ici</code></p>
              <div onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer transition ${lrcFile ? 'border-green-500/50 bg-green-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                {lrcFile
                  ? <p className="text-xs text-green-400 font-bold">{lrcFile.name}</p>
                  : <p className="text-xs text-zinc-500">Cliquer pour choisir un fichier .lrc</p>
                }
                <input ref={fileRef} type="file" accept=".lrc,.txt" className="hidden"
                  onChange={e => setLrcFile(e.target.files[0])} />
              </div>
            </div>
          ) : (
            <textarea value={manualText} onChange={e => setManualText(e.target.value)}
              placeholder={"Une ligne = une phrase\nLes timestamps seront générés automatiquement\n\nEx:\nCoucher du soleil sur la ville\nLes étoiles s'allument une à une"}
              rows={6}
              className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 ring-red-600 resize-none font-mono" />
          )}

          {error   && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5"><Check size={12}/>{success}</p>}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
              Sauvegarder
            </button>
            <button onClick={() => setOpen(false)} className="px-3 text-zinc-500 hover:text-white text-xs rounded-xl hover:bg-zinc-800 transition">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sc = Math.floor(s % 60);
  return `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
};