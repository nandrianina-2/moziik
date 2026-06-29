import React, { useState } from 'react';
import { X, Plus, Loader2, Globe, Lock } from 'lucide-react';
import { API } from '../../config/api';

const CreatePlaylistModal = ({ token, onClose, onSuccess }) => {
  const [nom, setNom] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/user-playlists`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nom, isPublic })
      });
      if (res.ok) { onSuccess(); onClose(); }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic">Nouvelle playlist</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)} required placeholder="Ma playlist..."
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
          </div>
          <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              {isPublic ? <Globe size={16} className="text-green-400" /> : <Lock size={16} className="text-zinc-500" />}
              <span>{isPublic ? 'Publique' : 'Privée'}</span>
            </div>
            <button type="button" onClick={() => setIsPublic(!isPublic)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-green-500' : 'bg-zinc-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Créer
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
