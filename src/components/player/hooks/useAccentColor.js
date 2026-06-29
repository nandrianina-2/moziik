import { useState, useEffect, useMemo, useRef } from 'react';
import { extractDominantColor } from '../utils/colorExtractor';

/**
 * Extrait et dérive les valeurs de couleur d'accentuation à partir d'une image.
 *
 * @param {string | undefined} imageSrc
 * @returns {{ accentRGB: {r:number,g:number,b:number}, accentHex: string, accentCSS: string }}
 */
export const useAccentColor = (imageSrc) => {
  const [accentRGB, setAccentRGB] = useState({ r: 220, g: 38, b: 38 });
  const prevImgRef = useRef('');

  useEffect(() => {
    if (!imageSrc || imageSrc === prevImgRef.current) return;
    prevImgRef.current = imageSrc;
    extractDominantColor(imageSrc, setAccentRGB);
  }, [imageSrc]);

  const accentHex = useMemo(() => {
    const { r, g, b } = accentRGB;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }, [accentRGB]);

  const accentCSS = `${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}`;

  return { accentRGB, accentHex, accentCSS };
};