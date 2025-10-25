import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import dts from 'vite-plugin-dts';

// Plugin to copy WASM files to dist after build
function copyWasmToDist() {
  return {
    name: 'copy-wasm-to-dist',
    closeBundle() {
      const wasmSrc = path.resolve(__dirname, 'public/wasm');
      const wasmDest = path.resolve(__dirname, 'dist/wasm');

      if (fs.existsSync(wasmSrc)) {
        // Ensure dist/wasm directory exists
        if (!fs.existsSync(wasmDest)) {
          fs.mkdirSync(wasmDest, { recursive: true });
        }

        // Copy WASM files
        const files = fs.readdirSync(wasmSrc);
        files.forEach(file => {
          const src = path.join(wasmSrc, file);
          const dest = path.join(wasmDest, file);
          fs.copyFileSync(src, dest);
        });
        console.log('✅ WASM files copied to dist/wasm');
      }
    }
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ZamaPrivateTransferSDK',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      // 外部化依赖，不打包进库
      external: ['ethers', '@zama-fhe/relayer-sdk', 'path', 'fs', 'vite'],
      output: {
        globals: {
          ethers: 'ethers',
          '@zama-fhe/relayer-sdk': 'ZamaFHE'
        },
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
    copyWasmToDist()
  ],
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    port: 5173,
    open: true, // 自动打开浏览器
    cors: true, // 允许跨域
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    open: true,
  },
  define: {
    // 为浏览器环境定义Node.js全局变量
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      // 解决Buffer等Node.js模块在浏览器中的兼容性
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js全局变量注入到浏览器环境
      define: {
        global: 'globalThis',
      },
    },
    include: ['buffer', 'process'],
  },
});
