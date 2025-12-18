import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.18.8', // Makes the server externally accessible
    // or set a specific hostname
    // host: 'home.example.com'
  }
})
