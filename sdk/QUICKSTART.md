# Quick Start Guide

## Installation

```bash
npm install @zama-private-transfer/sdk
# or
yarn add @zama-private-transfer/sdk
# or
pnpm add @zama-private-transfer/sdk
```

## Basic Usage (5 Minutes)

### 1. Initialize SDK

```typescript
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

// Create SDK instance
const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
});

// Initialize with MetaMask or other Web3 provider
await sdk.initialize(window.ethereum);
```

### 2. Make a Deposit

```typescript
// Deposit that anyone with password can withdraw
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.01', // 0.01 ETH
});

console.log('Password Key:', result.passwordWallet.privateKey);
// ⚠️ SAVE THIS KEY - you need it to withdraw!
```

### 3. Withdraw Funds

```typescript
// Check vault first
const vaultInfo = await sdk.getVaultInfo('your-password');
console.log('Balance:', vaultInfo.balanceEth, 'ETH');

// Withdraw
const result = await sdk.withdraw({
  password: 'your-password',
  amount: '0.01',
});
```

## Transfer Types

### Type 1: Specified Recipient
Only the specified address can withdraw.

```typescript
await sdk.deposit({
  transferType: TransferType.SPECIFIED_RECIPIENT,
  amount: '0.1',
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
});
```

### Type 2: Anyone with Password
Anyone who has the password can withdraw.

```typescript
await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.05',
  // No recipient address needed
});
```

### Type 3: Entrusted Withdrawal
Creates a bounty task. A trustee can help withdraw for a commission.

```typescript
await sdk.deposit({
  transferType: TransferType.ENTRUSTED_WITHDRAWAL,
  amount: '0.2',
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
});
```

## Bounty Tasks

### View Available Tasks

```typescript
const tasks = await sdk.getBountyTasks();

tasks.forEach((task) => {
  console.log('Commission:', task.commission, 'ETH');
  console.log('Total:', task.totalReward, 'ETH');
});
```

### Complete a Task

```typescript
const task = tasks[0];

const result = await sdk.completeTask({
  task,
  password: 'task-password', // From task creator
});

console.log('Earned:', result.commission, 'ETH');
```

## Event Callbacks

```typescript
sdk.setCallbacks({
  onTransactionSubmitted: (txHash) => {
    console.log('Transaction:', txHash);
  },
  onTransactionConfirmed: (receipt) => {
    console.log('Confirmed at block:', receipt.blockNumber);
  },
  onError: (error) => {
    console.error('Error:', error.message);
  },
});
```

## React Example

```tsx
import { useState } from 'react';
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

function App() {
  const [sdk, setSdk] = useState<PrivateTransferSDK | null>(null);
  const [password, setPassword] = useState('');

  const connect = async () => {
    const newSdk = new PrivateTransferSDK({
      contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
    });
    await newSdk.initialize(window.ethereum);
    setSdk(newSdk);
  };

  const deposit = async () => {
    const result = await sdk!.deposit({
      transferType: TransferType.ANYONE_WITH_PASSWORD,
      amount: '0.01',
    });
    setPassword(result.passwordWallet.privateKey);
    alert('Deposit successful! Save your password.');
  };

  const withdraw = async () => {
    await sdk!.withdraw({
      password,
      amount: '0.01',
    });
    alert('Withdrawal successful!');
  };

  return (
    <div>
      <button onClick={connect}>Connect Wallet</button>
      <button onClick={deposit} disabled={!sdk}>Deposit</button>
      <button onClick={withdraw} disabled={!sdk || !password}>Withdraw</button>
      {password && <p>Password: {password}</p>}
    </div>
  );
}
```

## Vue 3 Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

const sdk = ref<PrivateTransferSDK | null>(null);
const password = ref('');

const connect = async () => {
  const newSdk = new PrivateTransferSDK({
    contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
  });
  await newSdk.initialize(window.ethereum);
  sdk.value = newSdk;
};

const deposit = async () => {
  const result = await sdk.value!.deposit({
    transferType: TransferType.ANYONE_WITH_PASSWORD,
    amount: '0.01',
  });
  password.value = result.passwordWallet.privateKey;
};

const withdraw = async () => {
  await sdk.value!.withdraw({
    password: password.value,
    amount: '0.01',
  });
};
</script>

<template>
  <div>
    <button @click="connect">Connect Wallet</button>
    <button @click="deposit" :disabled="!sdk">Deposit</button>
    <button @click="withdraw" :disabled="!sdk || !password">Withdraw</button>
    <p v-if="password">Password: {{ password }}</p>
  </div>
</template>
```

## Important Notes

1. **Save Password Keys**: The private key generated during deposit is the ONLY way to withdraw. If lost, funds cannot be recovered.

2. **Testnet**: This SDK is for Sepolia testnet. Get test ETH from [Sepolia faucet](https://sepoliafaucet.com/).

3. **MetaMask**: Make sure MetaMask is connected to Sepolia testnet.

4. **Gas Fees**: All transactions require gas fees in ETH.

## Next Steps

- Read the full [README.md](./README.md) for complete API documentation
- Check out [examples/](./examples/) for more detailed examples
- Open [web-integration.html](./examples/web-integration.html) for a live demo

## Support

- GitHub: [Open an issue](https://github.com/your-repo/issues)
- Network: Sepolia Testnet
- Contract: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`
