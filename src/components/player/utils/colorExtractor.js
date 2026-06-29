/**
 * Extrait la couleur dominante d'une image via un canvas off-screen.
 * Filtre les pixels trop sombres, trop clairs ou trop désaturés.
 *
 * @param {string} imgSrc
 * @param {(color: {r: number, g: number, b: number}) => void} callback
 */
export const extractDominantColor = (imgSrc, callback) => {
  const FALLBACK = { r: 180, g: 30, b: 30 };
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onerror = () => callback(FALLBACK);

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 50, 50);

      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        const brightness = (pr + pg + pb) / 3;
        const saturation = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);

        if (brightness > 20 && brightness < 230 && saturation > 30) {
          r += pr; g += pg; b += pb; count++;
        }
      }

      callback(count > 0 ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) } : FALLBACK);
    } catch {
      callback(FALLBACK);
    }
  };

  img.src = imgSrc;
};