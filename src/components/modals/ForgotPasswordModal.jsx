// components/ForgotPasswordModal/ForgotPasswordModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { API } from '../../config/api';

// ─── Vue : saisie email ───────────────────────────────────────────────────────
const EmailView = ({ onBack, onSent }) => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return setError('Adresse email invalide.');

    setLoading(true);
    setError('');

    try {
        const res = await fetch(`${API}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok) setError(data.message || 'Erreur serveur.');
        else onSent(email.trim());
    } catch (err) {
        console.error('Fetch error:', err); // ← que dit la console ?
        setError('Impossible de contacter le serveur.');
    } finally {
        setLoading(false);
    }
    };

  return (
    <>
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
        Entrez votre email. Si un compte existe, vous recevrez un lien valable <strong className="text-white">15 minutes</strong>.
      </p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            required
            autoFocus
            className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"
          />
        </div>
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
            : <Mail size={18} />
          }
          {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
        </button>
      </form>
      <button
        onClick={onBack}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
      >
        <ArrowLeft size={13} /> Retour à la connexion
      </button>
    </>
  );
};

// ─── Vue : confirmation envoi ─────────────────────────────────────────────────
const SentView = ({ email, onBack, onRetry }) => (
  <div className="text-center flex flex-col items-center gap-4 py-2">
    <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
      <CheckCircle2 size={30} className="text-green-400" />
    </div>
    <div>
      <p className="text-white font-bold mb-1">Email envoyé !</p>
      <p className="text-zinc-400 text-sm leading-relaxed">
        Si <strong className="text-white">{email}</strong> est associé à un compte,<br />
        vous recevrez un lien dans quelques instants.
      </p>
    </div>
    <p className="text-zinc-600 text-xs">Vérifiez aussi vos spams.</p>

    {/* ← Ajout : suggestion si pas reçu */}
    <p className="text-zinc-500 text-xs leading-relaxed border border-zinc-800 rounded-xl px-4 py-3">
      Vous ne recevez rien ?<br />
      Vérifiez que cet email correspond bien à votre compte,<br />
      ou <button onClick={onBack} className="text-red-400 hover:text-red-300 underline transition">créez un nouveau compte</button>.
    </p>

    <button
      onClick={onRetry}
      className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 py-2 rounded-xl transition"
    >
      <Mail size={13} /> Réessayer avec un autre email
    </button>

    <button
      onClick={onBack}
      className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
    >
      <ArrowLeft size={13} /> Retour à la connexion
    </button>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose, onBackToLogin }) => {
  const [view,      setView]      = useState('email'); // 'email' | 'sent'
  const [sentEmail, setSentEmail] = useState('');

  // Fermeture Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleSent = (email) => {
    setSentEmail(email);
    setView('sent');
  };

  // FIX : réessayer → revenir à la vue email (sans fermer le modal)
  const handleRetry = () => setView('email');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-title"
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 id="forgot-title" className="text-xl font-black italic flex items-center gap-2">
            <KeyRound className="text-red-600" size={22} aria-hidden="true" />
            MOT DE PASSE
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-zinc-500 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {view === 'email'
          ? <EmailView onBack={onBackToLogin} onSent={handleSent} />
          : <SentView  email={sentEmail} onBack={onBackToLogin} onRetry={handleRetry} />
        }
      </div>
    </div>
  );
};

export default ForgotPasswordModal;