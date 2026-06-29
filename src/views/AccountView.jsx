import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera, Save, User, Mail, Key, Loader2, CheckCircle, ShieldCheck,
  Mic2, UserCircle, Trash2, Music, Heart, ListOrdered, AlertCircle,
  Eye, EyeOff, Flame, Share2, Trophy, Image as ImageIcon, Check,
  Settings, Star, Globe, Bell, Radio
} from 'lucide-react';
import { API as API_DEFAULT } from '../config/api';
import { STORAGE_KEYS } from '../hooks/useAuth';

// ─────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────

/**
 * Calcule un seed stable par jour calendaire sans collision annuelle.
 * Ex : 2025-05-07 → 20250507
 */
const getDailySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

// ─────────────────────────────────────────────────────────
// STREAK BADGE
// ─────────────────────────────────────────────────────────
const StreakBadge = ({ streak }) => {
  if (!streak || streak < 1) return null;
  return (
    <span
      aria-label={`Série de ${streak} jour${streak > 1 ? 's' : ''} consécutifs`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'linear-gradient(90deg,#f97316,#fbbf24)',
        color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        padding: '3px 10px', borderRadius: 100,
      }}
    >
      <Flame size={11} aria-hidden="true" />
      {streak} jour{streak > 1 ? 's' : ''} de suite
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// PASSWORD STRENGTH
// ─────────────────────────────────────────────────────────
const PwdStrength = ({ value }) => {
  if (!value) return null;
  const s = value.length < 6 ? 1 : value.length < 8 ? 2 : value.length < 12 ? 3 : 4;
  const colors = ['', '#E24B4A', '#f97316', '#fbbf24', '#4ade80'];
  const labels = ['', 'Trop court', 'Faible', 'Correct', 'Fort'];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Force du mot de passe : ${labels[s]}`}
      style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}
    >
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            height: 3, flex: 1, borderRadius: 100,
            background: i <= s ? colors[s] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }}
        />
      ))}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', minWidth: 52, textAlign: 'right' }}>
        {labels[s]}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// ALERT
// ─────────────────────────────────────────────────────────
const Alert = ({ type, msg }) => {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '10px 14px', borderRadius: 10, fontSize: 12, marginTop: 10,
        background: isErr ? 'rgba(226,75,74,0.08)' : 'rgba(74,222,128,0.08)',
        border: `0.5px solid ${isErr ? 'rgba(226,75,74,0.25)' : 'rgba(74,222,128,0.25)'}`,
        color: isErr ? '#fca5a5' : '#86efac',
      }}
    >
      {isErr
        ? <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
        : <CheckCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />}
      <span>{msg}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TOGGLE ROW — accessible avec role="switch"
// ─────────────────────────────────────────────────────────
const ToggleRow = ({ label, sub, value, onChange }) => (
  <button
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 24px', cursor: 'pointer',
      transition: 'background 0.15s',
      width: '100%', background: 'transparent', border: 'none',
      textAlign: 'left',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>}
    </div>
    {/* Visuel de la bascule */}
    <div
      aria-hidden="true"
      style={{
        width: 40, height: 22, borderRadius: 100, flexShrink: 0,
        background: value ? '#E24B4A' : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'transform 0.2s',
        transform: value ? 'translateX(18px)' : 'translateX(0)',
      }} />
    </div>
  </button>
);

// ─────────────────────────────────────────────────────────
// SECTION CARD / HEADER / BODY
// ─────────────────────────────────────────────────────────
const SectionCard = ({ children, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 20, overflow: 'hidden', ...style,
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, badge }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '20px 24px 0',
  }}>
    <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>{icon}</span>
    <span style={{
      fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.4)',
    }}>{title}</span>
    {badge && (
      <span style={{
        marginLeft: 'auto', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', padding: '3px 8px', borderRadius: 100,
        background: 'rgba(74,222,128,0.12)', color: '#86efac',
        border: '0.5px solid rgba(74,222,128,0.25)',
      }}>{badge}</span>
    )}
  </div>
);

const SectionBody = ({ children }) => (
  <div style={{ padding: '20px 24px 24px' }}>{children}</div>
);

// ─────────────────────────────────────────────────────────
// FIELD
// ─────────────────────────────────────────────────────────
const Field = ({ label, icon, children, htmlFor }) => (
  <div style={{ marginBottom: 14 }}>
    <label
      htmlFor={htmlFor}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 10, fontWeight: 500, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
        marginBottom: 6, cursor: htmlFor ? 'pointer' : 'default',
      }}
    >
      {icon && <span aria-hidden="true" style={{ opacity: 0.7 }}>{icon}</span>}
      {label}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────
// INPUT — corrigé : fusion du style + prop readOnly correcte
// ─────────────────────────────────────────────────────────
const inputBaseStyle = (readonly, disabled) => ({
  width: '100%',
  background: readonly ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
  border: `0.5px solid ${readonly ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 10, padding: '10px 14px',
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  color: readonly ? 'rgba(255,255,255,0.3)' : '#fff',
  outline: 'none', opacity: disabled ? 0.4 : 1,
  cursor: readonly || disabled ? 'not-allowed' : 'text',
  boxSizing: 'border-box',
});

const Input = ({ readOnly, style: styleProp, id, ...props }) => {
  const isDisabled = props.disabled;
  return (
    <input
      id={id}
      {...props}
      readOnly={readOnly}
      style={{
        ...inputBaseStyle(readOnly, isDisabled),
        ...styleProp, // ← les styles passés en prop ne sont plus écrasés
      }}
      onFocus={e => {
        if (!readOnly && !isDisabled) e.target.style.borderColor = '#E24B4A';
      }}
      onBlur={e => {
        e.target.style.borderColor = readOnly
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.1)';
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────
// PRIMARY BUTTON
// ─────────────────────────────────────────────────────────
const BtnPrimary = ({ children, loading, onClick, disabled, variant = 'red' }) => {
  const bg = variant === 'red'
    ? '#E24B4A'
    : variant === 'purple'
    ? 'rgba(147,51,234,0.3)'
    : 'rgba(255,255,255,0.08)';
  const hoverBg = variant === 'red'
    ? '#c43a39'
    : variant === 'purple'
    ? 'rgba(147,51,234,0.45)'
    : 'rgba(255,255,255,0.13)';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      style={{
        width: '100%', padding: '12px 16px',
        background: disabled ? 'rgba(255,255,255,0.06)' : bg,
        border: variant === 'purple' ? '0.5px solid rgba(192,132,252,0.3)' : 'none',
        borderRadius: 12, color: '#fff',
        fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 14, transition: 'background 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = disabled ? 'rgba(255,255,255,0.06)' : bg; }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-label="Chargement…" /> : children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────
// DAILY SONG SHARE
// ─────────────────────────────────────────────────────────
const DailySongShare = ({ musiques }) => {
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);
  const [shareError, setShareError] = useState('');
  const canvasRef = useRef();

  // Seed stable par jour calendaire (corrigé — pas de collision annuelle)
  const song = useMemo(() => {
    if (!musiques?.length) return null;
    const seed = getDailySeed();
    return musiques[seed % musiques.length];
  }, [musiques]);

  if (!song) return null;

  const handleShare = async () => {
    setSharing(true);
    setShareError('');
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 1080;

      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#18181b');
      grad.addColorStop(1, '#450a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      if (song.image) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        try {
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = () => rej(new Error('Image CORS indisponible'));
            img.src = song.image;
          });
          const size = 600, x = 240, y = 180, r = 32;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x + r, y); ctx.lineTo(x + size - r, y);
          ctx.arcTo(x + size, y, x + size, y + r, r);
          ctx.lineTo(x + size, y + size - r);
          ctx.arcTo(x + size, y + size, x + size - r, y + size, r);
          ctx.lineTo(x + r, y + size);
          ctx.arcTo(x, y + size, x, y + size - r, r);
          ctx.lineTo(x, y + r);
          ctx.arcTo(x, y, x + r, y, r);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x, y, size, size);
          ctx.restore();
        } catch {
          // Image inaccessible : on continue sans elle
          setShareError("L'image de couverture n'a pas pu être chargée (CORS). L'image sera générée sans.");
        }
      }

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MOOZIK', 540, 100);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 52px sans-serif';
      ctx.fillText(song.titre.length > 22 ? song.titre.slice(0, 22) + '…' : song.titre, 540, 850);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '36px sans-serif';
      ctx.fillText(song.artiste.toUpperCase(), 540, 910);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Ma chanson du jour', 540, 980);

      const link = document.createElement('a');
      link.download = `moozik-${song.titre.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      // Fallback : copie dans le presse-papier avec message explicite
      const text = `🎵 Ma chanson du jour sur MOOZIK : ${song.titre} — ${song.artiste}`;
      try {
        await navigator.clipboard.writeText(text);
        setShareError('Impossible de générer l\'image. Le texte a été copié dans le presse-papier.');
      } catch {
        setShareError('Impossible de partager. Copiez manuellement : ' + text);
      }
      setDone(true);
      setTimeout(() => { setDone(false); setShareError(''); }, 3500);
    } finally {
      setSharing(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader icon={<Share2 size={14} />} title="Chanson du jour" />
      <SectionBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {song.image && (
            <img
              src={song.image}
              alt={`Couverture de ${song.titre}`}
              style={{
                width: 52, height: 52, borderRadius: 12,
                objectFit: 'cover', flexShrink: 0,
                border: '0.5px solid rgba(255,255,255,0.08)',
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 500, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{song.titre}</div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{song.artiste}</div>
          </div>
        </div>
        {shareError && <Alert type="error" msg={shareError} />}
        <BtnPrimary variant="default" loading={sharing} onClick={handleShare}>
          {done
            ? <><Check size={14} aria-hidden="true" /> Image générée !</>
            : <><ImageIcon size={14} aria-hidden="true" /> Générer image Instagram/WhatsApp</>}
        </BtnPrimary>
        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />
      </SectionBody>
    </SectionCard>
  );
};

// ─────────────────────────────────────────────────────────
// WEEKLY TOP 5
// ─────────────────────────────────────────────────────────
const WeeklyTop5 = ({ token, apiBase }) => {
  const [top5, setTop5] = useState([]);

  useEffect(() => {
    if (!token || !apiBase) return;
    fetch(`${apiBase}/history/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.topSongs?.length) {
          setTop5(d.topSongs.slice(0, 5).map(s => ({
            _id: s.song?._id,
            titre: s.song?.titre,
            artiste: s.song?.artiste,
            image: s.song?.image,
            count: s.count,
          })));
        }
      })
      .catch(() => {});
  }, [token, apiBase]); // apiBase inclus dans les dépendances

  if (!top5.length) return null;

  const rankColors = [
    '#fbbf24',
    'rgba(255,255,255,0.5)',
    '#cd7c2f',
    'rgba(255,255,255,0.15)',
    'rgba(255,255,255,0.15)',
  ];

  return (
    <SectionCard>
      <SectionHeader icon={<Trophy size={14} />} title="Mon top 5 de la semaine" badge="Public" />
      <SectionBody>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0 }}>
          {top5.map((song, i) => (
            <li key={song._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                aria-label={`Rang ${i + 1}`}
                style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800,
                  width: 18, textAlign: 'center',
                  color: rankColors[i], flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              {song.image && (
                <img
                  src={song.image}
                  alt={`Couverture de ${song.titre}`}
                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{song.titre}</div>
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.35)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{song.artiste}</div>
              </div>
              <span
                aria-label={`Écouté ${song.count} fois`}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontStyle: 'italic' }}
              >
                {song.count}×
              </span>
            </li>
          ))}
        </ol>
      </SectionBody>
    </SectionCard>
  );
};

