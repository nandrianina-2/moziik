// ════════════════════════════════════════════
// ScheduledReleaseModal.jsx
// Modal pour programmer la sortie d'une musique
// ════════════════════════════════════════════
import React, { useState } from 'react';
import { Calendar, X, Clock, Loader2 } from 'lucide-react';
import { API } from '../../config/api'; // ✅ FIX: import manquant ajouté

export const ScheduledReleaseModal = ({ songId, songTitre, token, onClose, onSaved }) => {
  const [releaseAt, setReleaseAt] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!releaseAt) return setError('Date requise');
    const d = new Date(releaseAt);
    if (d <= new Date()) return setError('La date doit être dans le futur');
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/songs/${songId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ releaseAt: d.toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSaved?.(data); onClose();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  // Minimum = maintenant + 1h
  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-400 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-black text-sm flex items-center gap-2">
            <Calendar size={15} className="text-orange-400"/> Programmer la sortie
          </h3>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"><X size={15}/></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="bg-zinc-800/40 rounded-xl p-3">
            <p className="text-xs font-bold text-zinc-300 truncate">{songTitre}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">La musique sera publiée automatiquement à la date choisie</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
              Date et heure de sortie *
            </label>
            <input type="datetime-local" value={releaseAt} onChange={e => setReleaseAt(e.target.value)}
              min={minDate} required
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Clock size={14}/>}
              Programmer
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};