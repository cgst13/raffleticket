import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5190,
    host: 'localhost',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'sample-ticket-bg.svg'],
      manifest: {
        name: 'RafflePro - Raffle Ticket Management & Printing',
        short_name: 'RafflePro',
        description: 'Complete Raffle Ticket Management, Visual Design & Interleaved Printing System',
        theme_color: '#F97316',
        background_color: '#F8F8F7',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
  },
});
