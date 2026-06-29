import { useState, useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';

const PERIODS = [
  { range: [5,  12], label: 'Bonjour 👋',        color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  { range: [12, 14], label: 'Bon appétit 🍽️',    color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  { range: [14, 18], label: 'Bon après-midi ☀️', color: '#6366F1', bg: 'rgba(99,102,241,0.10)' },
  { range: [18, 22], label: 'Bonsoir 🌆',         color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  { range: [22, 29], label: 'Bonne nuit 🌙',      color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
];

const getPeriod = (h) => PERIODS.find(p => h >= p.range[0] && h < p.range[1]) ?? PERIODS[4];
const getGroup  = (h) => h < 14 ? 0 : h < 19 ? 1 : 2;
const getTime   = ()  => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function UserGreeting({ userNom, isLoggedIn, newSongsCount = 0, lastArtist = null, streak = 0 }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [timeStr, setTimeStr]   = useState(getTime);

  // ← Déplacé ICI, à l'intérieur du composant, pour accéder aux props
  const MSG_GROUPS = useMemo(() => [
    [
      { pip: '#6366F1', text: 'Votre sélection personnalisée est prête' },
      { pip: '#10B981', text: newSongsCount > 0 ? `${newSongsCount} nouveautés cette semaine` : 'Découvrez les titres du moment' },
      { pip: '#F59E0B', text: lastArtist ? `${lastArtist} · nouvel ajout` : 'Un artiste émergent attend votre écoute' },
    ],
    [
      { pip: '#EC4899', text: lastArtist ? `Continuez avec ${lastArtist}` : 'Continuez à explorer vos favoris' },
      { pip: '#3B82F6', text: 'La Radio IA a composé une playlist pour vous' },
      { pip: '#10B981', text: newSongsCount > 0 ? `${newSongsCount} titres à découvrir` : 'Nouvelles recommandations disponibles' },
    ],
    [
      { pip: '#8B5CF6', text: 'Découvrez un son qui correspond à votre humeur' },
      { pip: '#F59E0B', text: lastArtist ? `${lastArtist} a sorti du contenu` : 'Vos artistes tendance ont bougé' },
      { pip: '#EC4899', text: lastArtist ? `Reprenez avec ${lastArtist}` : 'Reprenez là où vous vous étiez arrêté' },
    ],
  ], [newSongsCount, lastArtist]);

  const hour   = new Date().getHours();
  const period = getPeriod(hour);
  const msgs   = MSG_GROUPS[getGroup(hour)];
  const msg    = msgs[msgIndex];

  useEffect(() => {
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % msgs.length);
        setAnimating(false);
      }, 290);
    }, 3200);
    return () => clearInterval(id);
  }, [msgs.length]);

  useEffect(() => {
    const id = setInterval(() => setTimeStr(getTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!isLoggedIn) return null;

  const displayName = userNom || 'Mélomane';
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1.1rem 1.4rem', borderRadius: 14,
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderLeft: `3px solid ${period.color}`,
      background: 'rgba(255,255,255,0.03)', overflow: 'hidden',
      marginBottom: 24,
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 160, height: '100%',
        background: `linear-gradient(to left, ${period.bg}, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        flexShrink: 0, width: 46, height: 46, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', fontWeight: 800,
        background: period.bg, color: period.color, border: `2px solid ${period.color}`,
      }}>
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#71717a', marginBottom: 2, letterSpacing: '.04em' }}>
          {period.label}
        </p>
        <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
          {displayName}
        </p>
        <div style={{ height: 18, overflow: 'hidden', marginTop: 5 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'opacity .28s ease, transform .28s ease',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(6px)' : 'translateY(0)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: msg.pip, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {msg.text}
            </span>
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 10, color: '#52525b', fontVariantNumeric: 'tabular-nums' }}>
          {timeStr}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '3px 10px',
        }}>
          <Flame size={11} style={{ color: '#F97316' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>
            {streak} jour{streak > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}