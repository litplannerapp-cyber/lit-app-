import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // The marketing landing page lives at public/index.html (a static, unbundled
  // file copied verbatim to dist/) — the React app is the only Vite HTML entry,
  // built at /app so the PWA manifest/service-worker injection never touches
  // the landing page.
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      scope: '/app/',
      manifest: {
        name: 'Lit: Calm Daily Planner',
        short_name: 'Lit',
        description: 'Lit: Calm Daily Planner',
        theme_color: '#FF6B5E',
        background_color: '#FF6B5E',
        display: 'standalone',
        start_url: '/app',
        scope: '/app/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
