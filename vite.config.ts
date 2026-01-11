import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'logo.svg', 'movie-poster-fallback.svg'],
    manifest: {
      name: 'Movies.to - Movie Discovery Platform',
      short_name: 'Movies.to',
      description: 'A modern movie discovery platform with TMDB integration',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      icons: [{
        src: '/logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml'
      }, {
        src: '/logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml'
      }]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
      runtimeCaching: [{
        urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'tmdb-api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }, {
        urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tmdb-images-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }, {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'backend-api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5 // 5 minutes
          }
        }
      }]
    },
    devOptions: {
      enabled: false
    }
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom")
    },
    dedupe: ["react", "react-dom"]
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/tmdb-images': {
        target: 'https://image.tmdb.org',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/tmdb-images/, '/t/p'),
        headers: {
          'Referer': 'https://www.themoviedb.org/'
        }
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "zustand"],
    exclude: ["same-runtime/dist/jsx-runtime", "same-runtime/dist/jsx-dev-runtime"]
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ['**/e2e/**', 'e2e/**', '**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/mockData", "dist/", "e2e/"]
    }
  }
});