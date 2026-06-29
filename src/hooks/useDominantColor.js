import { useState, useEffect } from 'react';

/**
 * Extrait la couleur dominante d'une image via un canvas offscreen.
 * Retourne { r, g, b, hex, isDark } ou null si pas d'image.
 */
export function useDominantColor(imageUrl) {
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!imageUrl) { setColor(null); return; }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const SIZE = 40; // petit canvas = rapide
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setColor(null); return; }
        ctx.drawImage(img, 0, 0, SIZE, SIZE);

        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

        // Accumule les couleurs en excluant les trop sombres ou trop claires
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 20 && brightness < 240) {
            r += pr; g += pg; b += pb; count++;
          }
        }

        if (count === 0) { setColor(null); return; }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Saturation boost — rendre la couleur plus vive
        const max = Math.max(r, g, b);
        const factor = 1.4;
        r = Math.min(255, Math.round(r * factor));
        g = Math.min(255, Math.round(g * factor));
        b = Math.min(255, Math.round(b * factor));

        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        // luminance relative pour savoir si fond est sombre
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        setColor({ r, g, b, hex, isDark: luminance < 0.5 });
      } catch {
        setColor(null);
      }
    };

    img.onerror = () => setColor(null);
    img.src = imageUrl;
  }, [imageUrl]);

  return color;
}

/**
 * Applique les CSS variables de thème dynamique sur :root
 * en fonction de la couleur dominante.
 */
export function applyDynamicTheme(color) {
  const root = document.documentElement;
  if (!color) {
    root.style.removeProperty('--accent-r');
    root.style.removeProperty('--accent-g');
    root.style.removeProperty('--accent-b');
    root.style.removeProperty('--accent-hex');
    root.style.removeProperty('--accent-glow');
    return;
  }
  const { r, g, b, hex } = color;
  root.style.setProperty('--accent-r', r);
  root.style.setProperty('--accent-g', g);
  root.style.setProperty('--accent-b', b);
  root.style.setProperty('--accent-hex', hex);
  root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`);
}
