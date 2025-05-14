import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['ii-repetitor.loca.lt', 'localhost', '212.15.61.79', '*', '192.168.0.1']
  }
})
