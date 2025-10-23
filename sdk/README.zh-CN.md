# Zama 隐私转账 SDK

一个用于在 Sepolia 测试网上与 Zama 隐私转账智能合约交互的 TypeScript SDK。此 SDK 使用全同态加密（FHE）技术实现隐私保护的转账功能。

## 特性

- 🔐 **隐私存款**：三种存款方式
  - 类型 1：仅指定接收人可提取
  - 类型 2：任何知道密码的人都可提取
  - 类型 3：委托提款（带赏金）
- 💸 **提款**：使用密码验证的安全提款
- 🎯 **赏金任务**：完成委托提款并赚取佣金
- 💰 **退款**：存款人可以退款
- 🔒 **FHE 加密**：所有敏感数据使用 Zama 的 FHE 技术加密

## 安装

```bash
npm install @zama-private-transfer/sdk
# 或
yarn add @zama-private-transfer/sdk
```

## 快速开始

### 1. 初始化 SDK

```typescript
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

// 创建 SDK 实例
const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D', // 默认 Sepolia 地址
  rpcUrl: 'https://1rpc.io/sepolia', // 可选，默认为此值
});

// 使用浏览器钱包提供商初始化（例如 MetaMask）
await sdk.initialize(window.ethereum);
```

### 2. 进行存款

#### 类型 1：指定接收人

```typescript
const result = await sdk.deposit({
  transferType: TransferType.SPECIFIED_RECIPIENT,
  amount: '0.1', // ETH
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // 必需
});

console.log('交易哈希:', result.transactionHash);
console.log('密码私钥:', result.passwordWallet.privateKey);
console.log('密码地址:', result.passwordWallet.address);

// 重要：保存私钥！提款时需要它。
```

#### 类型 2：任何人凭密码

```typescript
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.05', // ETH
  // 不需要接收人地址 - 任何有密码的人都可以提款
});

// 保存密码私钥
console.log('密码密钥:', result.passwordWallet.privateKey);
```

#### 类型 3：委托提款（创建赏金）

```typescript
const result = await sdk.deposit({
  transferType: TransferType.ENTRUSTED_WITHDRAWAL,
  amount: '0.2', // ETH
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // 必需
});

// 这会创建一个受托人可以完成并获得佣金的赏金任务
console.log('使用密码创建的任务:', result.passwordWallet.privateKey);
```

### 3. 查看金库信息

```typescript
const vaultInfo = await sdk.getVaultInfo('your-password-here');

console.log('转账类型:', vaultInfo.transferType);
console.log('余额:', vaultInfo.balanceEth, 'ETH');
console.log('存款人:', vaultInfo.depositor);
console.log('接收人:', vaultInfo.allowAddress);
```

### 4. 提取资金

```typescript
const result = await sdk.withdraw({
  password: 'your-password-here',
  amount: '0.05', // 要提取的 ETH
});

console.log('提款成功:', result.transactionHash);
console.log('提取金额:', result.amount, 'ETH');
```

### 5. 获取赏金任务

```typescript
const tasks = await sdk.getBountyTasks();

tasks.forEach((task, index) => {
  console.log(`任务 ${index + 1}:`);
  console.log('  金额:', task.totalReward, 'ETH');
  console.log('  佣金:', task.commission, 'ETH');
});
```

### 6. 完成赏金任务

```typescript
const tasks = await sdk.getBountyTasks();
const task = tasks[0]; // 选择第一个任务

const result = await sdk.completeTask({
  task: task,
  password: 'task-password', // 任务创建者提供的密码
});

console.log('任务完成！');
console.log('获得佣金:', result.commission, 'ETH');
```

### 7. 退款存款

```typescript
const result = await sdk.refund({
  password: 'your-deposit-password',
});

console.log('退款成功:', result.transactionHash);
console.log('退款金额:', result.amount, 'ETH');
```

## 事件回调

您可以设置回调来跟踪交易进度：

```typescript
sdk.setCallbacks({
  onTransactionSubmitted: (txHash) => {
    console.log('交易已提交:', txHash);
  },
  onTransactionConfirmed: (receipt) => {
    console.log('交易已确认:', receipt);
  },
  onError: (error) => {
    console.error('错误:', error.message);
  },
});
```

## API 参考

### `PrivateTransferSDK`

#### 构造函数

```typescript
constructor(config: SDKConfig)
```

