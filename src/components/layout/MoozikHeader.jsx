import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Music, Search, X, Bell, Crown, Upload, Sun, Moon,
  LogIn, LogOut, Settings, User, ChevronDown, WifiOff,
  ArrowLeft, ArrowRight, Zap,
} from 'lucide-react';
import MoziikLogo from '../../assets/logo.png';

/* ── Petite pastille rouge (notifications) ─────────────────── */
const Badge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-600 text-[9px] font-black text-white rounded-full flex items-center justify-center leading-none z-10 border border-zinc-950">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

/* ── Avatar circle ─────────────────────────────────────────── */
const AvatarCircle = ({ avatar, nom, email, role, size = 'sm' }) => {
  const roleColor = role === 'admin' ? 'bg-red-600' : role === 'artist' ? 'bg-purple-600' : 'bg-blue-600';
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${dim} ${roleColor} rounded-full flex items-center justify-center font-black overflow-hidden shrink-0 ring-2 ring-zinc-800`}>
      {avatar
        ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
        : <span>{(nom || email || '?')[0].toUpperCase()}</span>
      }
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MOOZIK HEADER
══════════════════════════════════════════════════════════════ */
const MoozikHeader = ({
  navigate: navProp,
  searchTerm = '',
  setSearchTerm,
  isLoggedIn = false,
  userNom = '',
  userEmail = '',
  userRole = '',
  userAvatar = null,
  unreadNotifs = 0,
  isPremium = false,
  isOnline = true,
  onLogin,
  onLogout,
  onImport,
  darkMode = true,
  setDarkMode,
  handleNext,
  handlePrev,
}) => {
  const navigate = navProp || useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* Ferme le menu si clic extérieur */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Raccourci Cmd+K / Ctrl+K → focus search */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const roleColor = userRole === 'admin' ? 'text-red-400' : userRole === 'artist' ? 'text-purple-400' : 'text-blue-400';
  const roleLabel = userRole === 'admin' ? 'Admin' : userRole === 'artist' ? 'Artiste' : 'Utilisateur';

  return (
    <>
      {/* ═══════════ HEADER DESKTOP ═══════════ */}
      <header className="
        hidden md:flex
        fixed top-0 left-0 right-0 z-50
        h-16
        bg-zinc-950/95 backdrop-blur-2xl
        border-b border-zinc-800/50
        items-center gap-4 px-5
        shadow-[0_1px_0_rgba(255,255,255,0.04)]
      ">
        {/* ─── Logo ─── */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group mr-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-red-600/30 group-hover:shadow-red-500/50 transition-shadow">
            <img 
              src={MoziikLogo}
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[17px] font-black italic tracking-tight text-white">MOOZIK</span>
        </Link>

        {/* ─── Navigation ← → ─── */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95"
            aria-label="Précédent"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95"
            aria-label="Suivant"
          >
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* ─── Barre de recherche ─── */}
        <div className="flex-1 max-w-xl relative mx-2">
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-3.5 text-zinc-500 pointer-events-none z-10"
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher des titres, artistes, albums..."
              value={searchTerm}
              onChange={e => setSearchTerm?.(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchTerm?.(''); searchRef.current?.blur(); } }}
              className="
                w-full h-10
                bg-zinc-900 border border-zinc-800
                rounded-full
                pl-9 pr-24 text-sm text-white placeholder-zinc-600
                focus:outline-none focus:border-zinc-600 focus:bg-zinc-800/80
                transition-all duration-200
              "
            />
            {/* Raccourci keyboard hint */}
            {!searchTerm && (
              <span className="absolute right-3.5 text-[11px] text-zinc-700 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded-md border border-zinc-700/50 pointer-events-none select-none">
                ⌘K
              </span>
            )}
            {/* Clear */}
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm?.(''); searchRef.current?.focus(); }}
                className="absolute right-3 text-zinc-500 hover:text-white transition p-0.5 rounded-full hover:bg-zinc-700"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ─── Actions droite ─── */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">

          {/* Offline badge */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
              <WifiOff size={12} />
              <span className="font-semibold">Hors-ligne</span>
            </div>
          )}

          {/* Premium / Abonnement */}
          {!isPremium && (
            <Link
              to="/premium"
              className="
                flex items-center gap-2
                bg-gradient-to-r from-amber-500 to-orange-500
                hover:from-amber-400 hover:to-orange-400
                text-white text-xs font-black
                px-4 py-2 rounded-full
                transition-all duration-200 active:scale-95
                shadow-md shadow-amber-600/20
              "
            >
              <Crown size={13} />
              <span>Abonnez-vous</span>
            </Link>
          )}
          {isPremium && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full font-bold">
              <Crown size={12} />
              Premium
            </div>
          )}

          {/* Notifications */}
          {isLoggedIn && (
            <Link
              to="/notifications"
              className="relative w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <Badge count={unreadNotifs} />
            </Link>
          )}

          {/* Avatar + menu utilisateur */}
          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-full pl-1 pr-2.5 py-1 transition-all group"
              >
                <AvatarCircle avatar={userAvatar} nom={userNom} email={userEmail} role={userRole} size="sm" />
                <ChevronDown
                  size={13}
                  className={`text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
                    <AvatarCircle avatar={userAvatar} nom={userNom} email={userEmail} role={userRole} size="md" />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${roleColor}`}>{userNom || userEmail}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{roleLabel}</p>
                    </div>
                  </div>
                  {/* Links */}
                  <div className="py-1">
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
                    >
                      <User size={15} /> Mon compte
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
                    >
                      <Settings size={15} /> Paramètres
                    </Link>
                    {userRole === 'admin' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800/60 transition"
                      >
                        <Zap size={15} /> Dashboard admin
                      </Link>
                    )}
                  </div>
                  {/* Logout */}
                  <div className="border-t border-zinc-800/60 py-1">
                    <button
                      onClick={() => { onLogout?.(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition"
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-full transition-all active:scale-95"
            >
              <LogIn size={14} /> Connexion
            </button>
          )}

          {/* Séparateur */}
          <div className="w-px h-6 bg-zinc-800 mx-1" />

          {/* Import */}
          {(userRole === 'admin' || userRole === 'artist') && (
            <button
              onClick={onImport}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition px-3 py-2 rounded-xl hover:bg-zinc-800/60"
            >
              <Upload size={14} /> Importer
            </button>
          )}

          {/* Toggle thème */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              onClick={() => setDarkMode?.(false)}
              title="Thème clair"
              className={`p-1.5 rounded-full transition-all ${!darkMode ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Sun size={13} />
            </button>
            <button
              onClick={() => setDarkMode?.(true)}
              title="Thème sombre"
              className={`p-1.5 rounded-full transition-all ${darkMode ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Moon size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ HEADER MOBILE ═══════════
          NOTE : le header mobile existant dans App.jsx peut être conservé.
          Ce composant gère seulement le desktop (hidden md:flex).
          Pour éviter les conflits, supprimez ou désactivez l'ancien header mobile.
      ════════════════════════════════════════ */}
    </>
  );
};

export default MoozikHeader;