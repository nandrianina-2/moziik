import { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';
import { STORAGE_KEYS } from '../hooks/useAuth';

// ── Icônes SVG inline ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = 'currentColor', fill = 'none', strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  desktop:  () => <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  mobile:   () => <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>,
  tablet:   () => <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>,
  shield:   () => <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2l8 3v7c0 5-4 9-8 10C8 21 4 17 4 12V5l8-3z"/><path d="M9 12l2 2 4-4"/></svg>,
  trash:    () => <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>,
  refresh:  () => <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  clock:    () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  globe:    () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  activity: () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  zap:      () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  logOut:   () => <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  check:    () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>,
  history:  () => <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>,
  x:        () => <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const DeviceIcon = ({ type }) => {
  if (type === 'mobile') return <Icons.mobile />;
  if (type === 'tablet') return <Icons.tablet />;
  return <Icons.desktop />;
};

const pad = n => String(n).padStart(2, '0');

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatRelative = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);
  if (m < 1)   return 'À l\'instant';
  if (m < 60)  return `Il y a ${m} min`;
  if (h < 24)  return `Il y a ${h}h`;
  if (jours < 30) return `Il y a ${jours} jour${jours > 1 ? 's' : ''}`;
  return formatDateTime(dateStr);
};

const formatDuration = (start, end) => {
  if (!start) return '—';
  const ms   = new Date(end || Date.now()) - new Date(start);
  const m    = Math.floor(ms / 60000);
  const h    = Math.floor(ms / 3600000);
  const jours= Math.floor(ms / 86400000);
  if (m < 1)    return 'Moins d\'1 min';
  if (m < 60)   return `${m} min`;
  if (h < 24)   return `${h}h ${m % 60}min`;
  return `${jours}j ${h % 24}h`;
};

const STATUS_CONFIG = {
  active:  { label: 'Active',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)'  },
  logout:  { label: 'Déconnecté',   color: '#a1a1aa', bg: 'rgba(161,161,170,0.1)', border: 'rgba(161,161,170,0.2)' },
  revoked: { label: 'Révoquée',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  },
  expired: { label: 'Expirée',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
};

const Badge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.expired;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
};

