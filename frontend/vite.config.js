import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import os from 'node:os'

/** Primera IPv4 de la LAN (Wi‑Fi/Ethernet), para abrir desde el celular. */
function lanHost() {
  const nets = os.networkInterfaces()
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      const family = String(net.family)
      if ((family === 'IPv4' || family === '4') && !net.internal) {
        return net.address
      }
    }
  }
  return ''
}

const lan = lanHost()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_LAN_HOST': JSON.stringify(lan),
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
