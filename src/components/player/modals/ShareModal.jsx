import { useState, useEffect } from 'react';
import { Share2, Link, Copy, Check, ExternalLink } from 'lucide-react';
import { FaWhatsapp, FaFacebookF } from 'react-icons/fa';
import { SiX } from 'react-icons/si';

const API = 'https://backend-moozik.vercel.app';

/**
 * @param {{
 *   song: import('../types/player').Song,
 *   onClose: () => void,
 *   onToast: (message: string, icon: string) => void,
 * }} props
 */
const ShareModal = ({ song, onClose, onToast }) => {
  const [state, setState] = useState('loading');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/songs/${song._id}/share`, { method: 'POST', signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setShareUrl(`${window.location.origin}/share/${data.shareToken}`);
        setState('idle');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setState('error');
      });

    return () => controller.abort();
  }, [song._id]);

  const copyLink = async (e) => {
    e?.stopPropagation();
    const url = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
      const el = Object.assign(document.createElement('textarea'), { value: url });
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    onToast('Lien copié !', '✓');
    setTimeout(() => setCopied(false), 2500);
    onClose();
  };

  const shareNative = async () => {
    const url = shareUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: song.titre, text: `Écoute "${song.titre}" par ${song.artiste}`, url });
        onToast('Partagé avec succès', '✓');
        onClose();
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    copyLink();
  };

  const openSocial = (platform) => {
    const url = encodeURIComponent(shareUrl || window.location.href);
    const text = encodeURIComponent(`🎵 Écoute "${song.titre}" par ${song.artiste}`);
    const links = {
      twitter:  `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    if (links[platform]) window.open(links[platform], '_blank', 'width=600,height=400');
    onClose();
  };

  const SOCIAL_BUTTONS = [
    { key: 'whatsapp', label: 'WhatsApp', bg: 'rgba(37,211,102,.15)', border: 'rgba(37,211,102,.3)', color: '#4ade80',  icon: <FaWhatsapp /> },
    { key: 'twitter',  label: 'Twitter',  bg: 'rgba(29,155,240,.15)', border: 'rgba(29,155,240,.3)', color: '#60a5fa',  icon: <SiX /> },
    { key: 'facebook', label: 'Facebook', bg: 'rgba(24,119,242,.15)', border: 'rgba(24,119,242,.3)', color: '#818cf8',  icon: <FaFacebookF /> },
  ];

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.15)', margin: '0 auto 20px' }} />

        {/* Song preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <img src={song.image} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.titre}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>{song.artiste}</p>
          </div>
          <Share2 size={18} style={{ color: 'rgba(255,255,255,.25)', flexShrink: 0 }} />
        </div>

        {/* Share URL row */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <p className="fp-sec" style={{ marginBottom: 10 }}><Link size={10} /> Lien de partage</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,.45)', fontFamily: 'var(--fp-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state === 'loading' ? 'Génération du lien…' : state === 'error' ? 'Erreur de génération' : shareUrl}
            </div>
            <button
              onClick={copyLink}
              disabled={state === 'loading'}
              style={{ padding: '10px 16px', borderRadius: 12, background: copied ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.1)', border: `1px solid ${copied ? 'rgba(34,197,94,.4)' : 'rgba(255,255,255,.15)'}`, color: copied ? '#4ade80' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s', fontFamily: 'var(--fp-font)', flexShrink: 0 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        {/* Social buttons */}
        <div style={{ padding: '16px 20px 8px' }}>
          <p className="fp-sec" style={{ marginBottom: 12 }}><ExternalLink size={10} /> Partager sur</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
            {SOCIAL_BUTTONS.map(({ key, label, bg, border, color, icon }) => (
              <button
                key={key}
                onClick={() => openSocial(key)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '14px 8px', borderRadius: 16, background: bg, border: `1px solid ${border}`, color, cursor: 'pointer', fontFamily: 'var(--fp-font)', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={shareNative}
            style={{ width: '100%', padding: 13, borderRadius: 16, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontFamily: 'var(--fp-font)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
          >
            <Share2 size={16} /> Partager via l'appareil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;