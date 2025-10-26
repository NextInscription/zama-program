# SDK Integration Guide

本文档说明如何在前端项目中使用 `@zama-private-transfer/sdk`。

## 已完成的集成工作

### 1. 创建了 SDK 管理模块

**文件**: `src/stores/sdk.ts`

这个模块提供了：
- SDK 实例的单例管理
- 自动初始化和重新初始化
- 与钱包的集成

使用示例：
```typescript
import { useSDK } from '../stores/sdk'

const { getSDK, reinitialize } = useSDK()

// 获取 SDK 实例
const sdk = await getSDK()

// 重新初始化（当钱包连接变化时）
await reinitialize()
```

### 2. 重构了三个主要组件

#### Deposit.vue
- **简化前**: ~200 行复杂的 FHE 加密代码
- **简化后**: 使用 SDK 的 `deposit()` 方法，代码减少到约 50 行

主要变化：
```typescript
// 之前：手动创建 FHE 实例、加密、调用合约
const fheInstance = await createInstance(SepoliaConfig)
const input = fheInstance.createEncryptedInput(...)
// ... 很多加密逻辑

// 现在：直接使用 SDK
const result = await sdk.deposit({
  transferType: transferType.value,
  amount: amount.value,
  recipientAddress: allowAddress.value,
})
```

#### Withdraw.vue
- **简化前**: ~150 行包含解密和合约调用的代码
- **简化后**: 使用 SDK 的 `getVaultInfo()` 和 `withdraw()` 方法

主要变化：
```typescript
// 获取 vault 信息
const vault = await sdk.getVaultInfo(privateKey.value)

// 提款
const result = await sdk.withdraw({
  privateKey: privateKey.value,
  amount: withdrawAmount.value,
})

// 退款
const result = await sdk.refund({
  privateKey: privateKey.value,
})
```

#### BountyList.vue
- **简化前**: 手动调用合约获取任务和费率
- **简化后**: 使用 SDK 的 `getBountyTasks()` 和 `completeTask()` 方法

主要变化：
```typescript
// 获取赏金任务
const tasks = await sdk.getBountyTasks()

// 获取费率
const feeRate = await sdk.getFeeRate()

// 完成任务
const result = await sdk.completeTask({
  task: task,
  password: task.password,
})
```

## 测试步骤

### 1. 安装依赖

首先确保 SDK 已构建：
```bash
cd sdk
npm install
npm run build
```

然后安装前端依赖：
```bash
cd ../frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试功能

#### 存款测试
1. 连接 MetaMask 钱包（确保在 Sepolia 测试网）
2. 选择转账类型（Type 1/2/3）
3. 输入金额和接收地址（如需要）
4. 点击 "Continue to Deposit"
5. 保存生成的私钥
6. 确认交易

#### 提款测试
1. 输入之前保存的私钥
2. 点击 "Load Vault Information"
3. 输入提款金额
4. 点击 "Withdraw"

#### 赏金任务测试
1. 查看可用的赏金任务
2. 选择一个任务
3. 点击 "Complete Task"

## SDK 的优势

### 代码简化
- **减少了 70% 的样板代码**
- 不再需要手动处理 FHE 加密/解密
- 统一的错误处理

### 类型安全
- 完整的 TypeScript 类型定义
- IDE 自动补全支持
- 编译时类型检查

### 维护性
- SDK 升级时，前端代码无需大改
- 所有 FHE 相关逻辑集中在 SDK 中
- 更容易测试和调试

## SDK API 概览

### PrivateTransferSDK

```typescript
class PrivateTransferSDK {
  // 初始化
  static initializeWasm(wasmPaths?: { tfheParams?: string; kmsParams?: string }): Promise<void>
  initialize(provider?: any): Promise<void>

  // 核心功能
  deposit(params: DepositParams): Promise<DepositResult>
  withdraw(params: WithdrawParams): Promise<WithdrawResult>
  refund(params: RefundParams): Promise<RefundResult>

  // 查询
  getVaultInfo(password: string): Promise<VaultInfo>
  getBountyTasks(): Promise<BountyTask[]>
  getFeeRate(): Promise<number>

  // 赏金任务
  completeTask(params: CompleteTaskParams): Promise<CompleteTaskResult>

  // 工具
  generatePasswordWallet(): GeneratedWallet
  setCallbacks(callbacks: SDKEventCallbacks): void
}
```

## 故障排除

### WASM 加载失败
确保 `vite.config.ts` 中已配置 `copyWasmPlugin()`:
```typescript
import { copyWasmPlugin } from '@zama-private-transfer/sdk'

export default defineConfig({
  plugins: [
    vue(),
    copyWasmPlugin()
  ],
})
```

### SDK 初始化失败
检查 `main.ts` 中的 WASM 初始化：
```typescript
import { initSDK } from '@zama-fhe/relayer-sdk/web'

initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
```

### 钱包连接问题
确保在调用 SDK 方法前重新初始化：
```typescript
await reinitialize()  // 确保使用最新的钱包连接
const sdk = await getSDK()
```

## 下一步

- 添加更多错误处理
- 实现交易进度追踪
- 添加单元测试
- 优化用户体验

## 文件变更总结

### 新增文件
- `src/stores/sdk.ts` - SDK 管理模块

### 修改文件
- `src/components/Deposit.vue` - 使用 SDK
- `src/components/Withdraw.vue` - 使用 SDK
- `src/components/BountyList.vue` - 使用 SDK

### 删除的依赖
组件中不再直接导入：
- `@zama-fhe/relayer-sdk/web` 的 `createInstance` 和 `SepoliaConfig`
- 合约 ABI 和地址（SDK 内部处理）
- 复杂的加密/解密逻辑
