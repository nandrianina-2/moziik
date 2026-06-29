// components/LoginModal/LoginModal.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LogIn, X, UserCircle, Mic2, ShieldCheck, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ForgotPasswordModal from './ForgotPasswordModal';

// ─── Constantes module-level ──────────────────────────────────────────────────
const TABS = [
  { key: 'user',   label: 'Utilisateur', icon: UserCircle },
  { key: 'artist', label: 'Artiste',     icon: Mic2 },
  { key: 'admin',  label: 'Admin',       icon: ShieldCheck },
];

// ─── Sous-composant : champ de saisie ─────────────────────────────────────────
const Field = ({ label, type = 'text', value, onChange, placeholder, required, inputRef }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword && showPassword ? 'text' : type;

  const autoComplete = isPassword ? 'current-password' : type === 'email' ? 'email' : 'off';

  return (
    <div>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const LoginModal = ({ onLogin, onClose }) => {
  const [mode,        setMode]        = useState('user');
  const [isRegister,  setIsRegister]  = useState(false);
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [nom,         setNom]         = useState('');
  const [showForgot,  setShowForgot]  = useState(false);

  const { loading, error, clearError, submit, successMsg } = useAuth(onLogin);

  const firstFieldRef = useRef(null);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // FIX #7 : séparation en deux effets distincts
  // Effet 1 : focus sur le premier champ uniquement au montage (tableau vide)
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Effet 2 : listener Escape, se réabonne uniquement si onClose change
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTabChange = useCallback((key) => {
    setMode(key);
    setIsRegister(false);
    setEmail('');
    setPassword('');
    setNom('');
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    clearError();
    await submit({ mode, isRegister, email, password, nom });
  }, [submit, clearError, mode, isRegister, email, password, nom]);

  const submitLabel = useMemo(() => {
    if (loading) return isRegister ? 'Création en cours…' : 'Connexion…';
    if (isRegister) return 'Créer mon compte';
    return 'Se connecter';
  }, [loading, isRegister]);

  const handleBackToLogin = useCallback(() => {
    clearError();
    setShowForgot(false);
  }, [clearError]);

  if (showForgot) {
    return (
      <ForgotPasswordModal
        onClose={onClose}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-6">
          <h3 id="login-title" className="text-xl font-black italic flex items-center gap-2">
            <LogIn className="text-red-600" size={22} aria-hidden="true" />
            CONNEXION
          </h3>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer la fenêtre de connexion"
            className="text-zinc-500 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Onglets mode ── */}
        <div
          role="tablist"
          aria-label="Type de compte"
          className="flex bg-zinc-800 rounded-xl p-1 mb-6 gap-1"
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={mode === key}
              aria-controls={`tabpanel-${key}`}
              onClick={() => handleTabChange(key)}
              className={`
                flex-1 py-2 rounded-lg text-[10px] font-bold transition
                flex items-center justify-center gap-1
                ${mode === key ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}
              `}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Toggle connexion / inscription ── */}
        {mode === 'user' && (
          <div
            role="group"
            aria-label="Mode"
            className="flex bg-zinc-800/50 rounded-lg p-0.5 mb-4"
          >
            {[
              { value: false, label: 'Se connecter' },
              { value: true,  label: 'Créer un compte' },
            ].map(({ value, label }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => { setIsRegister(value); clearError(); }}
                className={`
                  flex-1 py-1.5 rounded-md text-xs font-bold transition
                  ${isRegister === value ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Formulaire ── */}
        <div
          id={`tabpanel-${mode}`}
          role="tabpanel"
          aria-labelledby={`tab-${mode}`}
        >
          {successMsg ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={30} className="text-green-400" />
              </div>
              <p className="text-white font-bold">Compte créé !</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{successMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {/* FIX #6 : en mode inscription, le champ Nom est affiché en premier
                  et reçoit le focus (firstFieldRef transmis ici, pas sur email) */}
              {mode === 'user' && isRegister && (
                <Field
                  label="Nom d'affichage"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Votre prénom ou pseudo"
                  required
                  inputRef={firstFieldRef}
                />
              )}

              <Field
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                // FIX #6 : ref sur email uniquement si le champ Nom n'est pas visible
                inputRef={mode === 'user' && isRegister ? undefined : firstFieldRef}
              />

              <Field
                label="Mot de passe"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {/* ── Message d'erreur ── */}
              {error && (
                <p role="alert" className="text-red-400 text-xs bg-red-500/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* ── Bouton submit ── */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  : <LogIn   size={18} aria-hidden="true" />
                }
                {submitLabel}
              </button>

              {/* ── Lien mot de passe oublié (user, mode connexion seulement) ── */}
              {mode === 'user' && !isRegister && (
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 text-center transition -mt-1"
                >
                  Mot de passe oublié ?
                </button>
              )}

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;