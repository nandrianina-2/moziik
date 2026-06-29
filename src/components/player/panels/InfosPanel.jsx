import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { Info, Tag } from 'lucide-react';

/**
 * @param {{
 *   currentSong: import('../types/player').Song | null,
 *   currentTime: number,
 *   duration: number,
 *   audioRef: React.RefObject<HTMLAudioElement>,
 *   accentColor: string,
 * }} props
 */
const InfosPanel = memo(({ currentSong, currentTime, duration, audioRef, accentColor }) => {
  const waveRef = useRef(null);

  // Stable wave shape generated once per mount
  const [waveData] = useState(() =>
    Array.from({ length: 80 }, (_, i) => 0.15 + Math.abs(Math.sin(i * 0.28 + 0.7)) * 0.6 * (0.5 + Math.random() * 0.5))
  );

  const draw = useCallback(() => {
    const canvas = waveRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bw = W / waveData.length;
    const p = duration > 0 ? currentTime / duration : 0;
    const playedX = p * W;

    // Parse hex accent → RGB
    const hex = accentColor.replace('#', '');
    const parsed = hex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [220, 38, 38];
    const [cr, cg, cb] = parsed;

    // Subtle glow behind played region
    if (p > 0) {
      const grad = ctx.createLinearGradient(0, 0, playedX, 0);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},.08)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, playedX, H);
    }

    waveData.forEach((v, i) => {
      const x = i * bw;
      const h = v * H * 0.82;
      const played = i / waveData.length < p;
      const alpha = played ? 0.55 + v * 0.45 : 0.06 + v * 0.07;

      if (played) {
        const g = ctx.createLinearGradient(0, (H - h) / 2, 0, (H + h) / 2);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},${alpha * 0.4})`);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, (H - h) / 2, Math.max(2, bw - 2), h, 2);
      ctx.fill();
    });

    // Playhead
    if (p > 0) {
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.8)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playedX, 0);
      ctx.lineTo(playedX, H);
      ctx.stroke();
    }
  }, [currentTime, duration, waveData, accentColor]);

  // Resize + redraw
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    draw();
  }, [draw]);

  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef?.current) {
      audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
    }
  };

  const INFO_TAGS = [
    { label: 'Format', value: currentSong?.format  || 'MP3'      },
    { label: 'Débit',  value: currentSong?.bitrate || '320 kbps' },
    { label: 'Freq.',  value: currentSong?.sampleRate || '44.1 kHz' },
    { label: 'Plays',  value: currentSong?.plays ? currentSong.plays.toLocaleString() : '—' },
    { label: 'Sortie', value: currentSong?.annee  || '—' },
    { label: 'Label',  value: currentSong?.label  || '—' },
  ];

  return (
    <div style={{ padding: '16px 18px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="fp-sec"><Info size={10} color={accentColor} /> Informations audio</div>

      {/* Waveform */}
      <div className="fp-ic" style={{ cursor: 'pointer' }} onClick={seek}>
        <div className="fp-ic-label">Forme d'onde · cliquer pour déplacer</div>
        <canvas ref={waveRef} className="fp-wave" style={{ marginTop: 8, height: 56 }} />
      </div>

      {/* Metadata grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {INFO_TAGS.map((t, i) => (
          <div key={t.label} className="fp-ic fp-fade" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="fp-ic-label">{t.label}</div>
            <div className="fp-ic-val" style={{ fontSize: 12 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Moods */}
      {currentSong?.moods?.length > 0 && (
        <div className="fp-ic">
          <div className="fp-ic-label" style={{ marginBottom: 8 }}>Moods</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {currentSong.moods.map((m) => (
              <span key={m} className="fp-mood"><Tag size={8} />{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

InfosPanel.displayName = 'InfosPanel';
export default InfosPanel;