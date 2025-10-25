import path from 'path'
import fs from 'fs'

/**
 * Vite plugin to copy WASM files from the SDK package to the frontend's public directory
 * This plugin should be used in your frontend's vite.config.ts
 */
export function copyWasmPlugin(): any {
  return {
    name: 'zama-sdk-copy-wasm',
    buildStart() {
      // Determine SDK path based on whether we're in development (npm link) or production (node_modules)
      let sdkWasmDir: string

      // Try to find the SDK's WASM directory
      const possiblePaths = [
        // When using npm link (development) - WASM files are in dist/wasm after build
        path.resolve(__dirname, '../wasm'),
        path.resolve(__dirname, '../../dist/wasm'),
        // When installed from node_modules
        path.resolve(process.cwd(), 'node_modules/@zama-private-transfer/sdk/dist/wasm'),
        // Fallback: public/wasm (if not built yet)
        path.resolve(__dirname, '../public/wasm'),
        path.resolve(process.cwd(), 'node_modules/@zama-private-transfer/sdk/public/wasm'),
      ]

      sdkWasmDir = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0]

      const publicWasmDir = path.resolve(process.cwd(), 'public/wasm')

      // Create directory if it doesn't exist
      if (!fs.existsSync(publicWasmDir)) {
        fs.mkdirSync(publicWasmDir, { recursive: true })
      }

      // Copy WASM files
      if (fs.existsSync(sdkWasmDir)) {
        const files = fs.readdirSync(sdkWasmDir)
        files.forEach(file => {
          const src = path.join(sdkWasmDir, file)
          const dest = path.join(publicWasmDir, file)
          fs.copyFileSync(src, dest)
        })
        console.log('✅ WASM files copied from @zama-private-transfer/sdk')
      } else {
        console.warn('⚠️  SDK WASM directory not found:', sdkWasmDir)
      }
    }
  }
}
