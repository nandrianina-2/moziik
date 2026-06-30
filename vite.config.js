import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'icon-192.png', 'icon-512.png'],
      strategies: 'generateSW',
      // strategies: 'injectManifest', // ou 'generateSW'

      // ── Service Worker / Cache Workbox ──────────
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          // Cache l'API (songs, artists, albums) — network first, fallback cache
          {
            urlPattern: /^https:\/\/moozik-gft1\.onrender\.com\/(?:songs|artists|albums|playlists)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
          // Cache les images Cloudinary
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Cache les fichiers audio (stale-while-revalidate)
          {
            urlPattern: /\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              rangeRequests: true, // Important pour le streaming audio
            },
          },
        ],
      },

      // ── Manifest PWA ────────────────────────────
      manifest: {
        name: 'Moozik',
        short_name: 'Moozik',
        description: 'Votre plateforme musicale personnelle',
        theme_color: '#dc2626',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['music', 'entertainment'],

        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],

        // ── Raccourcis appui long sur l'icône ──────
        shortcuts: [
          {
            name: 'Mes Favoris',
            short_name: 'Favoris',
            description: 'Accéder à vos titres favoris',
            url: '/favorites',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Historique',
            short_name: 'Historique',
            description: 'Voir votre historique d\'écoute',
            url: '/history',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Pour vous',
            short_name: 'Recommandations',
            description: 'Musiques recommandées',
            url: '/recommendations',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],

        // ── Share Target (recevoir un lien partagé) ─
        share_target: {
          action: '/',
          method: 'GET',
          params: { title: 'title', text: 'text', url: 'url' },
        },

        // ── Screenshots (stores) ──────────────────
        screenshots: [
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'narrow' },
        ],
      },
    }),
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  server: {
    port: 5173,
    host: true,
    server: {
    headers: {
      'Content-Security-Policy': "connect-src 'self' https://backend-moozik.vercel.app"
    }
  }
  },
});