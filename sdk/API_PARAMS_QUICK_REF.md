# API 参数快速参考

## 📋 参数类型总览

| 方法 | 参数类型 | 参数格式 | 说明 |
|------|---------|---------|------|
| `deposit()` | - | - | 无需密码参数 |
| `withdraw()` | `privateKey` | `string` | 私钥（0x开头） |
| `refund()` | `privateKey` | `string` | 私钥（0x开头） |
| `completeTask()` | `password` | `bigint` | uint256 格式 |
| `getVaultInfo()` | `privateKey` | `string` | 私钥（0x开头） |

## 🔑 privateKey vs password

### privateKey (string)
```typescript
'0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
```
- 格式：0x 开头的 64 字符十六进制字符串
- 用途：存款人自己操作（withdraw, refund）
- 来源：deposit 返回的 `result.privateKey`

### password (bigint)
```typescript
123456789012345678901234567890n
```
- 格式：bigint 数字
- 用途：受托人完成任务
- 来源：deposit 返回的 `result.password` 或 task 的 `task.password`

## 📝 使用示例

### 存款
```typescript
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.1',
});

// 保存这两个值
const privateKey = result.privateKey;  // 私钥（string）
const password = result.password;      // uint256（bigint）
```

### 查询金库
```typescript
// 使用 privateKey（string）
const vaultInfo = await sdk.getVaultInfo(privateKey);
```

### 提款
```typescript
// 使用 privateKey（string）
await sdk.withdraw({
  privateKey: privateKey,  // ✅ string
  amount: '0.05',
});
```

### 退款
```typescript
// 使用 privateKey（string）
await sdk.refund({
  privateKey: privateKey,  // ✅ string
});
```

### 完成委托任务
```typescript
// 获取任务列表
const tasks = await sdk.getBountyTasks();
const task = tasks[0];

// 使用 password（bigint）
await sdk.completeTask({
  task: task,
  password: task.password,  // ✅ bigint
});
```

## ⚠️ 常见错误

### ❌ 错误 1：类型混用
```typescript
// 错误：withdraw 使用 bigint
await sdk.withdraw({
  privateKey: 123456789n,  // ❌ 类型错误
  amount: '0.1',
});

// 正确
await sdk.withdraw({
  privateKey: '0xabc...',  // ✅ string
  amount: '0.1',
});
```

### ❌ 错误 2：completeTask 使用 privateKey
```typescript
// 错误：受托人不应该知道私钥
await sdk.completeTask({
  task: task,
  privateKey: '0xabc...',  // ❌ 参数名错误
});

// 正确：使用 password
await sdk.completeTask({
  task: task,
  password: task.password,  // ✅ bigint
});
```

### ❌ 错误 3：格式不正确
```typescript
// 错误：privateKey 格式不正确
await sdk.withdraw({
  privateKey: 'abc123',  // ❌ 缺少 0x 前缀
  amount: '0.1',
});

// 正确
await sdk.withdraw({
  privateKey: '0xabc123...',  // ✅ 正确格式
  amount: '0.1',
});
```

## 🔄 类型转换

如果需要在 privateKey 和 password 之间转换：

```typescript
// privateKey (string) → password (bigint)
const password = BigInt(privateKey);

// password (bigint) → privateKey (string)
const privateKey = '0x' + password.toString(16).padStart(64, '0');
```

## 📊 完整流程

```typescript
// 1. 存款
const depositResult = await sdk.deposit({...});
const privateKey = depositResult.privateKey;  // string
const password = depositResult.password;      // bigint

// 2. 查询（使用 privateKey）
await sdk.getVaultInfo(privateKey);

// 3a. 自己提款（使用 privateKey）
await sdk.withdraw({ privateKey, amount: '0.1' });

// 3b. 委托任务（受托人使用 password）
await sdk.completeTask({ task, password: task.password });

// 3c. 退款（使用 privateKey）
await sdk.refund({ privateKey });
```

## 🎯 记忆技巧

- **存款人操作**（自己的钱）→ 使用 `privateKey` (string)
  - withdraw
  - refund
  - getVaultInfo

- **受托人操作**（别人的钱）→ 使用 `password` (bigint)
  - completeTask

## 📚 类型定义

```typescript
// 私钥相关
interface WithdrawParams {
  privateKey: string;
  amount: string;
}

interface RefundParams {
  privateKey: string;
}

// Password 相关（受托人）
interface CompleteTaskParams {
  task: BountyTask;
  password: bigint;
}

// 返回值（两种都有）
interface DepositResult {
  privateKey: string;   // 存款人使用
  password: bigint;     // 受托人使用（如果是委托提款）
  // ... 其他字段
}
```
