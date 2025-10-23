# 参数更新：password → privateKey

## 📋 更新概述

所有需要密码的方法现在统一使用 `privateKey` 参数，而不是 `password`。私钥会在 SDK 内部自动转换为 uint256 格式与合约交互。

## ✅ 更改内容

### 更新的接口

#### 1. WithdrawParams
```typescript
// 之前
interface WithdrawParams {
  password: string;  // ❌
  amount: string;
}

// 现在
interface WithdrawParams {
  privateKey: string;  // ✅
  amount: string;
}
```

#### 2. RefundParams
```typescript
// 之前
interface RefundParams {
  password: string;  // ❌
}

// 现在
interface RefundParams {
  privateKey: string;  // ✅
}
```

#### 3. CompleteTaskParams（特殊情况）
```typescript
// CompleteTaskParams 保持使用 password (bigint)
// 因为受托人无法获得私钥，只能知道 password uint256
interface CompleteTaskParams {
  task: BountyTask;
  password: bigint;  // ✅ 保持不变
}
```

**注意**: CompleteTaskParams 是唯一保持使用 `password` 的接口，因为：
- 受托人完成任务时不应该知道私钥
- 只需要知道 password (uint256) 即可完成任务
- 这是委托提款机制的安全设计

### 更新的方法

#### 1. withdraw()
```typescript
// 之前
await sdk.withdraw({
  password: '0xabc...',  // ❌
  amount: '0.1',
});

// 现在
await sdk.withdraw({
  privateKey: '0xabc...',  // ✅
  amount: '0.1',
});
```

#### 2. refund()
```typescript
// 之前
await sdk.refund({
  password: '0xabc...',  // ❌
});

// 现在
await sdk.refund({
  privateKey: '0xabc...',  // ✅
});
```

#### 3. completeTask()（保持不变）
```typescript
// CompleteTaskParams 保持使用 password (bigint)
await sdk.completeTask({
  task: bountyTask,
  password: bountyTask.password,  // ✅ 使用 uint256 格式的 password
});
```

**注意**: 这个方法的参数没有改变，因为受托人只知道 password (uint256)，而不知道私钥。

#### 4. getVaultInfo()
```typescript
// 之前
await sdk.getVaultInfo('0xabc...');  // 参数名为 password

// 现在
await sdk.getVaultInfo('0xabc...');  // 参数名为 privateKey
```

## 🎯 主要改进

### 1. **语义更清晰**
- `privateKey` 明确表示这是一个以太坊私钥
- 避免与普通文本密码混淆

### 2. **内部转换优化**
```typescript
// 之前的错误实现
const passwordWallet = new Wallet(keccak256(Buffer.from(password)));
const passwordUint256 = BigInt(passwordWallet.privateKey);

// 现在的正确实现
const passwordUint256 = BigInt(privateKey);  // 直接转换
```

### 3. **逻辑更合理**
- deposit() 返回 `privateKey`
- withdraw/refund/completeTask 接收 `privateKey`
- 流程更自然，无需额外转换

## 📊 完整工作流程示例

### 存款 → 提款流程

```typescript
// 1. 存款
const depositResult = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.1',
});

// 保存私钥
const privateKey = depositResult.privateKey;
console.log('私钥:', privateKey);  // 0xabc123...

// 2. 查询金库
const vaultInfo = await sdk.getVaultInfo(privateKey);
console.log('余额:', vaultInfo.balanceEth);

// 3. 提款
const withdrawResult = await sdk.withdraw({
  privateKey: privateKey,  // 使用相同的私钥
  amount: '0.05',
});

// 4. 退款（如果需要）
const refundResult = await sdk.refund({
  privateKey: privateKey,  // 使用相同的私钥
});
```

### 委托提款流程

```typescript
// 1. 创建委托提款任务
const depositResult = await sdk.deposit({
  transferType: TransferType.ENTRUSTED_WITHDRAWAL,
  amount: '0.2',
  recipientAddress: '0x123...',
});

const privateKey = depositResult.privateKey;

// 2. 受托人获取任务列表
const tasks = await sdk.getBountyTasks();
const task = tasks[0];

// 3. 受托人完成任务（需要知道 privateKey）
const completeResult = await sdk.completeTask({
  task: task,
  privateKey: privateKey,  // 必须匹配任务的密码
});
```

## 🔄 迁移指南

### 代码迁移

所有使用 SDK 的代码需要更新参数名：

```typescript
// 旧代码
const result1 = await sdk.withdraw({ password: key, amount: '0.1' });
const result2 = await sdk.refund({ password: key });
const result3 = await sdk.completeTask({ task, password: key });

// 新代码（简单替换即可）
const result1 = await sdk.withdraw({ privateKey: key, amount: '0.1' });
const result2 = await sdk.refund({ privateKey: key });
const result3 = await sdk.completeTask({ task, privateKey: key });
```

### 自动迁移脚本

如果有大量代码需要迁移，可以使用以下脚本：

```bash
# 替换 withdraw
sed -i 's/password:/privateKey:/g' your-file.ts

# 或使用更精确的正则
sed -i 's/\bpassword:\s*/privateKey: /g' your-file.ts
```

## ⚠️ 重要说明

### 1. privateKey 的格式

`privateKey` 必须是一个有效的以太坊私钥格式：

```typescript
// ✅ 正确
'0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

// ❌ 错误
'my-password-123'  // 不是私钥格式
```

### 2. 安全性

```typescript
// ⚠️ 永远不要硬编码私钥
const privateKey = '0xabc...';  // ❌ 危险

// ✅ 从安全存储中获取
const privateKey = localStorage.getItem('privateKey');  // 仅用于开发
const privateKey = await secureStorage.get('privateKey');  // 生产环境
```

### 3. uint256 转换

SDK 内部自动处理转换：

```typescript
// SDK 内部实现
const passwordUint256 = BigInt(privateKey);

// 用户无需手动转换
await sdk.withdraw({ privateKey: '0xabc...' });  // SDK 自动转换
```

## 🧪 测试

运行测试页面验证更改：

```bash
./START.sh
```

访问 `http://localhost:5173/test-debug.html`

测试流程：
1. 连接 MetaMask
2. 执行存款，保存返回的 privateKey
3. 使用 privateKey 查询金库
4. 使用 privateKey 执行提款

## 📦 构建信息

- ✅ TypeScript 类型检查通过
- ✅ 构建成功
  - CJS: 24.77 KB
  - ESM: 23.22 KB
  - Types: 9.90 KB

## 🎉 总结

这次更新统一了参数命名，使 API 更加清晰和直观：
- ✅ 所有方法统一使用 `privateKey` 参数
- ✅ 内部转换逻辑更简单直接
- ✅ 语义更明确，避免混淆
- ✅ 与 deposit 结果命名一致

迁移非常简单，只需将 `password:` 改为 `privateKey:` 即可。
