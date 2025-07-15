import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    sourcemap: false // or 'inline'
  },
  optimizeDeps: {
    exclude: ['@material/*'] // Optional: skip optimizing MDC packages
  },
  server: {
    proxy: {
      '/words': 'http://localhost:3000',
      '/sentences': 'http://localhost:3000',
      '/symbols': 'http://localhost:3000',
      '/instances': 'http://localhost:3000',
      '/symbol-history': 'http://localhost:3000',
    }
  }
})
