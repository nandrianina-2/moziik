// Point d'entrée public du module player
export { default }                from './FullPlayerPage';
export { extractDominantColor }   from './utils/colorExtractor';
export { initEQ12, EQ_BANDS_12, EQ_PRESETS_12 } from './constants/eq';

// Hooks réutilisables
export { useAccentColor }     from './hooks/useAccentColor';
export { usePlayerAnalytics } from './hooks/usePlayerAnalytics';
export { useAutoQueue }       from './hooks/useAutoQueue';
export { useQueueDrag }       from './hooks/useQueueDrag';
export { useLocalAuth }       from './hooks/useLocalAuth';

// Panels (si besoin de les réutiliser ailleurs)
export { EQPanel, EQBar }    from './panels/EQPanel';
export { default as QueuePanel }   from './panels/QueuePanel';
export { default as InfosPanel }   from './panels/InfosPanel';
export { default as CommentsPanel } from './panels/CommentsPanel';
export { default as PlayerView }   from './panels/PlayerView';

// Modals
export { default as ShareModal } from './modals/ShareModal';
export { default as Toast }      from './modals/Toast';