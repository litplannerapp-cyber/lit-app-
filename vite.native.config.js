import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Capacitor (iOS) shell needs the app self-contained at its webDir root —
// index.html plus its own assets/, no /app subpath and no landing page.
// The regular vite.config.js builds both the marketing landing page (root)
// and the app (/app) for the web deploy; this is a separate, app-only build
// so `npx cap sync` has a webDir that actually works as a native bundle.
//
// The build still emits to dist-native/app/index.html (Vite mirrors the
// entry's own relative path) and public/index.html — the landing page —
// still gets copied to dist-native/index.html alongside it. The
// `build:native` npm script overwrites that with the real app's index.html
// right after this runs; don't rely on this config alone.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-native',
    rollupOptions: {
      input: resolve(__dirname, 'app/index.html'),
    },
  },
})
