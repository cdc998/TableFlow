import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TableFlow/', // Replace 'TableFlow' with your actual repository name
  build: {
    outDir: 'dist',
  },
})