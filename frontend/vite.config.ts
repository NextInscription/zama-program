import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyWasmPlugin } from '@zama-private-transfer/sdk'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    copyWasmPlugin()
  ],
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@zama-fhe/relayer-sdk'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
  },
  worker: {
    format: 'es',
  },
})
