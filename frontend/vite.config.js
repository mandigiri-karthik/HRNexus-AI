import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Google sign-in only works on addresses registered in Google Cloud Console,
  // so the port is fixed. strictPort fails loudly if 8080 is already in use.
  server: { port: 8080, strictPort: true },
  preview: { port: 8080, strictPort: true },
})
