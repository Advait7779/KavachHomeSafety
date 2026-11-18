import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:6002',
      '/uploads': 'http://localhost:6002',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('@phosphor-icons')) return 'icons'
            if (id.includes('react-router') || id.includes('react')) return 'vendor'
          }
        },
      },
    },
  },
})
