import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawTarget = (env.VITE_BACKEND_TARGET || env.VITE_API_BASE_URL || 'http://localhost:8080').trim()
  // Clean up base target url (remove /api/v1 if present to get origin domain)
  const proxyTarget = rawTarget.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') || 'http://localhost:8080'

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      open: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '69420',
          },
        },
      },
    },
  }
})
