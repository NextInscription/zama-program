/**
 * Constants and configurations
 */

import type { FHEConfig } from './types';

/**
 * Default contract address on Sepolia
 */
export const DEFAULT_CONTRACT_ADDRESS = '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D';

/**
 * Default RPC URL
 */
export const DEFAULT_RPC_URL = 'https://1rpc.io/sepolia';

/**
 * Blackhole address for type 2 deposits (anyone with password)
 */
export const BLACKHOLE_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Sepolia FHE Configuration
 */
export const SEPOLIA_FHE_CONFIG: FHEConfig = {
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  chainId: 11155111,
  gatewayChainId: 55815,
  network: 'https://1rpc.io/sepolia',
  networkUrl: 'https://sepolia.public.blastapi.io',
  relayerUrl: 'https://relayer.testnet.zama.cloud',
  gatewayUrl: 'https://gateway.sepolia.zama.ai/',
};

/**
 * Contract ABI
 */
export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'string', name: '_name', type: 'string' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'FailedCall', type: 'error' },
  { inputs: [], name: 'HandlesAlreadySavedForRequestID', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'uint256', name: 'needed', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
    type: 'error',
  },
  { inputs: [], name: 'InvalidKMSSignatures', type: 'error' },
  { inputs: [], name: 'NoHandleFoundForRequestID', type: 'error' },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'uint256', name: 'requestID', type: 'uint256' }],
    name: 'DecryptionFulfilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'depositer', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'DepositExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'receiver', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'WithdrawalExecuted',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256[]', name: 'passwords', type: 'uint256[]' }],
    name: 'batchGetVault',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'isPublished', type: 'bool' },
          { internalType: 'euint256', name: 'transferType', type: 'bytes32' },
          { internalType: 'euint256', name: 'balance', type: 'bytes32' },
          { internalType: 'eaddress', name: 'passwordAddress', type: 'bytes32' },
          { internalType: 'eaddress', name: 'depositor', type: 'bytes32' },
          { internalType: 'eaddress', name: 'allowAddress', type: 'bytes32' },
          {
            components: [
              { internalType: 'eaddress', name: 'receiver', type: 'bytes32' },
              { internalType: 'euint256', name: 'amount', type: 'bytes32' },
            ],
            internalType: 'struct PrivateTransfer.Withdrawal[]',
            name: 'withdrawal',
            type: 'tuple[]',
          },
        ],
        internalType: 'struct PrivateTransfer.Vault[]',
        name: 'vaults',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_fee', type: 'uint256' }],
    name: 'changeFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'externalEuint256', name: '_password', type: 'bytes32' },
      { internalType: 'externalEuint256', name: '_transferType', type: 'bytes32' },
      { internalType: 'externalEaddress', name: '_passwordAddress', type: 'bytes32' },
      { internalType: 'externalEaddress', name: '_allowAddress', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'depositDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'externalEuint256', name: '_password', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'entrustWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'entrustWithdrawDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPasswords',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'password', type: 'uint256' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        internalType: 'struct PrivateTransfer.Task[]',
        name: '_tasks',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'password', type: 'uint256' }],
    name: 'getVault',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'isPublished', type: 'bool' },
          { internalType: 'euint256', name: 'transferType', type: 'bytes32' },
          { internalType: 'euint256', name: 'balance', type: 'bytes32' },
          { internalType: 'eaddress', name: 'passwordAddress', type: 'bytes32' },
          { internalType: 'eaddress', name: 'depositor', type: 'bytes32' },
          { internalType: 'eaddress', name: 'allowAddress', type: 'bytes32' },
          {
            components: [
              { internalType: 'eaddress', name: 'receiver', type: 'bytes32' },
              { internalType: 'euint256', name: 'amount', type: 'bytes32' },
            ],
            internalType: 'struct PrivateTransfer.Withdrawal[]',
            name: 'withdrawal',
            type: 'tuple[]',
          },
        ],
        internalType: 'struct PrivateTransfer.Vault',
        name: 'vault',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'perEntrustWithdrawDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'perRefundDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'perWithdrawDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'externalEuint256', name: '_password', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'refundDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'tasks',
    outputs: [
      { internalType: 'uint256', name: 'password', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'externalEuint256', name: '_password', type: 'bytes32' },
      { internalType: 'externalEuint256', name: '_amount', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestID', type: 'uint256' },
      { internalType: 'bytes', name: 'cleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
    ],
    name: 'withdrawDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
