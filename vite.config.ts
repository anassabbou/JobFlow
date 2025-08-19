import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Deploying to GitHub Pages under /JobFlow requires a base path
  base: '/JobFlow/',
  // Allow overriding the base path at build time for deployments
  // For GitHub Pages under /JobFlow set VITE_BASE_PATH=/JobFlow/
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
})