// ─────────────────────────────────────────────────────────
// ARTIST BANNER
// ─────────────────────────────────────────────────────────
const ArtistBanner = ({ nom, artistCoverPreview, onChangeCover }) => {
  const fileRef = useRef();

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(147,51,234,0.12), rgba(219,39,119,0.08))',
      border: '0.5px solid rgba(192,132,252,0.2)',
      borderRadius: 20, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Avatar artiste cliquable */}
      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Changer la photo de couverture artiste"
          style={{
            width: 72, height: 72, borderRadius: 14, overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            position: 'relative',
          }}
        >
          {artistCoverPreview
            ? <img src={artistCoverPreview} alt="Couverture artiste" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{
                fontFamily: "'Syne',sans-serif", fontSize: '1.6rem',
                fontWeight: 800, color: 'rgba(255,255,255,0.2)',
              }}>
                {(nom || '?')[0].toUpperCase()}
              </span>
          }
          {/* Overlay au survol */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            <Camera size={18} color="#fff" aria-hidden="true" />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onChangeCover}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, color: '#c084fc', fontWeight: 500,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          Page artiste publique
        </div>
        <div style={{
          fontFamily: "'Syne',sans-serif", fontSize: '1.05rem', fontWeight: 800,
          color: '#fff', marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {nom || "Votre nom d'artiste"}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Photo visible par tous les auditeurs
        </div>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        aria-label="Modifier la photo de couverture artiste"
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(147,51,234,0.22)', border: '0.5px solid rgba(192,132,252,0.3)',
          color: '#c084fc', fontSize: 11, fontWeight: 500, padding: '8px 14px',
          borderRadius: 100, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,51,234,0.38)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(147,51,234,0.22)'}
      >
        <Camera size={12} aria-hidden="true" /> Modifier
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// LOYALTY WIDGET — connecté à l'API
// ─────────────────────────────────────────────────────────
const LoyaltyWidget = ({ token, apiBase }) => {
  const [points, setPoints] = useState(null);
  const [nextLevel, setNextLevel] = useState(2000);
  const [levelLabel, setLevelLabel] = useState('Or');
  const [nextLevelLabel, setNextLevelLabel] = useState('Platine');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !apiBase) { setLoading(false); return; }
    fetch(`${apiBase}/users/loyalty`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setPoints(d.points ?? 0);
          setNextLevel(d.nextLevel ?? 2000);
          setLevelLabel(d.currentLevel ?? 'Or');
          setNextLevelLabel(d.nextLevelLabel ?? 'Platine');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, apiBase]);

  const pct = points !== null ? Math.min(100, Math.round((points / nextLevel) * 100)) : 0;

  return (
    <div
      role="region"
      aria-label="Points de fidélité"
      style={{
        background: 'linear-gradient(135deg,rgba(226,75,74,0.1),rgba(30,10,60,0.3))',
        border: '0.5px solid rgba(226,75,74,0.2)',
        borderRadius: 20, padding: '20px 24px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120,
        background: 'radial-gradient(circle,rgba(226,75,74,0.15) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <Star size={11} aria-hidden="true" style={{ display: 'inline', marginRight: 5 }} />
          Points de fidélité
        </span>
        <div style={{
          fontFamily: "'Syne',sans-serif", fontSize: '2rem',
          fontWeight: 800, color: '#fff', lineHeight: 1,
        }}>
          {loading
            ? <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Chargement…</span>
            : points === null
            ? <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>—</span>
            : <>{points.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>pts</span></>
          }
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression vers le niveau ${nextLevelLabel}`}
        style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}
      >
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg,#E24B4A,#f97316)',
          borderRadius: 100,
          width: `${pct}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
        <span>Niveau {levelLabel}</span>
        {points !== null && <span>{(nextLevel - points).toLocaleString()} pts → {nextLevelLabel}</span>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// ACCOUNT VIEW — composant principal
// ─────────────────────────────────────────────────────────
const AccountView = ({
  token,
  userNom,
  userEmail,
  userRole,
  userId: userIdProp,
  userArtistId: userArtistIdProp,
  isAdmin,
  isArtist,
  isUser,
  musiques,
  userPlaylists,
  onUpdateProfile,
  isLoggedIn,
  API: apiProp, // prop renommée pour éviter la collision avec l'import
}) => {
  // Source unique pour la base d'API : la prop prime sur l'import
  const apiBase = apiProp || API_DEFAULT;

  const userId       = userIdProp       || localStorage.getItem('moozik_userId')    || '';
  const userArtistId = userArtistIdProp || localStorage.getItem('moozik_artisteId') || '';

  // ── État profil ──────────────────────────────────────
  const [nom, setNom]                       = useState(userNom || '');
  const [avatarFile, setAvatarFile]         = useState(null);
  const [avatarPreview, setAvatarPreview]   = useState(null);

  const avatarKey                            = `moozik_avatar_${userId || userArtistId || 'guest'}`;
  const [savedAvatar, setSavedAvatar]       = useState(() => localStorage.getItem(avatarKey) || null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMsg, setProfileMsg]         = useState({ type: '', text: '' });

  // ── État couverture artiste ───────────────────────────
  const [artistCoverFile, setArtistCoverFile]       = useState(null);
  const [artistCoverPreview, setArtistCoverPreview] = useState(null);

  // ── État mot de passe ─────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [showCurrentPwd, setShowCurrentPwd]   = useState(false);
  const [showNewPwd, setShowNewPwd]           = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [pwdMsg, setPwdMsg]                   = useState({ type: '', text: '' });

  // ── Streak / stats ────────────────────────────────────
  const [streak, setStreak]     = useState(0);
  const [favCount, setFavCount] = useState(0);

  // ── Préférences (persistées dans localStorage + API) ──
  const [prefPublic, setPrefPublic]     = useState(() => {
    const v = localStorage.getItem('moozik_pref_public');
    return v === null ? true : v === 'true';
  });
  const [prefNotifs, setPrefNotifs]     = useState(() => {
    const v = localStorage.getItem('moozik_pref_notifs');
    return v === null ? true : v === 'true';
  });
  const [prefActivity, setPrefActivity] = useState(() => {
    const v = localStorage.getItem('moozik_pref_activity');
    return v === null ? false : v === 'true';
  });

  const avatarInputRef = useRef();

  // Sync nom si la prop change
  useEffect(() => { setNom(userNom || ''); }, [userNom]);

  // ── Chargement des favoris ────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/songs/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setFavCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [token, apiBase]);

  // ── Calcul du streak (idéalement côté serveur) ───────
  // Note : ce calcul est limité à l'historique retourné par l'API.
  // Si possible, déplacer ce calcul dans un endpoint dédié.
  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/history?limit=365`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.history?.length) return;
        const days = new Set(
          d.history.map(h => new Date(h.playedAt).toISOString().slice(0, 10))
        );
        let s = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const day = new Date(today);
          day.setDate(today.getDate() - i);
          if (days.has(day.toISOString().slice(0, 10))) s++;
          else if (i > 0) break;
        }
        setStreak(s);
        localStorage.setItem('moozik_streak', String(s));
      })
      .catch(() => {});
  }, [token, apiBase]);

  // ── Sauvegarde des préférences ────────────────────────
  const handlePrefChange = useCallback((key, setter, value) => {
    setter(value);
    localStorage.setItem(`moozik_pref_${key}`, String(value));
    if (!token) return;
    fetch(`${apiBase}/users/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {}); // Erreur silencieuse, l'état local est déjà sauvé
  }, [token, apiBase]);

  // ── Handlers d'avatar ─────────────────────────────────
  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handleArtistCoverChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArtistCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setArtistCoverPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Flash message ─────────────────────────────────────
  const flash = useCallback((setter, type, text, delay = 4000) => {
    setter({ type, text });
    setTimeout(() => setter({ type: '', text: '' }), delay);
  }, []);

  // ── Sauvegarde du profil ──────────────────────────────
  const handleSaveProfile = useCallback(async (e) => {
    e?.preventDefault();
    setLoadingProfile(true);
    try {
      // Upload de l'avatar
      if (avatarFile) {
        const endpoint = isArtist && userArtistId
          ? `${apiBase}/artists/${userArtistId}`
          : userId
          ? `${apiBase}/users/${userId}`
          : '';

        if (endpoint) {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            const cloudUrl = data.avatar || data.image || avatarPreview;
            localStorage.setItem(avatarKey, cloudUrl);
            setSavedAvatar(cloudUrl);
            if (onUpdateProfile) onUpdateProfile({ avatar: cloudUrl });
          }
        } else {
          // Pas d'endpoint : on persiste uniquement en local
          localStorage.setItem(avatarKey, avatarPreview);
          setSavedAvatar(avatarPreview);
          if (onUpdateProfile) onUpdateProfile({ avatar: avatarPreview });
        }
        setAvatarFile(null);
      }

      // Upload de la couverture artiste
      if (artistCoverFile && isArtist && userArtistId) {
        const fd = new FormData();
        fd.append('image', artistCoverFile);
        await fetch(`${apiBase}/artists/${userArtistId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }).catch(() => {});
        setArtistCoverFile(null);
      }

      // Mise à jour du nom
      const trimmed = nom.trim();
      if (trimmed && trimmed !== userNom) {
        const endpoint = isArtist && userArtistId
          ? `${apiBase}/artists/${userArtistId}`
          : userId
          ? `${apiBase}/users/${userId}`
          : isAdmin
          ? `${apiBase}/admin/profile`
          : '';

        if (!endpoint) throw new Error('ID introuvable — reconnectez-vous.');

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nom: trimmed }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || `Erreur (${res.status})`);
        }
        localStorage.setItem('moozik_nom', trimmed);
        if (onUpdateProfile) onUpdateProfile({ nom: trimmed });
      }

      flash(setProfileMsg, 'success', 'Profil mis à jour !');
    } catch (err) {
      flash(setProfileMsg, 'error', err.message || 'Erreur inconnue');
    } finally {
      setLoadingProfile(false);
    }
  }, [
    avatarFile, artistCoverFile, nom, userNom,
    isArtist, isAdmin, userId, userArtistId,
    token, avatarKey, avatarPreview, apiBase,
    onUpdateProfile, flash,
  ]);

  // ── Changement de mot de passe ────────────────────────
  const handleChangePassword = useCallback(async (e) => {
    e?.preventDefault();
    if (!currentPassword)                return flash(setPwdMsg, 'error', 'Mot de passe actuel requis');
    if (newPassword.length < 6)          return flash(setPwdMsg, 'error', 'Minimum 6 caractères');
    if (currentPassword === newPassword) return flash(setPwdMsg, 'error', 'Doit être différent du mot de passe actuel');

    setLoadingPassword(true);
    try {
      const endpoint = isArtist && userArtistId
        ? `${apiBase}/artists/${userArtistId}/password`
        : userId
        ? `${apiBase}/users/${userId}/password`
        : isAdmin
        ? `${apiBase}/admin/password`
        : '';

      if (!endpoint) throw new Error('ID introuvable.');

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 404) throw new Error('Fonctionnalité non disponible');
        const msg = d.message || '';
        throw new Error(
          msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')
            ? 'Mot de passe actuel incorrect'
            : msg || `Erreur (${res.status})`
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      flash(setPwdMsg, 'success', 'Mot de passe changé avec succès !');
    } catch (err) {
      flash(setPwdMsg, 'error', err.message);
    } finally {
      setLoadingPassword(false);
    }
  }, [
    currentPassword, newPassword,
    isArtist, isAdmin, userId, userArtistId,
    token, apiBase, flash,
  ]);

  // ── Suppression de l'avatar ───────────────────────────
  const removeAvatar = useCallback(() => {
    localStorage.removeItem(avatarKey);
    setSavedAvatar(null);
    setAvatarPreview(null);
    setAvatarFile(null);
    if (onUpdateProfile) onUpdateProfile({ avatar: null });
  }, [avatarKey, onUpdateProfile]);

  // ── Dérivées visuelles ────────────────────────────────
  const roleConfig = useMemo(() => (
    isAdmin
      ? { label: 'Administrateur', Icon: ShieldCheck }
      : isArtist
      ? { label: 'Artiste',        Icon: Mic2 }
      : { label: 'Utilisateur',    Icon: UserCircle }
  ), [isAdmin, isArtist]);

  const heroGradient = useMemo(() => (
    isAdmin
      ? 'linear-gradient(135deg,#18181b 0%,#3b0000 100%)'
      : isArtist
      ? 'linear-gradient(135deg,#18181b 0%,#1e0a3c 100%)'
      : 'linear-gradient(135deg,#18181b 0%,#0a1628 100%)'
  ), [isAdmin, isArtist]);

  const accentColor = useMemo(() => (
    isAdmin ? '#E24B4A' : isArtist ? '#c084fc' : '#60a5fa'
  ), [isAdmin, isArtist]);

  const displayAvatar = avatarPreview || savedAvatar;

  const stats = useMemo(() => [
    { label: 'Musiques',  value: musiques?.length     || 0, icon: <Music size={16} aria-hidden="true" />,        color: '#E24B4A' },
    { label: 'Favoris',   value: favCount,                   icon: <Heart size={16} aria-hidden="true" />,        color: '#f472b6' },
    { label: 'Playlists', value: userPlaylists?.length || 0, icon: <ListOrdered size={16} aria-hidden="true" />, color: '#60a5fa' },
  ], [musiques, favCount, userPlaylists]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword,    setDeletePassword]    = useState('');
  const [loadingDelete,     setLoadingDelete]     = useState(false);
  const [deleteMsg,         setDeleteMsg]         = useState({ type: '', text: '' });

  const handleDeleteAccount = useCallback(async () => {
    if (!deletePassword) return flash(setDeleteMsg, 'error', 'Mot de passe requis');
    setLoadingDelete(true);
    try {
      // Vérifier le mot de passe d'abord
      const check = await fetch(`${apiBase}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: deletePassword }),
      });
      if (!check.ok) throw new Error('Mot de passe incorrect');

      const res = await fetch(`${apiBase}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Erreur serveur');
      }

      // Purger la session
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      window.location.href = '/';
    } catch (err) {
      flash(setDeleteMsg, 'error', err.message);
    } finally {
      setLoadingDelete(false);
    }
  }, [deletePassword, userEmail, userId, token, apiBase, flash]);

  // ── Rendu ─────────────────────────────────────────────
  return (
    <main
      aria-label="Mon compte"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        // maxWidth: 760, margin: '0 auto',
        padding: '2rem 1rem 4rem',
        display: 'flex', flexDirection: 'column', gap: 20,
        color: '#fff',
      }}
    >
      {/* ── HERO ─────────────────────────────────────── */}
      <section
        aria-label="Informations générales"
        style={{
          background: heroGradient,
          borderRadius: 24, overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.08)',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 55% at 85% 15%, ${accentColor}22 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ padding: '28px 28px 24px', display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: `linear-gradient(135deg,${accentColor},#1a0000)`,
              padding: 3,
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: '#27272a', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#fff',
              }}>
                {displayAvatar
                  ? <img src={displayAvatar} alt={`Photo de profil de ${nom || userEmail}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (nom || userEmail || '?')[0].toUpperCase()
                }
              </div>
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Changer la photo de profil"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: accentColor, border: '2px solid #18181b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'transform 0.15s',
                color: '#fff', padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Camera size={12} aria-hidden="true" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 100, marginBottom: 10,
              background: `${accentColor}20`,
              border: `0.5px solid ${accentColor}50`,
              color: accentColor,
            }}>
              <roleConfig.Icon size={11} aria-hidden="true" />
              {roleConfig.label}
            </div>

            <h1 style={{
              fontFamily: "'Syne',sans-serif", fontSize: '1.9rem', fontWeight: 800,
              color: '#fff', lineHeight: 1.1, marginBottom: 6,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {nom || userEmail}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              {userEmail}
            </p>
            {streak > 0 && <StreakBadge streak={streak} />}

            {!userId && !userArtistId && !isAdmin && (
              <div role="alert" style={{
                marginTop: 10, fontSize: 10, color: '#fef08a',
                background: 'rgba(234,179,8,0.1)', borderRadius: 8, padding: '6px 10px',
              }}>
                ⚠️ Reconnectez-vous pour modifier le nom
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        {(isUser || isArtist) && (
          <div
            role="list"
            aria-label="Statistiques"
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              borderTop: '0.5px solid rgba(255,255,255,0.07)',
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                role="listitem"
                style={{
                  padding: '18px 12px', textAlign: 'center',
                  borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
                }}
              >
                <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  {s.icon}
                </div>
                <div
                  aria-label={`${s.value} ${s.label}`}
                  style={{
                    fontFamily: "'Syne',sans-serif", fontSize: '1.6rem',
                    fontWeight: 800, color: '#fff', lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ARTIST BANNER ────────────────────────────── */}
      {isArtist && (
        <ArtistBanner
          nom={nom || userNom}
          artistCoverPreview={artistCoverPreview}
          onChangeCover={handleArtistCoverChange}
        />
      )}

      {/* ── AVATAR PREVIEW BANNER ────────────────────── */}
      {avatarPreview && avatarPreview !== savedAvatar && (
        <div
          role="status"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(59,130,246,0.08)', border: '0.5px solid rgba(147,197,253,0.2)',
            borderRadius: 14, padding: '12px 16px',
          }}
        >
          <img src={avatarPreview} alt="Aperçu de la nouvelle photo de profil" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
          <span style={{ fontSize: 12, color: '#93c5fd', flex: 1 }}>
            Nouvelle photo — sauvegardez pour appliquer
          </span>
          <button
            onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
            aria-label="Annuler la nouvelle photo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── LOYALTY ──────────────────────────────────── */}
      <LoyaltyWidget token={token} apiBase={apiBase} />

      {/* ── TOP 5 + CHANSON DU JOUR ──────────────────── */}
      {isLoggedIn && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <WeeklyTop5 token={token} apiBase={apiBase} />
          {musiques?.length > 0 && <DailySongShare musiques={musiques} />}
        </div>
      )}

      {/* ── FORMULAIRE PROFIL ────────────────────────── */}
      <SectionCard>
        <SectionHeader icon={<User size={14} />} title="Informations du profil" />
        <SectionBody>
          {savedAvatar && !avatarPreview && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px',
            }}>
              <img
                src={savedAvatar}
                alt="Photo de profil active"
                style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '0.5px solid rgba(255,255,255,0.1)' }}
              />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
                Photo de profil active
              </span>
              <button
                onClick={removeAvatar}
                aria-label="Supprimer la photo de profil"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: 4, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          <Field label="Nom d'affichage" htmlFor="input-nom">
            <Input
              id="input-nom"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Votre prénom ou pseudo"
              disabled={!userId && !userArtistId && !isAdmin}
              autoComplete="name"
            />
          </Field>
          <Field label="Email" icon={<Mail size={10} />} htmlFor="input-email">
            <Input
              id="input-email"
              value={userEmail}
              readOnly
              autoComplete="email"
            />
          </Field>

          <Alert type={profileMsg.type} msg={profileMsg.text} />
          <BtnPrimary loading={loadingProfile} onClick={handleSaveProfile} variant="red">
            <Save size={16} aria-hidden="true" /> Sauvegarder le profil
          </BtnPrimary>
        </SectionBody>
      </SectionCard>

      {/* ── FORMULAIRE MOT DE PASSE ───────────────────── */}
      <SectionCard>
        <SectionHeader icon={<Key size={14} />} title="Changer le mot de passe" />
        <SectionBody>
          <Field label="Mot de passe actuel" htmlFor="input-current-pwd">
            <div style={{ position: 'relative' }}>
              <Input
                id="input-current-pwd"
                type={showCurrentPwd ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(v => !v)}
                aria-label={showCurrentPwd ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: 4, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >
                {showCurrentPwd ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <Field label="Nouveau mot de passe" htmlFor="input-new-pwd">
            <div style={{ position: 'relative' }}>
              <Input
                id="input-new-pwd"
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(v => !v)}
                aria-label={showNewPwd ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: 4, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >
                {showNewPwd ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>
            <PwdStrength value={newPassword} />
          </Field>

          <Alert type={pwdMsg.type} msg={pwdMsg.text} />
          <BtnPrimary
            loading={loadingPassword}
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword}
            variant="default"
          >
            <Key size={16} aria-hidden="true" /> Changer le mot de passe
          </BtnPrimary>
        </SectionBody>
      </SectionCard>

      {/* ── PRÉFÉRENCES ──────────────────────────────── */}
      <SectionCard>
        <SectionHeader icon={<Settings size={14} />} title="Préférences" />
        <div role="group" aria-label="Préférences du compte" style={{ paddingTop: 8 }}>
          <ToggleRow
            label="Profil public"
            sub="Votre top 5 est visible par tous"
            value={prefPublic}
            onChange={v => handlePrefChange('public', setPrefPublic, v)}
          />
          <div aria-hidden="true" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />
          <ToggleRow
            label="Notifications e-mail"
            sub="Nouveautés de vos artistes favoris"
            value={prefNotifs}
            onChange={v => handlePrefChange('notifs', setPrefNotifs, v)}
          />
          <div aria-hidden="true" style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />
          <ToggleRow
            label="Partage d'activité"
            sub="Montrer ce que j'écoute en temps réel"
            value={prefActivity}
            onChange={v => handlePrefChange('activity', setPrefActivity, v)}
          />
        </div>
        <div style={{ height: 8 }} />
      </SectionCard>

      {isUser && (
        <SectionCard>
          <SectionHeader icon={<Trash2 size={14} />} title="Zone de danger" />
          <SectionBody>
            {!showDeleteConfirm ? (
              <>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.6 }}>
                  La suppression de votre compte est <strong style={{ color: '#fca5a5' }}>irréversible</strong>.
                  Toutes vos données seront effacées définitivement.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(226,75,74,0.08)',
                    border: '0.5px solid rgba(226,75,74,0.3)',
                    borderRadius: 12, color: '#fca5a5',
                    fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,75,74,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(226,75,74,0.08)'}
                >
                  <Trash2 size={16} aria-hidden="true" /> Supprimer mon compte
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#fca5a5', marginBottom: 14, lineHeight: 1.6 }}>
                  Confirmez avec votre mot de passe pour supprimer définitivement votre compte.
                </p>
                <Field label="Mot de passe" htmlFor="input-delete-pwd">
                  <Input
                    id="input-delete-pwd"
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                    autoComplete="current-password"
                  />
                </Field>
                <Alert type={deleteMsg.type} msg={deleteMsg.text} />
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteMsg({ type: '', text: '' }); }}
                    style={{
                      flex: 1, padding: '12px 16px',
                      background: 'rgba(255,255,255,0.06)', border: 'none',
                      borderRadius: 12, color: 'rgba(255,255,255,0.6)',
                      fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loadingDelete || !deletePassword}
                    style={{
                      flex: 1, padding: '12px 16px',
                      background: loadingDelete || !deletePassword ? 'rgba(226,75,74,0.2)' : '#E24B4A',
                      border: 'none', borderRadius: 12, color: '#fff',
                      fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
                      cursor: loadingDelete || !deletePassword ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: loadingDelete || !deletePassword ? 0.5 : 1,
                    }}
                  >
                    {loadingDelete
                      ? <Loader2 size={16} className="animate-spin" />
                      : <><Trash2 size={16} /> Confirmer la suppression</>
                    }
                  </button>
                </div>
              </>
            )}
          </SectionBody>
        </SectionCard>
      )}
    </main>
  );
};




export default AccountView;