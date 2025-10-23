# Zama Private Transfer SDK

A TypeScript SDK for interacting with the Zama Private Transfer smart contract on Sepolia testnet. This SDK enables privacy-preserving transfers using Fully Homomorphic Encryption (FHE) technology.

## Features

- 🔐 **Private Deposits**: Three types of deposit methods
  - Type 1: Specified recipient only
  - Type 2: Anyone with password
  - Type 3: Entrusted withdrawal (with bounty)
- 💸 **Withdrawals**: Secure withdrawal with password verification
- 🎯 **Bounty Tasks**: Complete entrusted withdrawals and earn commissions
- 💰 **Refunds**: Depositors can refund their deposits
- 🔒 **FHE Encryption**: All sensitive data encrypted using Zama's FHE technology

## Installation

```bash
npm install @zama-private-transfer/sdk
# or
yarn add @zama-private-transfer/sdk
```

## Quick Start

### 1. Initialize the SDK

```typescript
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

// Create SDK instance
const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D', // Default Sepolia address
  rpcUrl: 'https://1rpc.io/sepolia', // Optional, defaults to this
});

// Initialize with browser wallet provider (e.g., MetaMask)
await sdk.initialize(window.ethereum);
```

### 2. Make a Deposit

#### Type 1: Specified Recipient

```typescript
const result = await sdk.deposit({
  transferType: TransferType.SPECIFIED_RECIPIENT,
  amount: '0.1', // ETH
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Required
});

console.log('Transaction Hash:', result.transactionHash);
console.log('Password Private Key:', result.passwordWallet.privateKey);
console.log('Password Address:', result.passwordWallet.address);

// IMPORTANT: Save the private key! You need it to withdraw.
```

#### Type 2: Anyone with Password

```typescript
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.05', // ETH
  // No recipient address needed - anyone with password can withdraw
});

// Save the password private key
console.log('Password Key:', result.passwordWallet.privateKey);
```

#### Type 3: Entrusted Withdrawal (Creates a Bounty)

```typescript
const result = await sdk.deposit({
  transferType: TransferType.ENTRUSTED_WITHDRAWAL,
  amount: '0.2', // ETH
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Required
});

// This creates a bounty task that trustees can complete for commission
console.log('Task created with password:', result.passwordWallet.privateKey);
```

### 3. Check Vault Information

```typescript
const vaultInfo = await sdk.getVaultInfo('your-password-here');

console.log('Transfer Type:', vaultInfo.transferType);
console.log('Balance:', vaultInfo.balanceEth, 'ETH');
console.log('Depositor:', vaultInfo.depositor);
console.log('Recipient:', vaultInfo.allowAddress);
```

### 4. Withdraw Funds

```typescript
const result = await sdk.withdraw({
  password: 'your-password-here',
  amount: '0.05', // ETH to withdraw
});

console.log('Withdrawal successful:', result.transactionHash);
console.log('Amount withdrawn:', result.amount, 'ETH');
```

### 5. Get Bounty Tasks

```typescript
const tasks = await sdk.getBountyTasks();

tasks.forEach((task, index) => {
  console.log(`Task ${index + 1}:`);
  console.log('  Amount:', task.totalReward, 'ETH');
  console.log('  Commission:', task.commission, 'ETH');
});
```

### 6. Complete a Bounty Task

```typescript
const tasks = await sdk.getBountyTasks();
const task = tasks[0]; // Select first task

const result = await sdk.completeTask({
  task: task,
  password: 'task-password', // Password provided by task creator
});

console.log('Task completed!');
console.log('Commission earned:', result.commission, 'ETH');
```

### 7. Refund a Deposit

```typescript
const result = await sdk.refund({
  password: 'your-deposit-password',
});

console.log('Refund successful:', result.transactionHash);
console.log('Amount refunded:', result.amount, 'ETH');
```

## Event Callbacks

You can set callbacks to track transaction progress:

```typescript
sdk.setCallbacks({
  onTransactionSubmitted: (txHash) => {
    console.log('Transaction submitted:', txHash);
  },
  onTransactionConfirmed: (receipt) => {
    console.log('Transaction confirmed:', receipt);
  },
  onError: (error) => {
    console.error('Error:', error.message);
  },
});
```

## API Reference

### `PrivateTransferSDK`

#### Constructor

```typescript
constructor(config: SDKConfig)
```

