import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', '*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        globIgnores: ['**/Icon\r', '**/Icon?']
      },
      manifest: {
        name: 'Coffee Brew Timer',
        short_name: 'Brew Timer',
        description: 'A simple, focused coffee brewing timer application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'coffee-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: 'screen-shot.png',
            sizes: '1040x1380',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Recipe Dialog'
          },
          {
            src: 'screen-shot.png',
            sizes: '1040x1380',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Recipe Dialog Desktop'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