// ── Carte de session ──────────────────────────────────────────────────────────
const SessionCard = ({ session, onRevoke, revoking, isHistory }) => {
  const [expanded, setExpanded] = useState(false);
  const isCurrent = session.isCurrent;
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.expired;

  const borderColor = isCurrent
    ? 'rgba(239,68,68,0.4)'
    : isHistory
      ? 'rgba(255,255,255,0.05)'
      : 'rgba(255,255,255,0.08)';

  const bgColor = isCurrent
    ? 'rgba(239,68,68,0.06)'
    : isHistory
      ? 'rgba(255,255,255,0.02)'
      : 'rgba(255,255,255,0.04)';

  return (
    <div style={{
      background: bgColor,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* ── Ligne principale ── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        {/* Icône appareil */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: isCurrent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isCurrent ? '#ef4444' : isHistory ? '#52525b' : '#a1a1aa',
        }}>
          <DeviceIcon type={session.device?.type} />
        </div>

        {/* Infos principales */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: isHistory ? '#71717a' : '#e4e4e7' }}>
              {session.device?.browser || 'Navigateur inconnu'}
              {session.device?.browserVersion ? ` ${session.device.browserVersion}` : ''}
            </span>
            <span style={{ fontSize: 12, color: '#52525b' }}>·</span>
            <span style={{ fontSize: 13, color: '#71717a' }}>
              {session.device?.os || 'OS inconnu'}
              {session.device?.osVersion ? ` ${session.device.osVersion}` : ''}
            </span>
            {isCurrent && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                background: '#dc2626', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Cet appareil
              </span>
            )}
            <Badge status={session.status} />
          </div>

          {/* Ligne secondaire */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#52525b' }}>
              <Icons.clock /> Connexion : {formatDateTime(session.connectedAt)}
            </span>
            {!isHistory && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#52525b' }}>
                <Icons.activity /> Vu : {formatRelative(session.lastSeenAt)}
              </span>
            )}
            {isHistory && session.disconnectedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#52525b' }}>
                <Icons.logOut /> Fin : {formatDateTime(session.disconnectedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action révoquer (sessions actives non-courantes) */}
        {!isCurrent && !isHistory && (
          <button
            onClick={e => { e.stopPropagation(); onRevoke(session._id); }}
            disabled={revoking === session._id}
            title="Révoquer cette session"
            style={{
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
              padding: '6px 12px', cursor: revoking === session._id ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
              fontWeight: 600, flexShrink: 0, opacity: revoking === session._id ? 0.5 : 1,
            }}
          >
            <Icons.trash />
            {revoking === session._id ? '…' : 'Révoquer'}
          </button>
        )}

        {/* Chevron expand */}
        <span style={{ color: '#3f3f46', fontSize: 16, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▾</span>
      </div>

      {/* ── Détails étendus ── */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          <Detail icon={<Icons.globe />}    label="Adresse IP"          value={session.ip || '—'} />
          <Detail icon={<Icons.globe />}    label="Localisation"        value={
            session.location?.city
              ? `${session.location.city}${session.location.region ? ', ' + session.location.region : ''}${session.location.country ? ' · ' + session.location.country : ''}`
              : '—'
          } />
          <Detail icon={<Icons.clock />}    label="Connexion"           value={formatDateTime(session.connectedAt)} />
          <Detail icon={<Icons.activity />} label="Dernière activité"   value={formatDateTime(session.lastSeenAt)} />
          {session.disconnectedAt && (
            <Detail icon={<Icons.logOut />} label="Déconnexion"         value={formatDateTime(session.disconnectedAt)} />
          )}
          <Detail icon={<Icons.clock />}    label="Durée de session"    value={formatDuration(session.connectedAt, session.disconnectedAt)} />
          <Detail icon={<Icons.zap />}      label="Requêtes"            value={`${session.requestCount || 1} requête${session.requestCount > 1 ? 's' : ''}`} />
          <Detail icon={<Icons.shield />}   label="Expiration du token" value={session.expiresAt ? formatDateTime(session.expiresAt) : '—'} />
          {session.device?.brand && (
            <Detail icon={<DeviceIcon type={session.device.type} />} label="Marque" value={session.device.brand} />
          )}
        </div>
      )}
    </div>
  );
};

const Detail = ({ icon, label, value }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, color: '#52525b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 13, color: '#a1a1aa', fontFamily: label === 'Adresse IP' ? 'monospace' : 'inherit' }}>
      {value}
    </div>
  </div>
);

// ── Composant principal ───────────────────────────────────────────────────────
export default function SessionsView() {
  const [data,      setData]      = useState({ active: [], history: [], stats: {} });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [revoking,  setRevoking]  = useState(null);
  const [toast,     setToast]     = useState({ msg: '', type: 'success' });
  const [tab,       setTab]       = useState('active');   // 'active' | 'history'
  const [clearing,  setClearing]  = useState(false);

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const normalizeData = (json) => ({
    active:  Array.isArray(json?.active)  ? json.active  : [],
    history: Array.isArray(json?.history) ? json.history : [],
    stats:   json?.stats ?? {},
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/sessions`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(normalizeData(json));
    } catch (e) {
      setError(e.message || 'Impossible de charger les sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const revokeSession = async (id) => {
    setRevoking(id);
    try {
      const res  = await fetch(`${API}/sessions/${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast('Session révoquée');
      await fetchSessions();
    } catch (e) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setRevoking(null); }
  };

  const revokeAll = async () => {
    if (!window.confirm('Déconnecter tous les autres appareils ?')) return;
    setRevoking('all');
    try {
      const res  = await fetch(`${API}/sessions/all-others`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast(json.message);
      await fetchSessions();
    } catch (e) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setRevoking(null); }
  };

  const clearHistory = async () => {
    if (!window.confirm('Effacer tout l\'historique des sessions ?')) return;
    setClearing(true);
    try {
      const res  = await fetch(`${API}/sessions/history`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast(json.message);
      await fetchSessions();
    } catch (e) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setClearing(false); }
  };

  const otherActive = data.active.filter(s => !s.isCurrent);
  const current     = data.active.find(s => s.isCurrent);

  // ── Statistiques rapides ──────────────────────────────────────────────────
  const totalRequests = [...data.active, ...data.history].reduce((acc, s) => acc + (s.requestCount || 1), 0);
  const lastActivity  = data.active.find(s => s.isCurrent)?.lastSeenAt;

  return (
    <div style={{ margin: '0 auto', padding: '24px 16px', color: '#e4e4e7' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <Icons.shield />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Sécurité des sessions</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#52525b' }}>
              Gérez les appareils connectés à votre compte
            </p>
          </div>
        </div>
        <button onClick={fetchSessions} title="Actualiser" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 10px', color: '#71717a', cursor: 'pointer' }}>
          <Icons.refresh />
        </button>
      </div>

      {/* ── Stats rapides ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Appareils actifs',    value: data.stats?.totalActive  || 0, color: '#22c55e' },
          { label: 'Sessions historique', value: data.stats?.totalHistory || 0, color: '#a1a1aa' },
          { label: 'Requêtes totales',    value: totalRequests,                 color: '#818cf8' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div style={{
          background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          color: toast.type === 'error' ? '#ef4444' : '#22c55e',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'error' ? <Icons.x /> : <Icons.check />}
          {toast.msg}
        </div>
      )}

      {/* ── Erreur ── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#3f3f46', fontSize: 14 }}>
          Chargement des sessions…
        </div>
      ) : (
        <>
          {/* ── Onglets ── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 }}>
            {[
              { key: 'active',  label: `Actives (${data.active.length})`,    icon: <Icons.shield /> },
              { key: 'history', label: `Historique (${data.history.length})`, icon: <Icons.history /> },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  background: tab === t.key ? 'rgba(239,68,68,0.15)' : 'transparent',
                  color:      tab === t.key ? '#ef4444' : '#52525b',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════ ONGLET ACTIVES ══════════════ */}
          {tab === 'active' && (
            <>
              {/* Session courante */}
              {current && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    Session courante
                  </p>
                  <SessionCard session={current} onRevoke={revokeSession} revoking={revoking} isHistory={false} />
                </>
              )}

              {/* Autres appareils */}
              {otherActive.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
                      Autres appareils ({otherActive.length})
                    </p>
                    <button
                      onClick={revokeAll}
                      disabled={revoking === 'all'}
                      style={{
                        background: 'transparent', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8, padding: '5px 12px',
                        fontSize: 12, fontWeight: 600, cursor: revoking === 'all' ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        opacity: revoking === 'all' ? 0.5 : 1,
                      }}
                    >
                      <Icons.logOut />
                      {revoking === 'all' ? 'Révocation…' : 'Tout déconnecter'}
                    </button>
                  </div>
                  {otherActive.map(s => (
                    <SessionCard key={s._id} session={s} onRevoke={revokeSession} revoking={revoking} isHistory={false} />
                  ))}
                </>
              )}

              {data.active.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#3f3f46', fontSize: 13 }}>
                  Aucune session active
                </div>
              )}

              {data.active.length === 1 && !otherActive.length && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
                  <Icons.check />
                  <span style={{ fontSize: 12, color: '#4ade80' }}>
                    Votre compte n'est connecté que sur cet appareil.
                  </span>
                </div>
              )}
            </>
          )}

          {/* ══════════════ ONGLET HISTORIQUE ══════════════ */}
          {tab === 'history' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#52525b' }}>
                  30 derniers jours · {data.history.length} session{data.history.length > 1 ? 's' : ''}
                </p>
                {data.history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    disabled={clearing}
                    style={{
                      background: 'transparent', color: '#71717a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '5px 12px',
                      fontSize: 12, fontWeight: 600, cursor: clearing ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <Icons.trash />
                    {clearing ? 'Suppression…' : 'Effacer l\'historique'}
                  </button>
                )}
              </div>

              {data.history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#3f3f46', fontSize: 13 }}>
                  Aucune session dans l'historique
                </div>
              ) : (
                data.history.map(s => (
                  <SessionCard key={s._id} session={s} onRevoke={revokeSession} revoking={revoking} isHistory={true} />
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}