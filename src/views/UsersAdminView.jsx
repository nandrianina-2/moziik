import React, { useState, useEffect } from 'react';
import {
  Users, Trash2, Eye, Heart, ListOrdered, Music,
  Loader2, Search, UserCircle, TrendingUp, X,
  ChevronRight, Play, Shield, AlertCircle, RefreshCw
} from 'lucide-react';
import { API } from '../config/api';

// ── MODAL DÉTAIL UTILISATEUR ──────────────────
const UserDetailModal = ({ user, token, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    fetch(`${API}/admin/users/${user._id}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .finally(() => setLoading(false));
  }, [user._id, token]);

  const maxPlays = stats?.topSongs?.[0]?.userPlays || 1;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-lg font-black text-red-400">
              {(user.nom || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-black text-sm">{user.nom || <span className="italic text-zinc-500">Sans nom</span>}</p>
              <p className="text-[11px] text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 shrink-0">
          {[['stats', 'Stats'], ['songs', 'Titres écoutés'], ['liked', 'Favoris']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${tab === key ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-red-500" size={28} />
            </div>
          ) : !stats ? (
            <div className="text-center py-12 text-zinc-500">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Statistiques indisponibles</p>
            </div>
          ) : tab === 'stats' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Écoutes totales', value: stats.totalPlays || 0, icon: <Play size={16} />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                  { label: 'Favoris', value: stats.totalLikes || 0, icon: <Heart size={16} />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                  { label: 'Playlists', value: stats.totalPlaylists || 0, icon: <ListOrdered size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { label: 'Commentaires', value: stats.totalComments || 0, icon: <Music size={16} />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                ].map(c => (
                  <div key={c.label} className={`border rounded-2xl p-4 ${c.bg}`}>
                    <div className={`mb-2 ${c.color}`}>{c.icon}</div>
                    <div className="text-xl font-black">{c.value}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Membre depuis</p>
                <p className="text-sm font-bold">{new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          ) : tab === 'songs' ? (
            <div className="space-y-2">
              {!stats.topSongs?.length
                ? <p className="text-zinc-500 text-sm italic py-6 text-center">Aucune écoute enregistrée</p>
                : stats.topSongs.map((song, i) => (
                  <div key={song._id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition">
                    <span className="text-zinc-600 font-mono text-xs w-4 shrink-0">{i + 1}</span>
                    <img src={song.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{song.titre}</p>
                      <div className="mt-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${Math.round((song.userPlays / maxPlays) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-400 shrink-0">{song.userPlays}×</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="space-y-2">
              {!stats.likedSongs?.length
                ? <p className="text-zinc-500 text-sm italic py-6 text-center">Aucun favori</p>
                : stats.likedSongs.map((song, i) => (
                  <div key={song._id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition">
                    <img src={song.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{song.titre}</p>
                      <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
                    </div>
                    <Heart size={14} fill="red" className="text-red-500 shrink-0" />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── VUE PRINCIPALE ────────────────────────────
const UsersAdminView = ({ token, musiques }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent'); // 'recent' | 'plays' | 'name'
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message || `Erreur ${res.status}`);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const deleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ? Cette action est irréversible.')) return;
    await fetch(`${API}/admin/users/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    setUsers(prev => prev.filter(u => u._id !== id));
    if (selectedUser?._id === id) setSelectedUser(null);
  };

  const filtered = users
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (u.nom || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'plays') return (b.totalPlays || 0) - (a.totalPlays || 0);
      if (sort === 'name') return (a.nom || '').localeCompare(b.nom || '');
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalPlays = users.reduce((s, u) => s + (u.totalPlays || 0), 0);
  const totalLikes = users.reduce((s, u) => s + (u.totalLikes || 0), 0);
  const totalPlaylists = users.reduce((s, u) => s + (u.totalPlaylists || 0), 0);

  // Top 10 musiques globales
  const topGlobal = [...(musiques || [])].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
  const maxGlobalPlays = topGlobal[0]?.plays || 1;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Users size={24} className="text-red-500" /> Utilisateurs
        </h2>
        <button onClick={load} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl transition">
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* ── Stats globales ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Utilisateurs', value: users.length, icon: <Users size={18} />, color: 'text-red-400' },
          { label: 'Écoutes totales', value: totalPlays, icon: <Play size={18} />, color: 'text-green-400' },
          { label: 'Réactions', value: totalLikes, icon: <Heart size={18} />, color: 'text-pink-400' },
          { label: 'Playlists', value: totalPlaylists, icon: <ListOrdered size={18} />, color: 'text-blue-400' },
        ].map(c => (
          <div key={c.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <div className={`mb-2 ${c.color}`}>{c.icon}</div>
            <div className="text-2xl font-black">{c.value.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Liste utilisateurs ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search + Sort */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-400 outline-none focus:ring-1 ring-red-600 cursor-pointer">
              <option value="recent">Plus récents</option>
              <option value="plays">Plus d'écoutes</option>
              <option value="name">Alphabétique</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-red-500" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <UserCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'Aucun résultat' : 'Aucun utilisateur'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(u => (
                <div key={u._id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer group ${selectedUser?._id === u._id ? 'bg-red-600/10 border-red-600/30' : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700'}`}
                  onClick={() => setSelectedUser(u === selectedUser ? null : u)}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-sm text-red-400 border border-zinc-700 shrink-0">
                    {(u.nom || u.email || '?')[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{u.nom || <span className="text-zinc-500 italic">Sans nom</span>}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{u.email}</p>
                  </div>
                  {/* Mini stats */}
                  <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Play size={10} className="text-green-400" /> {u.totalPlays || 0}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Heart size={10} className="text-red-400" /> {u.totalLikes || 0}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setSelectedUser(u); }}
                      className="p-1.5 hover:bg-zinc-700 rounded-lg transition text-zinc-500 hover:text-white">
                      <ChevronRight size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteUser(u._id); }}
                      className="p-1.5 hover:bg-red-600/20 rounded-lg transition text-zinc-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Top musiques globales ── */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-red-500" /> Top global
          </h3>
          <div className="space-y-2">
            {topGlobal.map((song, i) => (
              <div key={song._id} className="flex items-center gap-3 p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                <span className={`font-black text-sm w-5 shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-700'}`}>
                  {i + 1}
                </span>
                <img src={song.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{song.titre}</p>
                  <div className="mt-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i === 0 ? 'bg-yellow-500' : 'bg-red-600'}`}
                      style={{ width: `${Math.round((song.plays / maxGlobalPlays) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-0.5">
                  <Eye size={9} /> {song.plays}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal détail */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} token={token} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default UsersAdminView;
