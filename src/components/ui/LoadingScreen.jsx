import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── CSS Animations injected once ────────────────────────────────────────────
const CSS = `
  @keyframes eq-bounce {
    0%, 100% { transform: scaleY(0.2); }
    50%       { transform: scaleY(1); }
  }
  @keyframes particle-pulse {
    0%, 100% { opacity: 0; transform: translate(-50%,-50%) scale(0); }
    40%, 60%  { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
  }
  @keyframes ring-spin-cw  { to { transform: rotate(360deg);  } }
  @keyframes ring-spin-ccw { to { transform: rotate(-360deg); } }
  @keyframes ring-breathe  { 0%,100% { opacity:.6; } 50% { opacity:1; } }
  @keyframes blob-drift-a  { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,20px) scale(1.08); } }
  @keyframes blob-drift-b  { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,-20px) scale(1.06); } }
  @keyframes shimmer { 0% { left:-60%; } 100% { left:200%; } }
  @keyframes glow-pulse { 0%,100% { opacity:.5; transform:scale(.9); } 50% { opacity:1; transform:scale(1.1); } }
  @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
  @keyframes card-glow {
    0%,100% { box-shadow: 0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,45,85,.2), 0 0 30px rgba(255,45,85,.15), inset 0 1px 0 rgba(255,255,255,.15); }
    50%      { box-shadow: 0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(192,38,211,.3), 0 0 50px rgba(192,38,211,.25), inset 0 1px 0 rgba(255,255,255,.15); }
  }
  @keyframes dots-spin { to { stroke-dashoffset: -280; } }
`;

