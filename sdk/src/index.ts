/**
 * Zama Private Transfer SDK - Main Entry Point
 *
 * A TypeScript SDK for interacting with the Zama Private Transfer smart contract.
 * Supports deposit, withdraw, bounty tasks, and refund operations with FHE encryption.
 */

export { PrivateTransferSDK } from './PrivateTransferSDK';

// Re-export initSDK and SepoliaConfig from @zama-fhe/relayer-sdk for convenience
export { initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export {
  TransferType,
  type SDKConfig,
  type DepositParams,
  type DepositResult,
  type GeneratedWallet,
  type VaultInfo,
  type WithdrawParams,
  type WithdrawResult,
  type BountyTask,
  type CompleteTaskParams,
  type CompleteTaskResult,
  type RefundParams,
  type RefundResult,
  type SDKEventCallbacks,
} from './types';

export {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_RPC_URL,
  BLACKHOLE_ADDRESS,
  SEPOLIA_FHE_CONFIG,
  CONTRACT_ABI,
} from './constants';

// Vite plugin for copying WASM files
export { copyWasmPlugin } from './vite-plugin';
