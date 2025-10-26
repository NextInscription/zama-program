# Zama Private Transfer SDK

A TypeScript SDK for Zama Private Transfer smart contract on Sepolia testnet with FHE encryption.

## Installation

```bash
npm install zama-private-transfer
```

```bash
# 2. Install dependencies
npm install

# 3. Build SDK
cd sdk && npm run build
```

## WASM Setup

The SDK automatically handles WASM loading using smart path resolution:

1. **Package-relative** (automatic with Vite/Rollup)
2. **Explicit URLs** (if provided)
3. **Public folder** (`/wasm` in dev, `/assets` in prod)

### Option 1: Automatic (Recommended)

No configuration needed! The SDK uses `new URL()` to resolve WASM files automatically.

```typescript
import { initSDK, createInstance, SepoliaConfig} from '@zama-fhe/relayer-sdk/web'
await initSDK()
const instance = await createInstance(SepoliaConfig);
const sdk = new PrivateTransferSDK()
await sdk.initialize(instance, window.ethereum)
// WASM files loaded automatically
```

### Option 2: Vite Plugin (For public folder copy)

```typescript
// vite.config.ts
import { copyWasmPlugin } from 'zama-private-transfer/plugin'

export default defineConfig({
  plugins: [copyWasmPlugin()]
})
```

## Quick Start

```typescript
import { PrivateTransferSDK, TransferType } from 'zama-private-transfer'
import { initSDK, createInstance, SepoliaConfig} from '@zama-fhe/relayer-sdk/web'
await initSDK()
const instance = await createInstance(SepoliaConfig);
const sdk = new PrivateTransferSDK()
await sdk.initialize(instance, window.ethereum)

// 2. Set callbacks (optional)
sdk.setCallbacks({
  onTransactionSubmitted: (hash) => console.log('Submitted:', hash),
  onTransactionConfirmed: (receipt) => console.log('Confirmed:', receipt),
  onError: (error) => console.error('Error:', error)
})

// 3. Deposit
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.1'
})
console.log('Private Key:', result.privateKey) // ⚠️ Must save!

// 4. Get vault info
const vault = await sdk.getVaultInfo(result.privateKey)
console.log('Balance:', vault.balanceEth, 'ETH')

// 5. Withdraw
await sdk.withdraw({
  privateKey: result.privateKey,
  amount: '0.05'
})
```

## Core API

### 1. `initialize(provider)` - Initialize SDK

```typescript
import { initSDK, createInstance, SepoliaConfig} from '@zama-fhe/relayer-sdk/web'
await initSDK()
const instance = await createInstance(SepoliaConfig);
const sdk = new PrivateTransferSDK()
await sdk.initialize(instance, window.ethereum)

// Or specify custom contract
const sdk = new PrivateTransferSDK({
  rpcUrl: 'https://...'
})
await sdk.initialize(window.ethereum)
```

### 2. `deposit(params)` - Make Deposit

**Uses private key (auto-generated)**

```typescript
const result = await sdk.deposit({
  transferType: TransferType.SPECIFIED_RECIPIENT,  // 1: Specified recipient only
  // transferType: TransferType.ANYONE_WITH_PASSWORD,  // 2: Anyone with password
  // transferType: TransferType.ENTRUSTED_WITHDRAWAL,  // 3: Bounty task
  amount: '0.1',
  recipientAddress: '0x...'  // Required for Type 1 & 3
})

// Returns
result.privateKey        // Private key (Must save!)
result.password          // uint256 password
result.passwordAddress   // Password address
result.transactionHash   // Transaction hash
```

### 3. `withdraw(params)` - Withdraw Funds

**Uses private key**

```typescript
// Use the privateKey returned from deposit()
await sdk.withdraw({
  privateKey: result.privateKey,  // From deposit result
  amount: '0.05'
})
```

### 4. `getVaultInfo(privateKey)` - Get Vault Info

**Uses private key**

```typescript
// Use the privateKey returned from deposit()
const vault = await sdk.getVaultInfo(result.privateKey)

// Returns
vault.transferType    // Transfer type: 1/2/3
vault.balance         // Balance in wei
vault.balanceEth      // Balance in ETH
vault.depositor       // Depositor address
vault.allowAddress    // Allowed address
```

### 5. `getBountyTasks()` - Get Bounty Task List

