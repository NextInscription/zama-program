/**
 * Type definitions for Zama Private Transfer SDK
 */

import type { Provider, Signer, HDNodeWallet } from 'ethers';

/**
 * Transfer types for deposits
 */
export enum TransferType {
  /** Type 1: Only the specified recipient can withdraw */
  SPECIFIED_RECIPIENT = 1,
  /** Type 2: Anyone with the password can withdraw */
  ANYONE_WITH_PASSWORD = 2,
  /** Type 3: Trustee withdraws on behalf of recipient */
  ENTRUSTED_WITHDRAWAL = 3,
}

/**
 * SDK configuration options
 */
export interface SDKConfig {
  /** Contract address on Sepolia */
  contractAddress: string;
  /** RPC URL (default: https://1rpc.io/sepolia) */
  rpcUrl?: string;
  /** Provider instance (if already initialized) */
  provider?: Provider;
  /** Signer instance (if already initialized) */
  signer?: Signer;
}

/**
 * Deposit parameters
 */
export interface DepositParams {
  /** Transfer type (1, 2, or 3) */
  transferType: TransferType;
  /** Amount to deposit in ETH (string format, e.g., "0.1") */
  amount: string;
  /** Recipient address (required for types 1 and 3, optional for type 2) */
  recipientAddress?: string;
}

/**
 * Generated wallet information returned after deposit
 */
export interface GeneratedWallet {
  /** Private key (must be saved by user) */
  privateKey: string;
  /** Wallet address */
  address: string;
  /** Full wallet instance */
  wallet: HDNodeWallet;
}

/**
 * Deposit result
 */
export interface DepositResult {
  /** Transaction hash */
  transactionHash: string;
  /** Password as uint256 (bigint format) */
  password: bigint;
  /** Password private key */
  privateKey: string;
  /** Password wallet address */
  passwordAddress: string;
  /** Recipient address (target address for the transfer) */
  recipientAddress: string;
  /** Block number */
  blockNumber?: number;
}

/**
 * Vault information structure
 */
export interface VaultInfo {
  /** Whether vault exists */
  isPublished: boolean;
  /** Transfer type (1, 2, or 3) */
  transferType: number;
  /** Balance in wei (string format) */
  balance: string;
  /** Balance in ETH (string format) */
  balanceEth: string;
  /** Password wallet address */
  passwordAddress: string;
  /** Depositor address */
  depositor: string;
  /** Allowed recipient address */
  allowAddress: string;
}

/**
 * Withdraw parameters
 */
export interface WithdrawParams {
  /** Private key (password) from deposit result */
  privateKey: string;
  /** Amount to withdraw in ETH (string format) */
  amount: string;
}

/**
 * Withdraw result
 */
export interface WithdrawResult {
  /** Transaction hash */
  transactionHash: string;
  /** Amount withdrawn in ETH */
  amount: string;
  /** Block number */
  blockNumber?: number;
}

/**
 * Bounty task information
 */
export interface BountyTask {
  /** Task password (bigint) */
  password: bigint;
  /** Task amount in wei (bigint) */
  amount: bigint;
  /** Commission in ETH (string format) */
  commission: string;
  /** Total reward in ETH (string format) */
  totalReward: string;
}

/**
 * Complete task parameters
 */
export interface CompleteTaskParams {
  /** Task to complete */
  task: BountyTask;
  /** Password (uint256) for the task - trustees don't have access to private key */
  password: bigint;
}

/**
 * Complete task result
 */
export interface CompleteTaskResult {
  /** Transaction hash */
  transactionHash: string;
  /** Commission earned in ETH */
  commission: string;
  /** Block number */
  blockNumber?: number;
}

/**
 * Refund parameters
 */
export interface RefundParams {
  /** Private key (password) from deposit result */
  privateKey: string;
}

/**
 * Refund result
 */
export interface RefundResult {
  /** Transaction hash */
  transactionHash: string;
  /** Amount refunded in ETH */
  amount: string;
  /** Block number */
  blockNumber?: number;
}

/**
 * Event callbacks for SDK operations
 */
export interface SDKEventCallbacks {
  /** Called when transaction is submitted */
  onTransactionSubmitted?: (txHash: string) => void;
  /** Called when transaction is confirmed */
  onTransactionConfirmed?: (receipt: any) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}