- `config.contractAddress`: Contract address (default: Sepolia deployment)
- `config.rpcUrl`: RPC URL (default: https://1rpc.io/sepolia)
- `config.provider`: Optional pre-configured provider
- `config.signer`: Optional pre-configured signer

#### Methods

##### `initialize(provider?: any): Promise<void>`

Initialize the SDK with a wallet provider (e.g., MetaMask's window.ethereum).

##### `deposit(params: DepositParams): Promise<DepositResult>`

Make a deposit.

##### `getVaultInfo(password: string): Promise<VaultInfo>`

Get vault information by password.

##### `withdraw(params: WithdrawParams): Promise<WithdrawResult>`

Withdraw funds from vault.

##### `getBountyTasks(): Promise<BountyTask[]>`

Get all available bounty tasks.

##### `completeTask(params: CompleteTaskParams): Promise<CompleteTaskResult>`

Complete a bounty task.

##### `refund(params: RefundParams): Promise<RefundResult>`

Refund a deposit.

##### `getFeeRate(): Promise<number>`

Get current commission fee rate.

##### `generatePasswordWallet(): GeneratedWallet`

Generate a random password wallet.

##### `getContractAddress(): string`

Get the contract address.

##### `getSignerAddress(): Promise<string | null>`

Get the current signer address.

## Types

### `TransferType`

```typescript
enum TransferType {
  SPECIFIED_RECIPIENT = 1,    // Only specified recipient can withdraw
  ANYONE_WITH_PASSWORD = 2,   // Anyone with password can withdraw
  ENTRUSTED_WITHDRAWAL = 3,   // Trustee withdraws for recipient
}
```

### `DepositParams`

```typescript
interface DepositParams {
  transferType: TransferType;
  amount: string;              // Amount in ETH
  recipientAddress?: string;   // Required for types 1 and 3
}
```

### `DepositResult`

```typescript
interface DepositResult {
  transactionHash: string;
  passwordWallet: GeneratedWallet;
  blockNumber?: number;
}
```

### `GeneratedWallet`

```typescript
interface GeneratedWallet {
  privateKey: string;  // MUST be saved by user
  address: string;
  wallet: HDNodeWallet;
}
```

## Examples

### Complete Example with React

```typescript
import { useState } from 'react';
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

function App() {
  const [sdk, setSdk] = useState<PrivateTransferSDK | null>(null);
  const [passwordKey, setPasswordKey] = useState('');

  // Initialize SDK
  const connectWallet = async () => {
    const newSdk = new PrivateTransferSDK({
      contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
    });

    await newSdk.initialize(window.ethereum);
    setSdk(newSdk);
  };

  // Make deposit
  const makeDeposit = async () => {
    if (!sdk) return;

    const result = await sdk.deposit({
      transferType: TransferType.ANYONE_WITH_PASSWORD,
      amount: '0.01',
    });

    // IMPORTANT: Save this key!
    setPasswordKey(result.passwordWallet.privateKey);
    alert('Deposit successful! Save your password key: ' + result.passwordWallet.privateKey);
  };

  // Withdraw
  const withdraw = async () => {
    if (!sdk || !passwordKey) return;

    const result = await sdk.withdraw({
      password: passwordKey,
      amount: '0.01',
    });

    alert('Withdrawal successful!');
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      <button onClick={makeDeposit}>Deposit 0.01 ETH</button>
      <button onClick={withdraw}>Withdraw</button>
      {passwordKey && <div>Password Key: {passwordKey}</div>}
    </div>
  );
}
```

### Complete Example with Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

const sdk = ref<PrivateTransferSDK | null>(null);
const passwordKey = ref('');

const connectWallet = async () => {
  const newSdk = new PrivateTransferSDK({
    contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
  });

  await newSdk.initialize(window.ethereum);
  sdk.value = newSdk;
};

const makeDeposit = async () => {
  if (!sdk.value) return;

  const result = await sdk.value.deposit({
    transferType: TransferType.ANYONE_WITH_PASSWORD,
    amount: '0.01',
  });

  passwordKey.value = result.passwordWallet.privateKey;
  alert('Deposit successful!');
};

const withdraw = async () => {
  if (!sdk.value || !passwordKey.value) return;

  await sdk.value.withdraw({
    password: passwordKey.value,
    amount: '0.01',
  });

  alert('Withdrawal successful!');
};
</script>

<template>
  <div>
    <button @click="connectWallet">Connect Wallet</button>
    <button @click="makeDeposit">Deposit 0.01 ETH</button>
    <button @click="withdraw">Withdraw</button>
    <div v-if="passwordKey">Password Key: {{ passwordKey }}</div>
  </div>
</template>
```

## Security Considerations

1. **Save Password Keys**: The generated password private key is the ONLY way to access deposited funds. If lost, funds cannot be recovered.

2. **Never Share Private Keys**: Keep password keys secure and never share them publicly.

3. **Testnet Only**: This is currently deployed on Sepolia testnet. Do not use for mainnet without proper auditing.

4. **Password Security**: Use strong, unique passwords when creating deposits with Type 2 (anyone with password).

## Contract Information

- **Network**: Sepolia Testnet
- **Contract Address**: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`
- **RPC URL**: `https://1rpc.io/sepolia`

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Type check
npm run typecheck

# Watch mode
npm run dev
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
