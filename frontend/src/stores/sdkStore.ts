/**
 * SDK Store (Pinia) - 全局 SDK 状态管理
 *
 * 使用 Pinia 管理 SDK 实例，自动在钱包连接时初始化
 * 负责 WASM 模块和 SDK 实例的完整生命周期管理
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { PrivateTransferSDK } from '@zama-private-transfer/sdk'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/vue'
import { initSDK, SepoliaConfig, createInstance } from '@zama-fhe/relayer-sdk/web'
export const useSDKStore = defineStore('sdk', () => {
  // State
  const sdkInstance = ref<PrivateTransferSDK | null>(null)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const wasmInitialized = ref(false)
  const initError = ref<string | null>(null)

  // Web3Modal hooks
  const { walletProvider } = useWeb3ModalProvider()
  const { isConnected } = useWeb3ModalAccount()

  /**
   * 初始化 SDK
   */
  async function initialize() {
    // 如果已经在初始化或已初始化，直接返回
    if (isInitializing.value || (isInitialized.value && sdkInstance.value)) {
      return sdkInstance.value
    }

    try {
      isInitializing.value = true
      initError.value = null
      if (import.meta.env.DEV) {
        await initSDK({
          tfheParams: 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/tfhe_bg.wasm',
          kmsParams: 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/kms_lib_bg.wasm',
        })
      } else {
        await initSDK()
      }
      const instance = await createInstance(SepoliaConfig);
      // 2. 创建 SDK 实例（使用默认配置）
      const sdk = new PrivateTransferSDK()
      // 3. 初始化 SDK（使用钱包 provider 或不使用）
      if (walletProvider.value && isConnected.value) {
        await sdk.initialize(instance, walletProvider.value)
        console.log('[SDK Store] ✅ SDK 已使用钱包初始化')
      }

      sdkInstance.value = sdk
      isInitialized.value = true

      return sdk
    } catch (error: any) {
      console.error('[SDK Store] ❌ SDK 初始化失败:', error)
      initError.value = error.message
      throw error
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * 重新初始化 SDK（当钱包状态变化时）
   */
  async function reinitialize() {
    console.log('[SDK Store] 重新初始化 SDK...')

    // 重置状态
    isInitialized.value = false
    sdkInstance.value = null

    // 重新初始化
    return await initialize()
  }

  /**
   * 获取 SDK 实例（如果未初始化则自动初始化）
   */
  async function getSDK(): Promise<PrivateTransferSDK> {
    // If SDK not initialized, initialize it
    if (!sdkInstance.value || !isInitialized.value) {
      await initialize()
    }

    // If wallet is connected but SDK was initialized without wallet, reinitialize
    if (sdkInstance.value && isConnected.value && walletProvider.value) {
      const signerAddress = await sdkInstance.value.getSignerAddress()
      if (!signerAddress) {
        console.log('[SDK Store] SDK initialized without wallet, reinitializing...')
        await reinitialize()
      }
    }

    if (!sdkInstance.value) {
      throw new Error('SDK initialization failed')
    }

    return sdkInstance.value as PrivateTransferSDK
  }

  /**
   * 设置 SDK 回调
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

  /**
   * 清理 SDK
   */
  function cleanup() {
    sdkInstance.value = null
    isInitialized.value = false
    initError.value = null
  }

  // 监听钱包连接状态
  watch(
    () => isConnected.value,
    async (connected, wasConnected) => {
      console.log(`[SDK Store] 钱包连接状态变化: ${wasConnected} -> ${connected}`)

      if (connected && walletProvider.value) {
        // 钱包连接时，重新初始化 SDK
        try {
          await reinitialize()
        } catch (error) {
          console.error('[SDK Store] 自动初始化失败:', error)
        }
      } else if (!connected && wasConnected) {
        // 钱包断开时，清理 SDK（可选）
        // cleanup()
        console.log('[SDK Store] 钱包已断开，SDK 保持只读模式')
      }
    },
    { immediate: false }
  )

  // 返回 store 的公共 API
  return {
    // State
    sdkInstance,
    isInitialized,
    isInitializing,
    wasmInitialized,
    initError,

    // Actions
    initialize,
    reinitialize,
    getSDK,
    setCallbacks,
    cleanup,
  }
})
