/** @type {Array<{hz: number, label: string, type: BiquadFilterType}>} */
export const eqBands = [
  { hz: 32,    label: '32',   type: 'lowshelf'  },
  { hz: 64,    label: '64',   type: 'peaking'   },
  { hz: 125,   label: '125',  type: 'peaking'   },
  { hz: 250,   label: '250',  type: 'peaking'   },
  { hz: 500,   label: '500',  type: 'peaking'   },
  { hz: 1000,  label: '1k',   type: 'peaking'   },
  { hz: 2000,  label: '2k',   type: 'peaking'   },
  { hz: 3500,  label: '3.5k', type: 'peaking'   },
  { hz: 6000,  label: '6k',   type: 'peaking'   },
  { hz: 8000,  label: '8k',   type: 'peaking'   },
  { hz: 12000, label: '12k',  type: 'peaking'   },
  { hz: 16000, label: '16k',  type: 'highshelf' },
];

/** @type {Record<string, number[]>} */
export const eqPresets = {
  Flat:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Bass:      [9, 7, 5, 3, 1, 0, 0, 0, 0, 0, 0, 0],
  Treble:    [0, 0, 0, 0, 0, 0, 2, 3, 5, 6, 8, 9],
  Vocal:     [-2, -1, 0, 2, 5, 6, 5, 3, 1, 0, -1, -2],
  Pop:       [-1, 0, 2, 4, 5, 4, 3, 2, 1, 0, -1, -1],
  Rock:      [6, 5, 3, 1, -1, 0, 1, 3, 5, 6, 6, 5],
  Jazz:      [3, 2, 1, 3, 4, 4, 3, 2, 2, 3, 3, 2],
  Club:      [0, 0, 5, 5, 4, 3, 3, 4, 5, 5, 0, 0],
  Classical: [0, 0, 0, 0, 0, 0, 0, 0, -2, -3, -4, -5],
  Dance:     [7, 5, 2, 0, -1, -2, 0, 3, 5, 6, 6, 5],
  Latin:     [4, 3, 0, 0, -1, -1, 0, 1, 3, 4, 5, 4],
  Lounge:    [-3, -2, 0, 2, 3, 2, 1, 0, -1, -2, -2, -3],
};

/**
 * Initialise le contexte audio Web Audio API et branche les filtres EQ.
 *
 * @param {React.RefObject<HTMLAudioElement>}      audioRef
 * @param {React.MutableRefObject<BiquadFilterNode[]>} eqFiltersRef
 * @param {React.MutableRefObject<{ctx: AudioContext, analyser: AnalyserNode} | null>} audioContextRef
 * @param {() => void} [onReady]
 */
export const initEQ12 = (audioRef, eqFiltersRef, audioContextRef, onReady) => {
  if (audioContextRef.current || !audioRef.current) return;

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const filters = eqBands.map((band) => {
      const f = ctx.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.hz;
      f.gain.value = 0;
      if (band.type === 'peaking') f.Q.value = 1.2;
      return f;
    });

    src.connect(filters[0]);
    filters.forEach((f, i) => {
      if (i < filters.length - 1) f.connect(filters[i + 1]);
    });
    filters[filters.length - 1].connect(analyser);
    analyser.connect(ctx.destination);

    eqFiltersRef.current = filters;
    audioContextRef.current = { ctx, analyser };
    onReady?.();
  } catch (e) {
    console.warn('AudioContext init failed:', e);
  }
};