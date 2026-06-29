// hooks/useAuth.js
import { useState, useCallback } from 'react';
import { API } from '../config/api';

// ─── Endpoint map ─────────────────────────────────────────────────────────────
const ENDPOINTS = {
  admin:  { login: '/admin/login' },
  artist: { login: '/artists/login' },
  user:   { login: '/users/login', register: '/users/register' },
};

// ─── Clés localStorage centralisées ──────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN:     'moozik_token',
  EMAIL:     'moozik_email',
  ROLE:      'moozik_role',
  NOM:       'moozik_nom',
  ARTIST_ID: 'moozik_artisteId',
  USER_ID:   'moozik_userId',
};

const persistSession = (data) => {
  const entries = [
    [STORAGE_KEYS.TOKEN,     data.token],
    [STORAGE_KEYS.EMAIL,     data.email],
    [STORAGE_KEYS.ROLE,      data.role],
    [STORAGE_KEYS.NOM,       data.nom],
    [STORAGE_KEYS.ARTIST_ID, data.artisteId],
    [STORAGE_KEYS.USER_ID,   data.userId],
  ];
  entries.forEach(([key, value]) => {
    if (value != null) localStorage.setItem(key, value);
  });
};

/**
 * Efface toutes les clés de session du localStorage.
 * Appelé lors d'un logout ou d'une session révoquée.
 */
export const clearLocalSession = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

/**
 * Déconnexion propre : notifie le serveur puis nettoie le localStorage.
 * N'échoue jamais (le logout local se fait même si la requête échoue).
 */
export const logoutFromServer = async () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    try {
      await fetch(`${API}/sessions/logout`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore les erreurs réseau — le nettoyage local se fait quand même
    }
  }
  clearLocalSession();
};

/**
 * Détecte si une réponse 401 indique une session révoquée
 * (nouvelle connexion depuis un autre appareil).
 */
export const isSessionExpiredResponse = (data) =>
  data?.message === 'SESSION_EXPIRED' || data?.message === 'SESSION_INVALID';

// ─── Validation client ────────────────────────────────────────────────────────
const validate = ({ mode, isRegister, email, password, nom }) => {
  if (!email.includes('@') || !email.includes('.'))
    return 'Adresse email invalide.';
  if (password.length < 6)
    return 'Mot de passe trop court (6 caractères minimum).';
  if (mode === 'user' && isRegister && !nom.trim())
    return "Veuillez entrer un nom d'affichage.";
  return null;
};

// ─── Hook principal ───────────────────────────────────────────────────────────
export const useAuth = (onLogin) => {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearError = useCallback(() => {
    setError('');
    setSuccessMsg('');
  }, []);

  const submit = useCallback(async ({ mode, isRegister, email, password, nom }) => {
    const validationError = validate({ mode, isRegister, email, password, nom });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const action   = isRegister ? 'register' : 'login';
    const endpoint = ENDPOINTS[mode]?.[action] ?? ENDPOINTS[mode]?.login;
    const body     = mode === 'user' && isRegister
      ? { email, password, nom }
      : { email, password };

    try {
      const res  = await fetch(`${API}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erreur de connexion. Veuillez réessayer.');
      } else if (isRegister && !data.token) {
        setSuccessMsg(data.message);
      } else {
        persistSession(data);
        onLogin(data);
      }
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  return { loading, error, clearError, submit, successMsg };
};