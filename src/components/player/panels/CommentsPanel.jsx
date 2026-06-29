import { memo, useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const API = 'https://moozik-gft1.onrender.com';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * @param {{
 *   songId: string,
 *   currentTime: number,
 *   duration: number,
 *   onSeek: (ts: number) => void,
 *   token: string | null,
 *   isLoggedIn: boolean,
 *   userId?: string,
 *   isAdmin: boolean,
 *   userNom: string,
 *   onMarkersReady: (comments: import('../types/player').Comment[]) => void,
 *   accentColor: string,
 * }} props
 */
const CommentsPanel = memo(({
  songId, currentTime, onSeek,
  token, isLoggedIn, userNom,
  onMarkersReady, accentColor,
}) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!songId) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(`${API}/songs/${songId}/comments`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setComments(list);
        onMarkersReady?.(list);
      })
      .catch((e) => { if (e.name !== 'AbortError') setComments([]); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [songId]);

  const post = async () => {
    if (!text.trim() || !token) return;
    try {
      const r = await fetch(`${API}/songs/${songId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim(), timestamp: Math.floor(currentTime) }),
      });
      if (r.ok) {
        const c = await r.json();
        setComments((prev) => [c, ...prev]);
        setText('');
      }
    } catch (e) {
      console.warn('Post comment failed:', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Input */}
      {isLoggedIn && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && post()}
              placeholder={`Commenter à ${fmt(currentTime)}…`}
              style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '9px 13px', fontSize: 12, color: 'rgba(255,255,255,.85)', outline: 'none', fontFamily: 'var(--fp-font)', transition: 'border-color .2s' }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(var(--fp-accent),.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
            />
            <button
              onClick={post}
              style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(var(--fp-accent),1)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(var(--fp-accent),.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="fp-scroll" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.18)', fontSize: 12 }}>Chargement…</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 16px', color: 'rgba(255,255,255,.12)' }}>
            <MessageCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: .15 }} />
            <p style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Aucun commentaire</p>
            <p style={{ fontSize: 11, margin: '4px 0 0', opacity: .5 }}>Soyez le premier à commenter</p>
          </div>
        ) : comments.map((c) => (
          <div key={c._id} className="fp-comment">
            <div className="fp-avatar">{(c.userNom || '?').slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>{c.userNom || 'Anonyme'}</span>
                {c.timestamp != null && (
                  <button className="fp-ts-pill" onClick={() => onSeek?.(c.timestamp)}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    {fmt(c.timestamp)}
                  </button>
                )}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.18)', marginLeft: 'auto' }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CommentsPanel.displayName = 'CommentsPanel';
export default CommentsPanel;