- `config.contractAddress`: 合约地址（默认：Sepolia 部署）
- `config.rpcUrl`: RPC URL（默认：https://1rpc.io/sepolia）
- `config.provider`: 可选的预配置提供商
- `config.signer`: 可选的预配置签名者

#### 方法

##### `initialize(provider?: any): Promise<void>`

使用钱包提供商初始化 SDK（例如 MetaMask 的 window.ethereum）。

##### `deposit(params: DepositParams): Promise<DepositResult>`

进行存款。

##### `getVaultInfo(password: string): Promise<VaultInfo>`

通过密码获取金库信息。

##### `withdraw(params: WithdrawParams): Promise<WithdrawResult>`

从金库提取资金。

##### `getBountyTasks(): Promise<BountyTask[]>`

获取所有可用的赏金任务。

##### `completeTask(params: CompleteTaskParams): Promise<CompleteTaskResult>`

完成赏金任务。

##### `refund(params: RefundParams): Promise<RefundResult>`

退款存款。

##### `getFeeRate(): Promise<number>`

获取当前佣金费率。

##### `generatePasswordWallet(): GeneratedWallet`

生成随机密码钱包。

##### `getContractAddress(): string`

获取合约地址。

##### `getSignerAddress(): Promise<string | null>`

获取当前签名者地址。

## 类型

### `TransferType`

```typescript
enum TransferType {
  SPECIFIED_RECIPIENT = 1,    // 仅指定接收人可以提款
  ANYONE_WITH_PASSWORD = 2,   // 任何有密码的人都可以提款
  ENTRUSTED_WITHDRAWAL = 3,   // 受托人为接收人提款
}
```

## 示例

### React 完整示例

```typescript
import { useState } from 'react';
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

function App() {
  const [sdk, setSdk] = useState<PrivateTransferSDK | null>(null);
  const [passwordKey, setPasswordKey] = useState('');

  // 初始化 SDK
  const connectWallet = async () => {
    const newSdk = new PrivateTransferSDK({
      contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
    });

    await newSdk.initialize(window.ethereum);
    setSdk(newSdk);
  };

  // 进行存款
  const makeDeposit = async () => {
    if (!sdk) return;

    const result = await sdk.deposit({
      transferType: TransferType.ANYONE_WITH_PASSWORD,
      amount: '0.01',
    });

    // 重要：保存这个密钥！
    setPasswordKey(result.passwordWallet.privateKey);
    alert('存款成功！保存您的密码密钥：' + result.passwordWallet.privateKey);
  };

  // 提款
  const withdraw = async () => {
    if (!sdk || !passwordKey) return;

    const result = await sdk.withdraw({
      password: passwordKey,
      amount: '0.01',
    });

    alert('提款成功！');
  };

  return (
    <div>
      <button onClick={connectWallet}>连接钱包</button>
      <button onClick={makeDeposit}>存入 0.01 ETH</button>
      <button onClick={withdraw}>提款</button>
      {passwordKey && <div>密码密钥：{passwordKey}</div>}
    </div>
  );
}
```

### Vue 3 完整示例

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
  alert('存款成功！');
};

const withdraw = async () => {
  if (!sdk.value || !passwordKey.value) return;

  await sdk.value.withdraw({
    password: passwordKey.value,
    amount: '0.01',
  });

  alert('提款成功！');
};
</script>

<template>
  <div>
    <button @click="connectWallet">连接钱包</button>
    <button @click="makeDeposit">存入 0.01 ETH</button>
    <button @click="withdraw">提款</button>
    <div v-if="passwordKey">密码密钥：{{ passwordKey }}</div>
  </div>
</template>
```

## 安全注意事项

1. **保存密码密钥**：生成的密码私钥是访问存入资金的唯一方式。如果丢失，资金将无法恢复。

2. **切勿分享私钥**：保持密码密钥的安全，切勿公开分享。

3. **仅限测试网**：目前部署在 Sepolia 测试网上。未经适当审计，请勿用于主网。

4. **密码安全**：使用类型 2（任何人凭密码）创建存款时，请使用强而独特的密码。

## 合约信息

- **网络**：Sepolia 测试网
- **合约地址**：`0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`
- **RPC URL**：`https://1rpc.io/sepolia`

## 开发

```bash
# 安装依赖
npm install

# 构建 SDK
npm run build

# 类型检查
npm run typecheck

# 监听模式
npm run dev
```

## 许可证

MIT

## 支持

如有问题和疑问，请在 GitHub 上提交 issue。
