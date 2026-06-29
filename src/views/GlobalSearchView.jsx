import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Music, Mic2, Disc3, Globe, Play, Pause,
  Loader2, X, TrendingUp, ListPlus, Download,
  MoreHorizontal, Heart, Radio, Check,
  Share2, Copy, ExternalLink
} from 'lucide-react';
import { API } from '../config/api';

// ════════════════════════════════════════════
// SHARE BUTTON — même logique que SocialFeatures.jsx
// Appelle POST /songs/:id/share → génère un vrai token
// ════════════════════════════════════════════
const ShareButton = ({ song, size = 13 }) => {
  const [state, setState]     = useState('idle'); // idle | loading | error | copied
  const [shareUrl, setUrl]    = useState('');
  const [showPop, setShowPop] = useState(false);
  const ref = useRef(null);

  // Ferme le popover si clic en dehors
  useEffect(() => {
    if (!showPop) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowPop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPop]);

  const generate = async (e) => {
    e.stopPropagation();
    if (shareUrl) { setShowPop(true); return; }
    setState('loading');
    try {
      const data = await fetch(`${API}/songs/${song._id}/share`, { method: 'POST' }).then(r => r.json());

      // Cas 1 : réponse normale { shareToken: "..." }
      let token = data.shareToken || data.token || data.share?.token;

      // Cas 2 : bug backend — le token est imbriqué dans un objet stringifié
      // Le message d'erreur contient le vrai token JWT dans "token: '...'"
      if (!token && data.message) {
        const match = data.message.match(/token:\s*'([^']+)'/);
        if (match) token = match[1];
      }

      if (!token) throw new Error('token introuvable');

      const url = `${window.location.origin}/share/${token}`;
      setUrl(url);
      setShowPop(true);
      setState('idle');
    } catch {
      // Fallback : lien direct si l'API de partage est indisponible
      const fallback = `${window.location.origin}/?song=${song._id}`;
      setUrl(fallback);
      setShowPop(true);
      setState('idle');
    }
  };

  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Fallback pour navigateurs sans clipboard API
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setState('copied');
    setTimeout(() => setState('idle'), 2500);
  };

  const shareNative = async (e) => {
    e.stopPropagation();
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${song.titre} — ${song.artiste}`,
        text:  `Écoute "${song.titre}" sur Moozik`,
        url:   shareUrl,
      });
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bouton déclencheur */}
      <button
        onClick={generate}
        title="Partager"
        className="p-1.5 text-zinc-500 hover:text-white transition rounded-lg hover:bg-white/10"
      >
        {state === 'loading'
          ? <Loader2 size={size} className="animate-spin" />
          : <Share2 size={size} />
        }
      </button>

      {/* Popover de partage */}
      {showPop && shareUrl && (
        <div
          className="absolute bottom-9 right-0 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-[100] p-4"
          onClick={e => e.stopPropagation()}
        >
          {/* En-tête titre */}
          <div className="flex items-center gap-2 mb-3">
            <img src={song.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{song.titre}</p>
              <p className="text-[10px] text-zinc-500 truncate">{song.artiste}</p>
            </div>
            <button
              onClick={() => setShowPop(false)}
              className="ml-auto text-zinc-600 hover:text-white shrink-0 p-1"
            >
              <X size={13} />
            </button>
          </div>

          {/* URL */}
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 mb-3">
            <ExternalLink size={11} className="text-zinc-500 shrink-0" />
            <p className="text-[10px] text-zinc-400 flex-1 truncate">{shareUrl}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={copy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                state === 'copied'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-white'
              }`}
            >
              {state === 'copied'
                ? <><Check size={12} /> Copié !</>
                : <><Copy size={12} /> Copier le lien</>
              }
            </button>
            {navigator.share && (
              <button
                onClick={shareNative}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition"
                title="Partager via..."
              >
                <ExternalLink size={13} />
              </button>
            )}
          </div>
          <p className="text-[9px] text-zinc-700 text-center mt-2">Lien valable 7 jours</p>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// GLOBAL SEARCH VIEW
