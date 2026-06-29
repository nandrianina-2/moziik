// components/ui/SessionExpiredToast.jsx
// Toast affiché quand une session est révoquée (nouvelle connexion détectée)
import { useEffect, useState } from 'react';
import { Shield, X, LogIn } from 'lucide-react';

export default function SessionExpiredToast({ message, onClose, onLogin }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Entrée animée
    requestAnimationFrame(() => setVisible(true));

    // Auto-fermeture après 8 secondes
    const timer = setTimeout(() => handleClose(), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 350);
  };

  return (
    <div
      style={{
        position:   'fixed',
        top:        24,
        left:       '50%',
        transform:  `translateX(-50%) translateY(${visible && !leaving ? '0' : '-120%'})`,
        opacity:    visible && !leaving ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
        zIndex:     9999,
        width:      'min(92vw, 420px)',
      }}
    >
      <div style={{
        background:   'linear-gradient(135deg, #18181b 0%, #1c1917 100%)',
        border:       '1px solid rgba(239,68,68,0.35)',
        borderRadius: 16,
        padding:      '16px 18px',
        boxShadow:    '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.1), 0 0 30px rgba(239,68,68,0.08)',
        display:      'flex',
        gap:          14,
        alignItems:   'flex-start',
      }}>

        {/* Icône */}
        <div style={{
          width:          40,
          height:         40,
          borderRadius:   12,
          background:     'rgba(239,68,68,0.12)',
          border:         '1px solid rgba(239,68,68,0.25)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          color:          '#ef4444',
        }}>
          <Shield size={20} />
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.3 }}>
            Session fermée
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
            {message || 'Votre compte a été connecté sur un autre appareil.'}
          </p>

          {/* Bouton reconnexion */}
          <button
            onClick={() => { handleClose(); setTimeout(onLogin, 400); }}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            6,
              background:     '#dc2626',
              color:          '#fff',
              border:         'none',
              borderRadius:   8,
              padding:        '7px 14px',
              fontSize:       12,
              fontWeight:     700,
              cursor:         'pointer',
              transition:     'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
          >
            <LogIn size={13} />
            Se reconnecter
          </button>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border:     'none',
            color:      '#52525b',
            cursor:     'pointer',
            padding:    4,
            borderRadius: 6,
            flexShrink: 0,
            display:    'flex',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Barre de progression */}
      <div style={{
        position:     'absolute',
        bottom:       0,
        left:         0,
        height:       3,
        borderRadius: '0 0 16px 16px',
        background:   '#dc2626',
        animation:    'shrink 8s linear forwards',
        width:        '100%',
      }}/>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}