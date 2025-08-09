import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Vite's default port (spells "VITE")
    host: '0.0.0.0', // Allow external connections
    strictPort: true, // Exit if port is already in use
    cors: true
  },
  preview: {
    port: 5173
  }
})
