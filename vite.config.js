import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo at /dairy-web-app/, not the domain
  // root — every built asset URL needs that prefix or none of them
  // will resolve once deployed.
  base: '/dairy-web-app/',
})