// ════════════════════════════════════════════
const GlobalSearchView = ({
  searchTerm, currentSong, setCurrentSong, setIsPlaying, isPlaying,
  toggleLike, onClear, addToQueue, token, isLoggedIn,
  userPlaylists, onAddToUserPlaylist, isAudioCached, cacheAudio, removeCached,
}) => {
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await fetch(`${API}/search/global?q=${encodeURIComponent(q.trim())}`).then(r => r.json());
      setResults(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    doSearch(searchTerm);
  }, [searchTerm, doSearch]);

  // Ferme le menu contextuel si clic ailleurs
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenu]);

  const total = results
    ? (results.songs?.length    || 0) + (results.artists?.length   || 0) +
      (results.albums?.length   || 0) + (results.playlists?.length || 0)
    : 0;

  // ── Actions ──────────────────────────────────────────────────────────────
  const handlePlay = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setOpenMenu(null);
  };

  const handleQueue = (song) => {
    if (addToQueue) addToQueue(song);
    setOpenMenu(null);
  };

  const handleDownload = async (song) => {
    if (cacheAudio) {
      if (isAudioCached?.(song._id)) removeCached?.(song._id);
      else await cacheAudio(song);
    } else {
      window.open(song.url || song.audioUrl, '_blank');
    }
    setOpenMenu(null);
  };

  const handleLike = (song) => {
    if (toggleLike) toggleLike(song._id);
    setOpenMenu(null);
  };

  const handleAddToPlaylist = (song, playlistId) => {
    if (onAddToUserPlaylist) onAddToUserPlaylist(playlistId, song._id);
    setOpenMenu(null);
  };

  if (!searchTerm) return null;

  return (
    <div className="w-full mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-zinc-300">
            Résultats pour <span className="text-white">"{searchTerm}"</span>
          </h2>
          {results && !loading && (
            <p className="text-[11px] text-zinc-600 mt-0.5">
              {total} résultat{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2" /> Recherche...
        </div>
      )}

      {/* ── Aucun résultat ── */}
      {!loading && results && total === 0 && (
        <div className="flex flex-col items-center py-16 text-zinc-600 gap-3">
          <Search size={38} className="opacity-20" />
          <p className="text-sm">Aucun résultat pour "{searchTerm}"</p>
        </div>
      )}

      {/* ── Résultats ── */}
      {!loading && results && total > 0 && (
        <>
          {/* ════ MUSIQUES ════ */}
          {results.songs?.length > 0 && (
            <section>
              <SectionTitle
                icon={<Music size={15} className="text-red-400" />}
                label="Musiques"
                count={results.songs.length}
              />
              <div className="flex flex-col gap-1">
                {results.songs.map((song) => {
                  const isActive   = currentSong?._id === song._id;
                  const isCached   = isAudioCached?.(song._id);
                  const isMenuOpen = openMenu === song._id;

                  return (
                    <div
                      key={song._id}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl group transition
                        ${isActive
                          ? 'bg-red-600/10 border border-red-600/20'
                          : 'hover:bg-white/5 border border-transparent'}
                      `}
                    >
                      {/* Pochette */}
                      <button onClick={() => handlePlay(song)} className="relative shrink-0 focus:outline-none">
                        <img src={song.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        {isActive && isPlaying ? (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <Pause size={12} fill="white" className="text-white" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Play size={12} fill="white" className="text-white ml-0.5" />
                          </div>
                        )}
                      </button>

                      {/* Infos */}
                      <button onClick={() => handlePlay(song)} className="flex-1 min-w-0 text-left focus:outline-none">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>{song.titre}</p>
                        <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
                      </button>

                      {/* Plays */}
                      {song.plays > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-700 shrink-0 hidden sm:flex">
                          <TrendingUp size={9} className="text-green-500/70" /> {song.plays}
                        </div>
                      )}

                      {/* ── Actions rapides desktop (hover) ── */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition">

                        {/* Like */}
                        <ActionBtn onClick={() => handleLike(song)} title="J'aime" active={song.liked}>
                          <Heart size={13} fill={song.liked ? '#ef4444' : 'none'} className={song.liked ? 'text-red-500' : ''} />
                        </ActionBtn>

                        {/* File d'attente */}
                        <ActionBtn onClick={() => handleQueue(song)} title="Ajouter à la file d'attente">
                          <ListPlus size={13} />
                        </ActionBtn>

                        {/* ✅ Vrai ShareButton avec token API */}
                        <ShareButton song={song} size={13} />

                        {/* Hors-ligne */}
                        <ActionBtn
                          onClick={() => handleDownload(song)}
                          title={isCached ? 'Retirer hors-ligne' : 'Disponible hors-ligne'}
                          active={isCached}
                        >
                          <Download size={13} className={isCached ? 'text-green-400' : ''} />
                        </ActionBtn>

                        {/* Menu "..." */}
                        <div className="relative">
                          <ActionBtn
                            onClick={(e) => { e.stopPropagation(); setOpenMenu(isMenuOpen ? null : song._id); }}
                            title="Plus d'options"
                            active={isMenuOpen}
                          >
                            <MoreHorizontal size={13} />
                          </ActionBtn>
                          {isMenuOpen && (
                            <SongMenu
                              song={song}
                              userPlaylists={userPlaylists}
                              isLoggedIn={isLoggedIn}
                              onPlay={() => handlePlay(song)}
                              onQueue={() => handleQueue(song)}
                              onDownload={() => handleDownload(song)}
                              onAddToPlaylist={(pid) => handleAddToPlaylist(song, pid)}
                              onClose={() => setOpenMenu(null)}
                            />
                          )}
                        </div>
                      </div>

                      {/* ── Menu mobile (toujours visible) ── */}
                      <div className="sm:hidden shrink-0 relative">
                        <ActionBtn
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(isMenuOpen ? null : song._id); }}
                          title="Options"
                        >
                          <MoreHorizontal size={14} />
                        </ActionBtn>
                        {isMenuOpen && (
                          <SongMenu
                            song={song}
                            userPlaylists={userPlaylists}
                            isLoggedIn={isLoggedIn}
                            onPlay={() => handlePlay(song)}
                            onQueue={() => handleQueue(song)}
                            onDownload={() => handleDownload(song)}
                            onAddToPlaylist={(pid) => handleAddToPlaylist(song, pid)}
                            onClose={() => setOpenMenu(null)}
                            alignRight
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ════ ARTISTES ════ */}
          {results.artists?.length > 0 && (
            <section>
              <SectionTitle icon={<Mic2 size={15} className="text-purple-400" />} label="Artistes" count={results.artists.length} />
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {results.artists.map(a => (
                  <Link key={a._id} to={`/artist/${a._id}`} className="shrink-0 w-24 text-center group">
                    <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden bg-zinc-800 border-2 border-zinc-700 group-hover:border-purple-500/50 transition">
                      {a.image
                        ? <img src={a.image} className="w-full h-full object-cover" alt="" />
                        : <Mic2 size={26} className="text-zinc-600 m-auto mt-5" />}
                    </div>
                    <p className="text-xs font-bold truncate text-zinc-300 group-hover:text-purple-400 transition">{a.nom}</p>
                    {a.bio && <p className="text-[9px] text-zinc-600 truncate mt-0.5">{a.bio}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ════ ALBUMS ════ */}
          {results.albums?.length > 0 && (
            <section>
              <SectionTitle icon={<Disc3 size={15} className="text-indigo-400" />} label="Albums" count={results.albums.length} />
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {results.albums.map(album => (
                  <Link key={album._id} to={`/album/${album._id}`} className="shrink-0 w-28 group">
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-zinc-800 mb-2 group-hover:scale-105 transition">
                      {album.image
                        ? <img src={album.image} className="w-full h-full object-cover" alt="" />
                        : <Disc3 size={32} className="text-indigo-400 m-auto mt-10" />}
                    </div>
                    <p className="text-xs font-bold truncate text-zinc-200">{album.titre}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{album.artiste} · {album.annee}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ════ PLAYLISTS ════ */}
          {results.playlists?.length > 0 && (
            <section>
              <SectionTitle icon={<Globe size={15} className="text-green-400" />} label="Playlists publiques" count={results.playlists.length} />
              <div className="flex flex-col gap-2">
                {results.playlists.map(pl => (
                  <Link
                    key={pl._id}
                    to={`/my-playlist/${pl._id}`}
                    className="flex items-center gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center shrink-0">
                      <Globe size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-green-400 transition">{pl.nom}</p>
                      <p className="text-[10px] text-zinc-600">
                        par {pl.userId?.nom || 'Utilisateur'} · {pl.musiques?.length || 0} titre{pl.musiques?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Play size={14} className="text-zinc-600 group-hover:text-green-400 transition shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

// ── Bouton action générique ───────────────────────────────────────────────────
const ActionBtn = ({ onClick, title, children, active }) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      p-1.5 rounded-lg transition
      ${active ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/8'}
    `}
  >
    {children}
  </button>
);

// ── Menu contextuel "..." ─────────────────────────────────────────────────────
const SongMenu = ({
  song, userPlaylists, isLoggedIn,
  onPlay, onQueue, onDownload, onAddToPlaylist,
  onClose, alignRight,
}) => {
  const [showPlaylists, setShowPlaylists] = useState(false);

  return (
    <div
      onClick={e => e.stopPropagation()}
      className={`
        absolute z-50 bottom-full mb-1 ${alignRight ? 'right-0' : 'right-0'}
        w-56 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl
        overflow-hidden py-1
        animate-in fade-in slide-in-from-bottom-2 duration-150
      `}
    >
      <MenuItem icon={<Play size={13} />} onClick={onPlay}>Lire maintenant</MenuItem>
      <MenuItem icon={<ListPlus size={13} />} onClick={onQueue}>Ajouter à la file d'attente</MenuItem>

      <MenuDivider />

      {/* Ajouter à une playlist */}
      {isLoggedIn && userPlaylists?.length > 0 && (
        <>
          <button
            onClick={() => setShowPlaylists(v => !v)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition"
          >
            <Music size={13} className="text-zinc-500 shrink-0" />
            <span className="flex-1 text-left">Ajouter à une playlist</span>
            <span className="text-zinc-600 text-[10px]">{showPlaylists ? '▲' : '▼'}</span>
          </button>
          {showPlaylists && (
            <div className="bg-zinc-950/60 border-t border-zinc-800/50">
              {userPlaylists.map(pl => (
                <button
                  key={pl._id}
                  onClick={() => onAddToPlaylist(pl._id)}
                  className="w-full flex items-center gap-2 px-4 py-1.5 text-[11px] text-zinc-400 hover:bg-white/5 hover:text-white transition text-left"
                >
                  <Globe size={10} className="text-green-500 shrink-0" />
                  <span className="truncate">{pl.nom}</span>
                </button>
              ))}
            </div>
          )}
          <MenuDivider />
        </>
      )}

      <MenuItem icon={<Radio size={13} />} onClick={onClose}>Radio similaire</MenuItem>

      {/* ✅ ShareButton intégré dans le menu aussi */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        <ShareButton song={song} size={13} />
        <span className="text-xs text-zinc-300">Partager</span>
      </div>

      <MenuItem icon={<Download size={13} />} onClick={onDownload}>Disponible hors-ligne</MenuItem>

      <MenuDivider />
      <MenuItem icon={<X size={13} />} onClick={onClose} danger>Fermer</MenuItem>
    </div>
  );
};

const MenuItem = ({ icon, onClick, children, danger }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-2.5 px-3 py-2 text-xs transition
      ${danger
        ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
        : 'text-zinc-300 hover:bg-white/5 hover:text-white'}
    `}
  >
    <span className={`shrink-0 ${danger ? 'text-red-400/70' : 'text-zinc-500'}`}>{icon}</span>
    {children}
  </button>
);

const MenuDivider = () => <div className="my-1 border-t border-zinc-800/60" />;

const SectionTitle = ({ icon, label, count }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon}
    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</h3>
    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">{count}</span>
  </div>
);

export default GlobalSearchView;