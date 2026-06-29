// ════════════════════════════════════════════
// usePushNotifications.js
// Hook WebPush — demander la permission + s'abonner
// ════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';

const API = 'https://moozik-gft1.onrender.com';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export const usePushNotifications = (token) => {
  const [permission, setPermission]   = useState(Notification?.permission || 'default');
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(false);


  // Vérifier si déjà abonné
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub));
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Notifications push non supportées sur ce navigateur.');
      return false;
    }
    setLoading(true);
    try {
    // 1. Récupérer la clé VAPID publique
    const { publicKey } = await fetch(`${API}/push/vapid-key`).then(r => r.json());
    console.log('1. publicKey:', publicKey);

    const perm = await Notification.requestPermission();
    console.log('2. permission:', perm);
    if (perm !== 'granted') { setLoading(false); return false; }

    const reg = await navigator.serviceWorker.ready;
    console.log('3. service worker:', reg);
    console.log('3b. pushManager:', reg.pushManager);
    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    console.log('3. sub:', sub);

    const res = await fetch(`${API}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    console.log('4. status:', res.status);

    setSubscribed(true);
    console.log('5. setSubscribed(true) appelé');
    return true;
    } catch (e) {
    console.error('Erreur détaillée:', e);
    return false;
}
    finally { setLoading(false); }
  }, [token]);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await sub.unsubscribe();
    await fetch(`${API}/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    setSubscribed(false);
  }, []);

  return { permission, subscribed, loading, subscribe, unsubscribe };
};



