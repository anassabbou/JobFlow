import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Deploying to GitHub Pages under /JobFlow requires a base path
  base: '/JobFlow/',
  plugins: [react()],
})