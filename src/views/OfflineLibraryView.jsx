// ════════════════════════════════════════════════════════════════
// OfflineLibraryView.jsx — Bibliothèque téléchargée hors-ligne
// Affiche toutes les musiques disponibles sans connexion,
// avec lecture, suppression du cache, et infos de taille.
// ════════════════════════════════════════════════════════════════
import React, { useState, useMemo, useCallback } from 'react';
import {
  WifiOff, Play, Pause, Trash2, Check, Music,
  Download, HardDrive, Search, X, SortAsc, SortDesc,
  ChevronDown, ChevronUp, ArrowUpDown, Clock, Zap
} from 'lucide-react';

// ── Utilitaire : formatage durée ─────────────────
const fmtDuration = (s) => {
  if (!s || isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ── Utilitaire : taille estimée ─────────────────
// ~1 Mo/min pour du 128kbps, ~2 Mo/min pour du 256kbps
const estimateSize = (duration) => {
  if (!duration) return null;
  const mb = (duration / 60) * 1.5;
  return mb < 1 ? `${Math.round(mb * 1000)} Ko` : `${mb.toFixed(1)} Mo`;
};

// ════════════════════════════════════════════
// CARTE CHANSON OFFLINE — vue liste
// ════════════════════════════════════════════
const OfflineSongRow = ({ song, isActive, isPlaying, onPlay, onRemove, removing }) => (
  <div
    className={`
      group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200
      ${isActive ? 'bg-green-500/8 ring-1 ring-green-500/20' : 'hover:bg-white/4'}
    `}
    onClick={onPlay}
  >
    {/* Cover */}
    <div className="relative shrink-0 w-12 h-12">
      {song.image
        ? <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
        : <div className="w-full h-full rounded-xl bg-zinc-800 flex items-center justify-center">
            <Music size={16} className="text-zinc-600" />
          </div>
      }
      {/* Badge hors-ligne */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
        <Check size={8} className="text-white" />
      </div>
      {/* Overlay lecture */}
      {isActive && isPlaying && (
        <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
          <div className="flex gap-0.5 items-end h-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-0.5 bg-green-400 rounded-full animate-bounce"
                style={{ height: `${(i % 3 + 1) * 4}px`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Infos */}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-bold truncate leading-tight ${isActive ? 'text-green-400' : 'text-zinc-100'}`}>
        {song.titre || 'Sans titre'}
      </p>
      <p className="text-[11px] text-zinc-500 truncate mt-0.5 uppercase tracking-wide">
        {song.artiste || 'Artiste inconnu'}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {song.genre && (
          <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">{song.genre}</span>
        )}
        {song.duration && (
          <span className="text-[9px] text-zinc-700 flex items-center gap-0.5">
            <Clock size={8} /> {fmtDuration(song.duration)}
          </span>
        )}
        {estimateSize(song.duration) && (
          <span className="text-[9px] text-zinc-700 flex items-center gap-0.5">
            <HardDrive size={8} /> ~{estimateSize(song.duration)}
          </span>
        )}
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0"
      onClick={e => e.stopPropagation()}>
      <button
        onClick={onRemove}
        disabled={removing}
        title="Supprimer du cache"
        className="p-2 rounded-xl hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition disabled:opacity-30"
      >
        {removing
          ? <div className="w-4 h-4 border-2 border-zinc-600 border-t-red-400 rounded-full animate-spin" />
          : <Trash2 size={15} />
        }
      </button>
    </div>
  </div>
);

// ════════════════════════════════════════════
// CARTE CHANSON OFFLINE — vue grille
// ════════════════════════════════════════════
const OfflineSongCard = ({ song, isActive, isPlaying, onPlay, onRemove, removing }) => (
  <div
    className={`
      relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-200
      ${isActive ? 'ring-2 ring-green-400/50' : ''}
    `}
    onClick={onPlay}
  >
    <div className="relative aspect-square">
      {song.image
        ? <img src={song.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
        : <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Music size={28} className="text-zinc-600" />
          </div>
      }
      {/* Overlay dark */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Badge offline */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500/20 border border-green-500/30 backdrop-blur-sm rounded-full px-2 py-0.5">
        <Check size={8} className="text-green-400" />
        <span className="text-[8px] font-bold text-green-400">OFFLINE</span>
      </div>

      {/* Bouton supprimer */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        disabled={removing}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100 disabled:opacity-30"
      >
        {removing
          ? <div className="w-3 h-3 border-2 border-zinc-600 border-t-red-400 rounded-full animate-spin" />
          : <Trash2 size={11} />
        }
      </button>

      {/* Play overlay */}
      <div className={`absolute inset-0 flex items-center justify-center transition ${isActive && isPlaying ? 'bg-transparent' : 'bg-transparent'}`}>
        {isActive && isPlaying ? (
          <div className="flex gap-0.5 items-end h-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1 bg-green-400 rounded-full animate-bounce"
                style={{ height: `${(i % 3 + 1) * 6}px`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <Play fill="white" size={16} className="ml-0.5" />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-xs font-bold text-white truncate leading-tight">{song.titre}</p>
        <p className="text-[10px] text-white/50 truncate mt-0.5">{song.artiste}</p>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// VUE PRINCIPALE : OfflineLibraryView
// ════════════════════════════════════════════
const OfflineLibraryView = ({
  musiques,
  currentSong,
  setCurrentSong,
  setIsPlaying,
  isPlaying,
  isAudioCached,
  removeCached,
}) => {
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('titre');
  const [sortDir, setSortDir]       = useState('asc');
  const [viewMode, setViewMode]     = useState('list'); // 'list' | 'grid'
  const [removingId, setRemovingId] = useState(null);
  const [removed, setRemoved]       = useState(new Set());

  const songs = Array.isArray(musiques) ? musiques : [];

  // Toutes les chansons mises en cache, sauf celles supprimées localement
  const cachedSongs = useMemo(() =>
    songs.filter(s => !removed.has(s._id) && isAudioCached && isAudioCached(s._id)),
    [songs, isAudioCached, removed]
  );

  // Taille totale estimée
  const totalEstimatedMb = useMemo(() =>
    cachedSongs.reduce((acc, s) => acc + (s.duration ? (s.duration / 60) * 1.5 : 1.5), 0),
    [cachedSongs]
  );

  // Filtrage + tri
  const filtered = useMemo(() => {
    let list = [...cachedSongs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.titre || '').toLowerCase().includes(q) ||
        (s.artiste || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = (a[sortBy] || '').toString().toLowerCase();
      let vb = (b[sortBy] || '').toString().toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [cachedSongs, search, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const handleRemove = useCallback(async (song) => {
    if (!window.confirm(`Supprimer "${song.titre}" du cache hors-ligne ?`)) return;
    setRemovingId(song._id);
    try {
      await removeCached?.(song._id);
      setRemoved(prev => new Set([...prev, song._id]));
      // Si la chanson supprimée est en cours de lecture, ne pas arrêter
    } catch (e) {
      console.error('Erreur suppression cache:', e);
    }
    setRemovingId(null);
  }, [removeCached]);

  const handlePlay = useCallback((song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  }, [setCurrentSong, setIsPlaying]);

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={11} className="text-zinc-700" />;
    return sortDir === 'asc'
      ? <SortAsc size={11} className="text-green-400" />
      : <SortDesc size={11} className="text-green-400" />;
  };

  // ── Empty state ──────────────────────────────
  if (cachedSongs.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <WifiOff size={36} className="text-zinc-700" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Download size={16} className="text-zinc-600" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-300 mb-2">Aucune musique hors-ligne</h2>
          <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
            Téléchargez des musiques depuis la bibliothèque pour les écouter sans connexion.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-700 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
          <Zap size={12} className="text-green-500" />
          Appuyez sur l'icône <Download size={11} className="mx-1 inline" /> à côté d'une chanson pour la télécharger
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 mx-auto">

      {/* ── En-tête ── */}
      <div className="w-full flex items-start justify-between gap-4">
        <div w-full>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/15 border border-green-500/25 rounded-2xl flex items-center justify-center">
              <WifiOff size={18} className="text-green-400" />
            </div>
            Bibliothèque hors-ligne
          </h1>
          <p className="text-[11px] text-zinc-500 mt-1.5 ml-13">
            {cachedSongs.length} titre{cachedSongs.length > 1 ? 's' : ''} téléchargé{cachedSongs.length > 1 ? 's' : ''}
            {' · '}
            <span className="text-zinc-600">
              ~{totalEstimatedMb.toFixed(0)} Mo utilisés
            </span>
          </p>
        </div>

        {/* Toggle vue liste / grille */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Grille
          </button>
        </div>
      </div>

      {/* ── Bannière statut offline ── */}
      <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/20 rounded-2xl px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        <p className="text-xs text-green-400 font-bold">
          Ces musiques sont disponibles même sans connexion internet
        </p>
      </div>

      {/* ── Recherche + tri ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-3 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans les téléchargements..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none focus:ring-1 ring-green-500 text-white placeholder-zinc-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-0.5 rounded-full transition">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'titre', label: 'Titre' },
            { key: 'artiste', label: 'Artiste' },
            { key: 'genre', label: 'Genre' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                sortBy === key
                  ? 'bg-green-500/15 border-green-500/30 text-green-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              {label} <SortIcon col={key} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Résultats ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun résultat pour "{search}"</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ── VUE LISTE ── */
        <div>
          {/* En-têtes colonnes */}
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto] gap-3 px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-zinc-800/50 mb-1">
            <div className="w-12" />
            <button onClick={() => toggleSort('titre')} className="flex items-center gap-1 hover:text-zinc-400 transition text-left">
              Titre <SortIcon col="titre" />
            </button>
            <button onClick={() => toggleSort('artiste')} className="flex items-center gap-1 hover:text-zinc-400 transition text-left">
              Artiste <SortIcon col="artiste" />
            </button>
            <div>Durée</div>
            <div>Actions</div>
          </div>

          <div className="space-y-0.5">
            {filtered.map(song => (
              <OfflineSongRow
                key={song._id}
                song={song}
                isActive={currentSong?._id === song._id}
                isPlaying={isPlaying}
                onPlay={() => handlePlay(song)}
                onRemove={() => handleRemove(song)}
                removing={removingId === song._id}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── VUE GRILLE ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(song => (
            <OfflineSongCard
              key={song._id}
              song={song}
              isActive={currentSong?._id === song._id}
              isPlaying={isPlaying}
              onPlay={() => handlePlay(song)}
              onRemove={() => handleRemove(song)}
              removing={removingId === song._id}
            />
          ))}
        </div>
      )}

      {/* ── Footer info ── */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/40 text-[11px] text-zinc-600">
        <span>{filtered.length} titre{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span>
        <span className="flex items-center gap-1.5">
          <HardDrive size={11} />
          Espace estimé : ~{totalEstimatedMb.toFixed(0)} Mo
        </span>
      </div>
    </div>
  );
};

export default OfflineLibraryView;