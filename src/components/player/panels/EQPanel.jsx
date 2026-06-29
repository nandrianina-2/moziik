import React, { memo } from 'react';
import { Sliders, RotateCcw, Sparkles, Zap, Music2, Gauge, Timer } from 'lucide-react';
import { eqBands, eqPresets } from '../constants/eq';

// ── EQBar ──────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   band: {hz: number, label: string},
 *   idx: number,
 *   value: number,
 *   onChange: (idx: number, value: number) => void,
 *   accent: string,
 * }} props
 */
const EQBar = memo(({ band, idx, value, onChange, accent }) => {
  const v = Math.max(-12, Math.min(12, isNaN(value) ? 0 : value));
  const thumbPct = 50 - (v / 12) * 47;
  const fillH = `${(Math.abs(v) / 12) * 47}%`;
  const color = accent || '#e02222';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
      <div className="fp-eq-val" style={{ color: v !== 0 ? color : 'rgba(255,255,255,.2)' }}>
        {v !== 0 ? (v > 0 ? `+${v}` : String(v)) : '·'}
      </div>
      <div className="fp-eq-wrap" style={{ width: '100%', minHeight: 92 }}>
        <div className="fp-eq-zero" />
        {v > 0 && (
          <div
            className="fp-eq-fill"
            style={{ background: `linear-gradient(to top,${color}dd,${color}33)`, bottom: '50%', height: fillH, boxShadow: `0 0 12px ${color}40` }}
          />
        )}
        {v < 0 && (
          <div
            className="fp-eq-fill"
            style={{ background: `linear-gradient(to bottom,${color}77,${color}11)`, top: '50%', height: fillH }}
          />
        )}
        <div
          className="fp-eq-thumb"
          style={{ top: `${thumbPct}%`, borderColor: `${color}55`, boxShadow: `0 0 8px ${color}44, 0 2px 8px rgba(0,0,0,.5)` }}
        />
        <input
          type="range"
          min="-12"
          max="12"
          step="1"
          value={v}
          onChange={(e) => onChange(idx, parseInt(e.target.value, 10))}
          className="fp-eq-input"
        />
      </div>
      <div className="fp-eq-label">{band.label}</div>
    </div>
  );
});

EQBar.displayName = 'EQBar';

// ── EQPanel ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   safeEqGains: number[],
 *   activePreset: string,
 *   applyPreset: (name: string) => void,
 *   smartMode: boolean,
 *   setSmartMode: (fn: (v: boolean) => boolean) => void,
 *   smartQueueCount: number,
 *   playbackRate: number,
 *   setPlaybackRate: (v: number) => void,
 *   sleepTimer: number,
 *   setSleepTimer: (v: number) => void,
 *   sleepRemaining: number,
 *   handleEqBand: (idx: number, value: number) => void,
 *   accentColor: string,
 * }} props
 */
const EQPanel = memo(({
  safeEqGains, activePreset, applyPreset,
  smartMode, setSmartMode, smartQueueCount,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer, sleepRemaining,
  handleEqBand, accentColor,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 18px 28px' }}>

    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="fp-sec"><Sliders size={11} color={accentColor} /> Égaliseur 12 bandes</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setSmartMode((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,.07)', background: smartMode ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)', color: smartMode ? accentColor : 'rgba(255,255,255,.35)', cursor: 'pointer', fontFamily: 'var(--fp-font)', transition: 'all .2s' }}
        >
          <Sparkles size={9} /> Smart{smartMode && smartQueueCount > 0 ? ` (${smartQueueCount})` : ''}
        </button>
        <button
          onClick={() => applyPreset('Flat')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontFamily: 'var(--fp-font)', transition: 'all .2s' }}
        >
          <RotateCcw size={9} /> Reset
        </button>
      </div>
    </div>

    {/* Presets */}
    <div>
      <div className="fp-sec" style={{ marginBottom: 8 }}><Zap size={10} color={accentColor} /> Presets</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {Object.keys(eqPresets).map((name, i) => (
          <button
            key={name}
            onClick={() => applyPreset(name)}
            className={`fp-preset${activePreset === name ? ' on' : ''}`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>

    {/* Frequency bars */}
    <div>
      <div className="fp-sec" style={{ marginBottom: 10 }}><Music2 size={10} color={accentColor} /> Fréquences</div>
      <div style={{ display: 'flex', gap: 3, height: 130 }}>
        {eqBands.map((band, idx) => (
          <EQBar
            key={band.hz}
            band={band}
            idx={idx}
            value={safeEqGains[idx] ?? 0}
            onChange={handleEqBand}
            accent={accentColor}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontFamily: 'var(--fp-mono)', color: 'rgba(255,255,255,.15)', marginTop: 4, padding: '0 2px' }}>
        <span>+12 dB</span><span>0</span><span>−12 dB</span>
      </div>
    </div>

    {/* Playback rate */}
    <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="fp-sec"><Gauge size={10} color="#4dc9f6" /> Vitesse</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.55)', fontFamily: 'var(--fp-mono)' }}>{playbackRate}×</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((playbackRate - 0.5) / 1.5) * 100}%`, background: 'linear-gradient(90deg,#4dc9f6,#4d79f6)', borderRadius: 99, transition: 'width .2s ease', boxShadow: '0 0 8px rgba(77,201,246,.4)' }} />
        </div>
        <input
          type="range" min=".5" max="2" step=".25" value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: '-9px 0', opacity: 0, cursor: 'pointer', width: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,.15)', fontFamily: 'var(--fp-mono)' }}>
        {['0.5×', '0.75×', '1×', '1.25×', '1.5×', '1.75×', '2×'].map((v) => <span key={v}>{v}</span>)}
      </div>
    </div>

    {/* Sleep timer */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="fp-sec"><Timer size={10} color="#ffd93d" /> Minuterie veille</div>
        {sleepRemaining > 0 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', fontFamily: 'var(--fp-mono)' }}>
            {Math.floor(sleepRemaining / 60)}:{String(sleepRemaining % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
        {[0, 15, 30, 45, 60].map((m) => (
          <button
            key={m}
            onClick={() => setSleepTimer(m)}
            style={{ padding: '10px 0', borderRadius: 12, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--fp-font)', border: sleepTimer === m ? '1px solid rgba(var(--fp-accent),.55)' : '1px solid rgba(255,255,255,.07)', background: sleepTimer === m ? 'rgba(var(--fp-accent),.22)' : 'rgba(255,255,255,.04)', color: sleepTimer === m ? accentColor : 'rgba(255,255,255,.3)', transition: 'all .2s cubic-bezier(.34,1.56,.64,1)' }}
          >
            {m === 0 ? 'Off' : `${m}'`}
          </button>
        ))}
      </div>
    </div>
  </div>
));

EQPanel.displayName = 'EQPanel';

export { EQBar, EQPanel };