import { fileURLToPath, URL } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative paths so the build also works when bundled inside Capacitor.
  base: './',
  plugins: [
    vue(),
    // Precompiles src/locales/*.json so the app ships the runtime-only vue-i18n build.
    VueI18nPlugin({
      include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Deducto',
        short_name: 'Deducto',
        description: 'One crime. Several suspects. A single truth.',
        lang: 'en',
        theme_color: '#1d1b24',
        background_color: '#1d1b24',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})
