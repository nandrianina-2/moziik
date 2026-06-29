// hooks/useSessionGuard.js
// ─────────────────────────────────────────────────────────────────────────────
// Hook à monter UNE SEULE FOIS dans App.jsx.
// Intercepte les réponses 401 SESSION_EXPIRED/SESSION_INVALID à l'échelle
// globale via un monkey-patch de window.fetch, et déclenche la déconnexion.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { clearLocalSession, isSessionExpiredResponse } from './useAuth';

/**
 * @param {Function} onSessionExpired - Callback appelé quand une session révoquée
 *                                      est détectée. Typiquement : afficher un toast
 *                                      + rediriger vers l'écran de login.
 */
export const useSessionGuard = (onSessionExpired) => {
  // Ref pour éviter de déclencher plusieurs fois pendant le même render
  const triggered = useRef(false);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Cloner la réponse pour lire le corps sans consommer le stream original
      if (response.status === 401) {
        try {
          const clone = response.clone();
          const data  = await clone.json();

          if (isSessionExpiredResponse(data) && !triggered.current) {
            triggered.current = true;

            // Nettoyer la session locale
            clearLocalSession();

            // Notifier l'app (toast + navigation)
            onSessionExpired(data.detail || 'Votre session a été fermée (nouvelle connexion détectée).');

            // Reset du flag après 3 s pour permettre une future détection
            setTimeout(() => { triggered.current = false; }, 3000);
          }
        } catch {
          // JSON parse échoué → pas une de nos erreurs, ignorer
        }
      }

      return response;
    };

    // Restaurer le fetch original au démontage du composant
    return () => {
      window.fetch = originalFetch;
    };
  }, [onSessionExpired]);
};