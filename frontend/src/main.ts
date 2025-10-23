import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import './config/web3modal'
import { initSDK } from '@zama-fhe/relayer-sdk/web'

// Initialize Zama FHE SDK before mounting the app
// WASM files are served from /public/wasm/
initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
  .then(() => {
    console.log('Zama FHE SDK initialized successfully')
    createApp(App).mount('#app')
  })
  .catch((error) => {
    console.error('Failed to initialize Zama FHE SDK:', error)
    // Mount app anyway to show error to user
    createApp(App).mount('#app')
  })
