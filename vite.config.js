import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  root: 'demo',
  resolve: {
    alias: {
      '@plq/use-persisted-state': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  preview: {
    port: 3000,
  },
})
