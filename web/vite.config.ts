import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

import { defineConfig } from 'vite'

const api = 'http://127.0.0.1:8105'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/v1': { target: api, changeOrigin: true },
      '/health': { target: api, changeOrigin: true },
      '/docs': { target: api, changeOrigin: true },
      '/openapi.json': { target: api, changeOrigin: true },
      '/redoc': { target: api, changeOrigin: true },
    },
  },
})
