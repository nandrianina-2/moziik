import React, { useState } from 'react';
import { X, Plus, Loader2, Disc3 } from 'lucide-react';
import { API } from '../../config/api';

const CreateAlbumModal = ({ token, userArtistId, onClose, onSuccess }) => {
  const [titre, setTitre] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('annee', annee);
    formData.append('artisteId', userArtistId);
    if (imageFile) formData.append('image', imageFile);
    try {
      const res = await fetch(`${API}/albums`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const d = await res.json(); setError(d.message || 'Erreur'); }
    } catch { setError('Erreur réseau'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-300 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic flex items-center gap-2"><Disc3 className="text-red-600" size={20} /> Nouvel album</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Titre de l'album *</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} required placeholder="Mon Album..."
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Année</label>
            <input value={annee} onChange={e => setAnnee(e.target.value)} type="number" min="1900" max="2099"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Pochette (optionnel)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white cursor-pointer" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Créer l'album
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbumModal;
