/**
 * Zama Private Transfer SDK utilities
 *
 * This file provides a singleton instance of the SDK for use throughout the app.
 * The SDK now includes @zama-fhe/relayer-sdk internally, so you don't need to import it separately.
 */

import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk'
import { CONTRACT_ADDRESS } from '../config/web3modal'

let sdkInstance: PrivateTransferSDK | null = null

/**
 * Get or create SDK instance
 */
export function getSDK(): PrivateTransferSDK {
  if (!sdkInstance) {
    sdkInstance = new PrivateTransferSDK({
      contractAddress: CONTRACT_ADDRESS,
    })
  }
  return sdkInstance
}

/**
 * Initialize SDK with wallet provider
 * @param provider Wallet provider (e.g., window.ethereum)
 */
export async function initializeSDK(provider: any): Promise<PrivateTransferSDK> {
  const sdk = getSDK()
  await sdk.initialize(provider)
  return sdk
}

// Re-export for convenience
export { TransferType }
export type { PrivateTransferSDK }
