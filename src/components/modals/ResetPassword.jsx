// pages/ResetPassword.jsx
// Route : /reset-password?token=xxxx  (configurée dans ton React Router)
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { API } from '../../config/api';

// ─── Champ mot de passe avec toggle visibilité ────────────────────────────────
const PasswordField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Masquer' : 'Afficher'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const ResetPassword = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const token = searchParams.get('token');
    console.log('token dans URL:', token);

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);
  const [tokenInvalid,    setTokenInvalid]    = useState(false);

  // Vérification immédiate : token absent dans l'URL
  useEffect(() => {
    if (!token) setTokenInvalid(true);
  }, [token]);

  // FIX : nettoyage du setTimeout pour éviter les appels sur composant démonté
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/'), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const validate = () => {
    // FIX : aligné à 8 caractères minimum (cohérence frontend / backend)
    if (newPassword.length < 8)
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (newPassword !== confirmPassword)
      return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${API}/users/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword }),
        signal:  controller.signal,
      });
      clearTimeout(timeout);

      let data = {};
      try { data = await res.json(); } catch {}  // ← protège si réponse non-JSON

      if (!res.ok) {
        if (res.status === 400) setTokenInvalid(true);
        else setError(data.message || 'Erreur serveur.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      if (err.name === 'AbortError') setError('Délai dépassé, réessayez.');
      else setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ── Token absent ou invalide ───────────────────────────────────────────────
  if (tokenInvalid) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 fixed w-full top-0 left-0 z-50">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle size={30} className="text-red-500" />
          </div>
          <h2 className="text-white font-black italic text-xl">LIEN INVALIDE</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Ce lien est invalide ou a expiré (durée de validité : 15 minutes).
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 fixed w-full top-0 left-0 z-50">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 size={30} className="text-green-400" />
          </div>
          <h2 className="text-white font-black italic text-xl">MOT DE PASSE MIS À JOUR</h2>
          <p className="text-zinc-400 text-sm">
            Vous allez être redirigé vers l'accueil dans 3 secondes…
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition"
          >
            Retour maintenant
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl">

        <div className="flex items-center gap-2 mb-6">
          <KeyRound className="text-red-600" size={22} aria-hidden="true" />
          <h2 className="text-xl font-black italic text-white">NOUVEAU MOT DE PASSE</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <PasswordField
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="8 caractères minimum"
          />

          {/* Indicateur de force */}
          {newPassword.length > 0 && (
            <div className="flex gap-1 -mt-2">
              {[...Array(4)].map((_, i) => {
                const strength = Math.min(Math.floor(newPassword.length / 3), 4);
                const colors   = ['bg-red-600', 'bg-orange-500', 'bg-yellow-400', 'bg-green-500'];
                return (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i < strength ? colors[strength - 1] : 'bg-zinc-700'
                    }`}
                  />
                );
              })}
            </div>
          )}

          <PasswordField
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <p role="alert" className="text-red-400 text-xs bg-red-500/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <KeyRound size={18} />
            }
            {loading ? 'Mise à jour…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;