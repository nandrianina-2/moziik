// ════════════════════════════════════════════
// useSubscription.js  →  src/hooks/useSubscription.js
// Hook central pour gérer l'abonnement utilisateur
// ════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://moozik-gft1.onrender.com';

export const useSubscription = (token) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(false);

  const isPremium = subscription?.planName === 'premium' && subscription?.status === 'active';

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        fetch(`${API}/subscriptions/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/plans`),
      ]);
      if (subRes.ok) setSubscription(await subRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const subscribe = async (planId, provider = 'stripe') => {
    try {
      const res = await fetch(`${API}/subscriptions/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ planId, provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        // This will tell you EXACTLY what the backend didn't like
        console.error("Server Error Details:", data);
        throw new Error(data.message || "Checkout failed");
      }

      if (data.url) window.location.href = data.url;
      return data;
    } catch (err) {
      console.error("Subscription Error:", err);
    }
  };

  const cancel = async () => {
    const res = await fetch(`${API}/subscriptions/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    await load();
    return data;
  };

  return { subscription, plans, isPremium, loading, subscribe, cancel, reload: load };
};

export default useSubscription;