// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from 'react';

export const THEMES = {
  dark: {
    id: 'dark',
    label: 'Dark',
    icon: '🌙',
    vars: {
      '--bg-base':        '#09090b',
      '--bg-surface':     '#0e0f14',
      '--bg-elevated':    '#18181b',
      '--bg-overlay':     'rgba(9,9,11,0.98)',
      '--border':         'rgba(255,255,255,0.06)',
      '--border-strong':  'rgba(255,255,255,0.12)',
      '--text-primary':   '#fafafa',
      '--text-secondary': '#a1a1aa',
      '--text-muted':     '#52525b',
      '--accent':         '#dc2626',
      '--accent-glow':    'rgba(220,38,38,0.25)',
    },
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    icon: '🌌',
    vars: {
      '--bg-base':        '#020818',
      '--bg-surface':     '#070f24',
      '--bg-elevated':    '#0d1a35',
      '--bg-overlay':     'rgba(2,8,24,0.98)',
      '--border':         'rgba(99,130,255,0.1)',
      '--border-strong':  'rgba(99,130,255,0.2)',
      '--text-primary':   '#e8eeff',
      '--text-secondary': '#8899cc',
      '--text-muted':     '#3d4f7a',
      '--accent':         '#dc2626',
      '--accent-glow':    'rgba(220,38,38,0.3)',
    },
  },
  amoled: {
    id: 'amoled',
    label: 'AMOLED',
    icon: '⚫',
    vars: {
      '--bg-base':        '#000000',
      '--bg-surface':     '#000000',
      '--bg-elevated':    '#0a0a0a',
      '--bg-overlay':     'rgba(0,0,0,0.99)',
      '--border':         'rgba(255,255,255,0.04)',
      '--border-strong':  'rgba(255,255,255,0.08)',
      '--text-primary':   '#ffffff',
      '--text-secondary': '#888888',
      '--text-muted':     '#444444',
      '--accent':         '#dc2626',
      '--accent-glow':    'rgba(220,38,38,0.4)',
    },
  },
  light: {
    id: 'light',
    label: 'Light',
    icon: '☀️',
    vars: {
      '--bg-base':        '#f4f4f5',
      '--bg-surface':     '#ffffff',
      '--bg-elevated':    '#fafafa',
      '--bg-overlay':     'rgba(244,244,245,0.98)',
      '--border':         'rgba(0,0,0,0.08)',
      '--border-strong':  'rgba(0,0,0,0.16)',
      '--text-primary':   '#09090b',
      '--text-secondary': '#52525b',
      '--text-muted':     '#a1a1aa',
      '--accent':         '#dc2626',
      '--accent-glow':    'rgba(220,38,38,0.15)',
    },
  },
};

export function useTheme() {
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem('moozik_theme') || 'dark'
  );

  const applyTheme = useCallback((id) => {
    const theme = THEMES[id] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', id);
    localStorage.setItem('moozik_theme', id);
    setThemeId(id);
  }, []);

  // Apply on mount + when themeId changes
  useEffect(() => { applyTheme(themeId); }, [themeId, applyTheme]);

  return { themeId, setTheme: applyTheme, themes: THEMES };
}