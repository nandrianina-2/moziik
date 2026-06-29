import { useState, useEffect, useRef, useCallback } from 'react';
import { API } from '../config/api.js';

/**
 * Hook de pagination avec infinite scroll.
 * Charge automatiquement la page suivante quand le sentinel est visible.
 *
 * @param {string} endpoint  - ex: '/songs' (doit retourner { songs, pagination })
 * @param {object} params    - query params supplémentaires (search, genre…)
 * @param {string} token     - JWT optionnel
 */
export function useInfiniteScroll(endpoint, params = {}, token = '') {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);
  const paramsKey = JSON.stringify(params);

  // Reset quand les params changent (nouvelle recherche, etc.)
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [paramsKey, endpoint]);

  const load = useCallback(async (pageNum) => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: pageNum, limit: 20, ...params }).toString();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}${endpoint}?${qs}`, { headers });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();

      // Compatible tableau direct ou { songs/items, pagination }
      const newItems = data.songs || data.items || data.data || (Array.isArray(data) ? data : []);
      const pagination = data.pagination || {};

      setItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
      setHasMore(pagination.hasNextPage ?? (newItems.length === 20));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, paramsKey, token, hasMore, loading]);

  // Charge page initiale
  useEffect(() => {
    load(1);
  }, [paramsKey, endpoint]);

  // Intersection Observer pour auto-load
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  // Charge la nouvelle page quand page change
  useEffect(() => {
    if (page > 1) load(page);
  }, [page]);

  return { items, loading, error, hasMore, sentinelRef };
}

/**
 * Composant sentinel — placer en bas de la liste.
 * Déclenche le chargement de la page suivante automatiquement.
 */
export const InfiniteScrollSentinel = ({ sentinelRef, loading, hasMore }) => (
  <div ref={sentinelRef} className="flex items-center justify-center py-6">
    {loading && (
      <div className="flex gap-1.5 items-center">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    )}
    {!loading && !hasMore && (
      <p className="text-[11px] text-zinc-700 uppercase tracking-widest">— Fin —</p>
    )}
  </div>
);
