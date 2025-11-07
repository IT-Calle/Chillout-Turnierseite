import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const repoBase = '/Chillout-Turnierseite/'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? repoBase,
  plugins: [react() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
