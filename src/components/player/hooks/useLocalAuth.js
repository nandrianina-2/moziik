import { useMemo } from 'react';

/**
 * Lit les données d'authentification depuis localStorage une seule fois.
 * Ces valeurs sont stables pendant toute la durée de vie du composant.
 *
 * @returns {{ role: string|null, userNom: string }}
 */
export const useLocalAuth = () => {
  return useMemo(() => {
    if (typeof localStorage === 'undefined') return { role: null, userNom: '' };
    return {
      role: localStorage.getItem('moozik_role'),
      userNom: localStorage.getItem('moozik_nom') ?? '',
    };
  }, []);
};