```typescript
const tasks = await sdk.getBountyTasks()

tasks.forEach(task => {
  console.log('Password:', task.password)      // uint256
  console.log('Amount:', task.amount)          // bigint
  console.log('Commission:', task.commission)  // ETH string
})
```

### 6. `completeTask(params)` - Complete Bounty Task

**⚠️ IMPORTANT: Uses uint256 password, NOT private key!**

```typescript
const tasks = await sdk.getBountyTasks()
const task = tasks[0]

await sdk.completeTask({
  task: task,
  password: task.password  // ⚠️ uint256 password (bigint)
})
```

### 7. `refund(params)` - Refund Deposit

**Uses private key**

```typescript
// Use the privateKey returned from deposit()
await sdk.refund({
  privateKey: result.privateKey  // From deposit result
})
```

### 8. `setCallbacks(callbacks)` - Set Event Callbacks

```typescript
sdk.setCallbacks({
  onTransactionSubmitted: (txHash: string) => {
    console.log('Transaction submitted:', txHash)
  },
  onTransactionConfirmed: (receipt: any) => {
    console.log('Transaction confirmed:', receipt)
  },
  onError: (error: Error) => {
    console.error('Error occurred:', error)
  }
})
```

## Parameter Type Reference

| Method | Password Parameter Type |
|--------|------------------------|
| `deposit` | ✅ Auto-generated private key |
| `withdraw` | ✅ Private key (string) |
| `getVaultInfo` | ✅ Private key (string) |
| `refund` | ✅ Private key (string) |
| `completeTask` | ⚠️ uint256 password (bigint) |
| `getBountyTasks` | N/A |

## Complete Example

### Vue 3 + Pinia

```typescript
// stores/sdkStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PrivateTransferSDK } from 'zama-private-transfer'
import { initSDK, createInstance, SepoliaConfig} from '@zama-fhe/relayer-sdk/web'
export const useSDKStore = defineStore('sdk', () => {
  const sdkInstance = ref<PrivateTransferSDK | null>(null)
  const isInitialized = ref(false)

  async function initialize(provider: any) {
    if (isInitialized.value) return
    await initSDK()
    const instance = await createInstance(SepoliaConfig);
    const sdk = new PrivateTransferSDK()
    await sdk.initialize(instance, window.ethereum)
    sdkInstance.value = sdk
    isInitialized.value = true
  }

  async function getSDK() {
    if (!sdkInstance.value) throw new Error('SDK not initialized')
    return sdkInstance.value
  }

  return { initialize, getSDK, isInitialized }
})
```

```vue
<!-- Component usage -->
<script setup lang="ts">
import { useSDKStore } from '@/stores/sdkStore'
import { TransferType } from 'zama-private-transfer'

const sdkStore = useSDKStore()

async function connect() {
  await sdkStore.initialize(window.ethereum)
}

async function deposit() {
  const sdk = await sdkStore.getSDK()
  const result = await sdk.deposit({
    transferType: TransferType.ANYONE_WITH_PASSWORD,
    amount: '0.1'
  })

  // ⚠️ Save private key
  localStorage.setItem('privateKey', result.privateKey)
  alert('Private Key: ' + result.privateKey)
}

async function withdraw() {
  const sdk = await sdkStore.getSDK()
  const privateKey = localStorage.getItem('privateKey')

  await sdk.withdraw({
    privateKey: privateKey!,
    amount: '0.05'
  })
}
</script>
```

## FAQ

### 1. WASM initialization failed?

Ensure these files exist in `public/wasm/`:
- `tfhe_bg.wasm`
- `kms_lib_bg.wasm`

### 2. Cannot find SDK in monorepo?

```bash
# Run at project root
npm install
cd sdk && npm run build
```

### 3. completeTask parameter error?

```typescript
// ❌ Wrong
await sdk.completeTask({
  task: task,
  password: 'private-key-string'  // Wrong!
})

// ✅ Correct
await sdk.completeTask({
  task: task,
  password: task.password  // Use task.password (bigint)
})
```

### 4. What if I lose the private key?

Private key cannot be recovered. Funds will be locked forever. Keep it safe!

## Contract Info

- **Network**: Sepolia Testnet
- **Contract**: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`

- Website: [Zama](https://zama.zamaprivatetransfer.xyz/)
- GitHub: [SDK Repo](https://github.com/NextInscription/zama-program)
## License
MIT
