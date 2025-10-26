/**
 * SDK Store - Manages PrivateTransferSDK instance
 */

import { ref, computed } from 'vue'
import { PrivateTransferSDK, initSDK } from '@zama-private-transfer/sdk'
import { useWallet } from './wallet'

// SDK instance
const sdkInstance = ref<PrivateTransferSDK | null>(null)
const isInitialized = ref(false)
const isInitializing = ref(false)
const initError = ref<string | null>(null)

/**
 * Get or create SDK instance
 */
export function useSDK() {
  const { walletProvider, isConnected } = useWallet()

  /**
   * Initialize SDK with wallet provider
   */
  async function initialize() {
    if (isInitialized.value || isInitializing.value) {
      return sdkInstance.value
    }

    try {
      isInitializing.value = true
      initError.value = null

      // Initialize WASM first (this happens in main.ts, but we ensure it's done)
      console.log('[SDK Store] Initializing SDK...')

      // Create SDK instance
      const sdk = new PrivateTransferSDK({
        contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
        rpcUrl: 'https://1rpc.io/sepolia',
      })

      // Initialize with wallet provider if connected
      if (walletProvider.value && isConnected.value) {
        await sdk.initialize(walletProvider.value)
        console.log('[SDK Store] SDK initialized with wallet provider')
      } else {
        // Initialize without provider (read-only mode)
        await sdk.initialize()
        console.log('[SDK Store] SDK initialized in read-only mode')
      }

      sdkInstance.value = sdk
      isInitialized.value = true

      return sdk
    } catch (error: any) {
      console.error('[SDK Store] Failed to initialize SDK:', error)
      initError.value = error.message
      throw error
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * Re-initialize SDK when wallet connects/changes
   */
  async function reinitialize() {
    if (!walletProvider.value || !isConnected.value) {
      console.log('[SDK Store] Cannot reinitialize: wallet not connected')
      return
    }

    try {
      console.log('[SDK Store] Reinitializing SDK with new wallet provider...')

      // Create new SDK instance
      const sdk = new PrivateTransferSDK({
        contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
        rpcUrl: 'https://1rpc.io/sepolia',
      })

      await sdk.initialize(walletProvider.value)

      sdkInstance.value = sdk
      isInitialized.value = true

      console.log('[SDK Store] SDK reinitialized successfully')
      return sdk
    } catch (error: any) {
      console.error('[SDK Store] Failed to reinitialize SDK:', error)
      initError.value = error.message
      throw error
    }
  }

  /**
   * Get SDK instance (initialize if needed)
   */
  async function getSDK(): Promise<PrivateTransferSDK> {
    if (!isInitialized.value) {
      await initialize()
    }

    if (!sdkInstance.value) {
      throw new Error('SDK not initialized')
    }

    return sdkInstance.value
  }

  /**
   * Set SDK event callbacks
   */
  function setCallbacks(callbacks: {
    onTransactionSubmitted?: (txHash: string) => void
    onTransactionConfirmed?: (receipt: any) => void
    onError?: (error: Error) => void
  }) {
    if (sdkInstance.value) {
      sdkInstance.value.setCallbacks(callbacks)
    }
  }

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    isInitializing: computed(() => isInitializing.value),
    initError: computed(() => initError.value),

    // Methods
    initialize,
    reinitialize,
    getSDK,
    setCallbacks,
  }
}
