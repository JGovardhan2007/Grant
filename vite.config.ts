import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(),
  ],
  server: {
    proxy: {
      '/algonode-testnet': {
        target: 'https://testnet-api.algonode.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/algonode-testnet/, ''),
      },
    },
  },
})