function InjectCSS() {
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── Equalizer Bars (CSS-only, 5 bars) ───────────────────────────────────────
const EQ_COLORS = ['#ff2d55', '#ff6b35', '#c026d3', '#6366f1', '#ff2d55'];
const EQ_PEAKS  = [0.7, 0.5, 1.0, 0.8, 0.6]; // max scaleY per bar group

function EqualizerBars() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {EQ_COLORS.map((color, gi) => (
        <div key={gi} style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 28 }}>
          {[0, 1, 2, 3, 4].map((j) => (
            <div
              key={j}
              style={{
                width: 3,
                height: 28,
                borderRadius: 2,
                background: `linear-gradient(to top, ${color}cc, ${color})`,
                boxShadow: `0 0 6px ${color}88`,
                transformOrigin: 'bottom',
                animation: `eq-bounce ${1.1 + j * 0.13}s ease-in-out ${gi * 0.07 + j * 0.06}s infinite`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Spectrum Rings (CSS-only, 2 rings + 1 dashed) ───────────────────────────
function SpectrumRings() {
  const rings = [
    { size: 136, color: 'rgba(255,45,85,0.22)',   dur: '8s',  dir: 'ring-spin-cw',  breathe: '2.5s 0s' },
    { size: 192, color: 'rgba(99,102,241,0.14)',  dur: '14s', dir: 'ring-spin-ccw', breathe: '3s .6s' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {rings.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: r.size, height: r.size,
          borderRadius: '50%',
          border: `1px solid ${r.color}`,
          animation: `${r.dir} ${r.dur} linear infinite, ring-breathe ${r.breathe} ease-in-out infinite`,
        }} />
      ))}
      {/* Dashed arc */}
      <div style={{
        position: 'absolute',
        width: 200, height: 200,
        borderRadius: '50%',
        border: '1px dashed rgba(255,45,85,0.18)',
        animation: 'ring-spin-ccw 20s linear infinite',
      }} />
    </div>
  );
}

// ─── Floating Particles (10 particles, CSS-only) ──────────────────────────────
const PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 360;
  const rad   = (angle * Math.PI) / 180;
  const r     = 95 + (i % 3) * 25;
  return {
    id: i,
    x: Math.cos(rad) * r,
    y: Math.sin(rad) * r,
    size: 2 + (i % 3) * 1.2,
    color: ['rgba(255,45,85,0.9)', 'rgba(192,38,211,0.8)', 'rgba(99,102,241,0.7)'][i % 3],
    dur: `${3.5 + (i % 4) * 0.8}s`,
    delay: `${(i * 0.31) % 3}s`,
  };
});

function FloatingParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            left: `calc(50% + ${p.x}px)`,
            top:  `calc(50% + ${p.y}px)`,
            animation: `particle-pulse ${p.dur} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Neon Progress Bar ────────────────────────────────────────────────────────
function NeonProgressBar({ progress }) {
  return (
    <div style={{ width: 220, position: 'relative' }}>
      <div style={{
        height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.07)',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Fill — framer-motion kept only here (single animated value) */}
        <motion.div
          style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #c026d3, #ff2d55, #ff6b35)',
            boxShadow: '0 0 12px rgba(255,45,85,0.8), 0 0 24px rgba(255,45,85,0.4)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {/* Shimmer — CSS */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          width: '60%',
          animation: 'shimmer 1.8s ease-in-out 0.4s infinite',
        }} />
      </div>
      {/* Percentage */}
      <div style={{
        position: 'absolute', right: 0, top: -20,
        fontSize: 10, letterSpacing: '0.12em',
        color: 'rgba(255,45,85,0.8)', fontFamily: 'monospace', fontWeight: 700,
      }}>
        {Math.round(progress)}%
      </div>
      {/* Tip dot */}
      <div style={{
        position: 'absolute',
        width: 7, height: 7, borderRadius: '50%',
        background: '#ff2d55',
        top: -2,
        left: `${progress}%`,
        marginLeft: -3.5,
        boxShadow: '0 0 8px #ff2d55, 0 0 16px rgba(255,45,85,0.5)',
        transition: 'left 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
      }} />
    </div>
  );
}

// ─── Ambient Background (2 CSS blobs + 1 animated) ───────────────────────────
function AmbientBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #0d0010 0%, #060008 50%, #000000 100%)',
      }} />
      {/* Animated blob */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, transparent 70%)',
        top: '10%', left: '5%', filter: 'blur(80px)',
        animation: 'blob-drift-a 9s ease-in-out infinite',
      }} />
      {/* Static blobs (no animation cost) */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,45,85,0.09) 0%, transparent 70%)',
        bottom: '5%', right: '5%', filter: 'blur(80px)',
        animation: 'blob-drift-b 11s ease-in-out 1s infinite',
      }} />
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />
    </div>
  );
}

// ─── Logo Card ────────────────────────────────────────────────────────────────
function LogoCard() {
  return (
    <div style={{ position: 'relative', width: 96, height: 96, animation: 'float 4s ease-in-out infinite' }}>
      {/* Outer glow */}
      <div style={{
        position: 'absolute', inset: -16, borderRadius: 28,
        background: 'radial-gradient(circle, rgba(255,45,85,0.25) 0%, transparent 70%)',
        animation: 'glow-pulse 2.4s ease-in-out infinite',
      }} />
      <SpectrumRings />
      <FloatingParticles />
      {/* Glassmorphism card */}
      <div style={{
        position: 'relative', width: 96, height: 96, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10, overflow: 'hidden',
        animation: 'card-glow 3s ease-in-out infinite',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,45,85,0.3) 0%, rgba(192,38,211,0.2) 50%, rgba(99,102,241,0.15) 100%)',
          borderRadius: 24,
        }} />
        {/* Sheen */}
        <div style={{
          position: 'absolute', top: 0, left: '-100%',
          width: '60%', height: '100%',
          background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          transform: 'skewX(-15deg)',
          animation: 'shimmer 3s ease-in-out 1.5s infinite',
        }} />
        {/* EQ bars */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <EqualizerBars />
        </div>
      </div>
    </div>
  );
}

// ─── Animated Title ───────────────────────────────────────────────────────────
function AnimatedTitle() {
  const letters = 'MOOZIK'.split('');
  return (
    <motion.h1
      style={{
        display: 'flex', gap: 2,
        fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
        fontSize: 52, fontWeight: 900, letterSpacing: '0.15em', lineHeight: 1,
        userSelect: 'none',
      }}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
    >
      {letters.map((l, i) => (
        <motion.span
          key={i}
          variants={{
            hidden:  { y: 30, opacity: 0, filter: 'blur(8px)' },
            visible: { y: 0,  opacity: 1, filter: 'blur(0px)' },
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: i < 2
              ? 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)'
              : i < 4
              ? 'linear-gradient(180deg, #ff2d55 0%, #c026d3 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'inline-block',
            filter: i >= 2 && i < 4 ? 'drop-shadow(0 0 12px rgba(255,45,85,0.5))' : 'none',
          }}
        >
          {l}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// ─── SubText ──────────────────────────────────────────────────────────────────
function SubText({ message }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}
    >
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 10 }}>
        {[0.4, 0.7, 1, 0.6].map((h, i) => (
          <div key={i} style={{
            width: 2, height: 10, borderRadius: 1,
            background: '#ff2d55', transformOrigin: 'bottom',
            animation: `eq-bounce ${0.8}s ease-in-out ${i * 0.1}s infinite`,
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontWeight: 600,
      }}>
        {message}
        <span style={{ display: 'inline-block', width: 20, textAlign: 'left' }}>
          {'.'.repeat(dots)}
        </span>
      </span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MoozikLoader = ({ message = 'Chargement' }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 94) return p;
        const inc = p < 40 ? Math.random() * 9 : p < 75 ? Math.random() * 5 : Math.random() * 2;
        return Math.min(p + inc, 94);
      });
    }, 320);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, overflow: 'hidden', background: '#000',
    }}>
      <InjectCSS />
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}
      >
        <LogoCard />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <AnimatedTitle />
          <SubText message={message} />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.6 }}>
          <NeonProgressBar progress={progress} />
        </motion.div>
      </motion.div>

      {/* Corner accents */}
      {[
        { top: 20,    left: 20  },
        { top: 20,    right: 20 },
        { bottom: 20, left: 20  },
        { bottom: 20, right: 20 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', ...pos, width: 24, height: 24,
            borderTop:    i < 2  ? '1px solid rgba(255,45,85,0.25)' : 'none',
            borderBottom: i >= 2 ? '1px solid rgba(255,45,85,0.25)' : 'none',
            borderLeft:   i % 2 === 0 ? '1px solid rgba(255,45,85,0.25)' : 'none',
            borderRight:  i % 2 === 1 ? '1px solid rgba(255,45,85,0.25)' : 'none',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 + i * 0.08, duration: 0.4 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1.6 }}
        style={{
          position: 'absolute', bottom: 28,
          fontSize: 9, letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'monospace',
        }}
      >
        v2.0 · Premium Audio Experience
      </motion.div>
    </div>
  );
};

export default MoozikLoader;