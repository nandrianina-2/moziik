import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Plus, Loader2, Mic2, Trash2, ChevronRight,
  Edit2, X, Camera, Save, Music, Eye, Search,
  Image as ImageIcon, AlertCircle, CheckCircle
} from 'lucide-react';
import { API } from '../config/api';

// ── Modal édition artiste ─────────────────────
const EditArtistModal = ({ artist, token, onClose, onSaved }) => {
  const [nom, setNom]         = useState(artist.nom || '');
  const [bio, setBio]         = useState(artist.bio || '');
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState(artist.image || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const handleImg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader(); r.onload = () => setImgPrev(r.result); r.readAsDataURL(f);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return setError('Le nom est requis');
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('nom', nom.trim());
      fd.append('bio', bio);
      if (imgFile) fd.append('image', imgFile);
      const res = await fetch(`${API}/artists/${artist._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      setSuccess('Artiste mis à jour !');
      setTimeout(() => { onSaved(data); onClose(); }, 800);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-300 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-black text-sm flex items-center gap-2"><Edit2 size={15} className="text-red-400" /> Modifier l'artiste</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-zinc-800 overflow-hidden border border-zinc-700 flex items-center justify-center">
                {imgPrev
                  ? <img src={imgPrev} className="w-full h-full object-cover" alt="" />
                  : <Mic2 size={28} className="text-zinc-600" />}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition shadow-lg">
                <Camera size={12} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-400 mb-1">Photo de profil</p>
              <p className="text-[10px] text-zinc-600">JPG, PNG, WEBP — max 5 Mo</p>
              {imgFile && <p className="text-[10px] text-green-400 mt-1">✓ Nouvelle photo prête</p>}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Nom *</label>
            <input value={nom} onChange={e => setNom(e.target.value)} required
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
          </div>

          {/* Bio */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white resize-none placeholder-zinc-600"
              placeholder="Description de l'artiste..." />
          </div>

          {error   && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-xl"><AlertCircle size={13} /> {error}</div>}
          {success && <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-2.5 rounded-xl"><CheckCircle size={13} /> {success}</div>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Vue principale admin artistes ─────────────
const ArtistsAdminView = ({ token }) => {
  const [artists, setArtists]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch]         = useState('');
  const [form, setForm]             = useState({ nom: '', bio: '', email: '', password: '' });
  const [formImg, setFormImg]       = useState(null);
  const [formImgPrev, setFormImgPrev] = useState('');
  const [creating, setCreating]     = useState(false);
  const [songCounts, setSongCounts] = useState({});
  const createImgRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API}/artists`).then(r => r.json());
      setArtists(Array.isArray(data) ? data : []);
      // Récupérer le nb de musiques par artiste
      const songs = await fetch(`${API}/songs?limit=50`).then(r => r.json()).catch(() => ({ songs: [] }));
      const counts = {};
      (songs.songs || []).forEach(s => {
        if (s.artisteId?._id) counts[s.artisteId._id] = (counts[s.artisteId._id] || 0) + 1;
      });
      setSongCounts(counts);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateImg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setFormImg(f);
    const r = new FileReader(); r.onload = () => setFormImgPrev(r.result); r.readAsDataURL(f);
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (formImg) fd.append('image', formImg);
      await fetch(`${API}/artists`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      setForm({ nom: '', bio: '', email: '', password: '' });
      setFormImg(null); setFormImgPrev('');
      setShowForm(false);
      load();
    } catch {}
    setCreating(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet artiste et toutes ses données ?')) return;
    await fetch(`${API}/artists/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const filtered = artists.filter(a =>
    !search || a.nom.toLowerCase().includes(search.toLowerCase()) || (a.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Users size={24} className="text-red-500" /> Artistes
          <span className="text-sm font-normal text-zinc-500 ml-1">({artists.length})</span>
        </h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95">
          <Plus size={14} /> Nouvel artiste
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={create} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-zinc-300 mb-2">Créer un artiste</h3>

          {/* Photo de création */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700 flex items-center justify-center">
                {formImgPrev
                  ? <img src={formImgPrev} className="w-full h-full object-cover" alt="" />
                  : <ImageIcon size={20} className="text-zinc-600" />}
              </div>
              <button type="button" onClick={() => createImgRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <Camera size={10} className="text-white" />
              </button>
              <input ref={createImgRef} type="file" accept="image/*" className="hidden" onChange={handleCreateImg} />
            </div>
            <div className="text-xs text-zinc-500">Photo optionnelle</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Nom *', 'nom', 'text', true],
              ['Email', 'email', 'email', false],
              ['Mot de passe', 'password', 'password', false],
              ['Bio', 'bio', 'text', false]
            ].map(([label, key, type, req]) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{label}</label>
                <input type={type} value={form[key]} required={req}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {creating ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-zinc-800 transition">Annuler</button>
          </div>
        </form>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un artiste..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={24} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="text-center text-zinc-600 py-10 text-sm">Aucun artiste trouvé</p>
          ) : filtered.map(a => (
            <div key={a._id}
              className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl group hover:border-zinc-700 hover:bg-zinc-900/60 transition">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-700">
                {a.image
                  ? <img src={a.image} className="w-full h-full object-cover" alt="" />
                  : <Mic2 size={20} className="text-red-600" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{a.nom}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {a.bio && <p className="text-[11px] text-zinc-500 truncate max-w-50">{a.bio}</p>}
                  <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <Music size={9} /> {songCounts[a._id] || 0} titre{songCounts[a._id] !== 1 ? 's' : ''}
                  </span>
                </div>
                {a.email && <p className="text-[10px] text-zinc-600 mt-0.5">{a.email}</p>}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => setEditTarget(a)}
                  title="Modifier"
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-xl transition">
                  <Edit2 size={14} />
                </button>
                <Link to={`/artist/${a._id}`}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-xl transition"
                  title="Voir la page publique">
                  <Eye size={14} />
                </Link>
                <button onClick={() => remove(a._id)}
                  title="Supprimer"
                  className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal édition */}
      {editTarget && (
        <EditArtistModal
          artist={editTarget}
          token={token}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setArtists(prev => prev.map(a => a._id === updated._id ? updated : a));
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default ArtistsAdminView;