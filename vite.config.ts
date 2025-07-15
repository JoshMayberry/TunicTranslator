import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import express from "vite-plugin-express"

export default defineConfig({
  plugins: [
    vue(),
    express({
      middlewareFiles: ["src/server/api.ts"]
    })
  ],
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  optimizeDeps: {
    exclude: ["@material/*"]
  }
})
