# DepositResult 接口更新

## 📋 更新概述

更新了 `deposit()` 方法的返回结果 `DepositResult` 接口，移除了 `passwordWallet` 对象，直接返回所有必要的字段。

## ✅ 更改内容

### 之前的接口

```typescript
interface DepositResult {
  transactionHash: string;
  passwordWallet: GeneratedWallet;  // 包含 privateKey, address, wallet
  blockNumber?: number;
}
```

### 现在的接口

```typescript
interface DepositResult {
  transactionHash: string;
  password: bigint;            // 密码 uint256 格式
  privateKey: string;          // 密码私钥
  passwordAddress: string;     // 密码钱包地址
  recipientAddress: string;    // 接收者地址
  blockNumber?: number;
}
```

## 🎯 主要改进

### 1. **扁平化结构**
- 移除嵌套的 `passwordWallet` 对象
- 所有字段直接在顶层，更易访问

### 2. **新增字段**

#### `password: bigint`
- 密码的 uint256 格式
- 可用于合约调用或其他需要 bigint 的场景

#### `recipientAddress: string`
- 转账的目标接收者地址
- Type 1: 指定的接收者地址
- Type 2: 黑洞地址 (0x0000...0000)
- Type 3: 委托接收者地址

### 3. **更清晰的字段命名**
- `privateKey` - 密码私钥（用于提款）
- `passwordAddress` - 密码钱包地址

## 📊 使用示例

### Type 1: 指定接收者

```typescript
const result = await sdk.deposit({
  transferType: TransferType.SPECIFIED_RECIPIENT,
  amount: '0.1',
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
});

console.log('交易哈希:', result.transactionHash);
console.log('密码 (uint256):', result.password.toString());
console.log('密码私钥:', result.privateKey);          // 保存这个！
console.log('密码地址:', result.passwordAddress);
console.log('接收者地址:', result.recipientAddress);  // 0x742d35...
```

### Type 2: 任何人凭密码

```typescript
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.05',
});

console.log('密码 (uint256):', result.password.toString());
console.log('密码私钥:', result.privateKey);          // 保存这个！
console.log('接收者地址:', result.recipientAddress);  // 0x0000000000000000000000000000000000000000
```

### Type 3: 委托提款

```typescript
const result = await sdk.deposit({
  transferType: TransferType.ENTRUSTED_WITHDRAWAL,
  amount: '0.2',
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
});

console.log('密码 (uint256):', result.password.toString());
console.log('密码私钥:', result.privateKey);          // 保存这个！
console.log('接收者地址:', result.recipientAddress);  // 0x742d35...
```

## 🔄 迁移指南

### 之前的代码

```typescript
const result = await sdk.deposit({...});

// 访问嵌套字段
const privateKey = result.passwordWallet.privateKey;
const address = result.passwordWallet.address;
```

### 现在的代码

```typescript
const result = await sdk.deposit({...});

// 直接访问顶层字段
const privateKey = result.privateKey;
const address = result.passwordAddress;

// 新增字段
const password = result.password;              // bigint 格式
const recipient = result.recipientAddress;     // 接收者地址
```

## 📝 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `transactionHash` | `string` | 交易哈希 |
| `password` | `bigint` | 密码的 uint256 格式 |
| `privateKey` | `string` | 密码私钥（用于提款，必须保存） |
| `passwordAddress` | `string` | 密码钱包地址 |
| `recipientAddress` | `string` | 接收者地址（根据转账类型不同而不同） |
| `blockNumber` | `number?` | 区块号（可选） |

## ⚠️ 重要提示

1. **必须保存 `privateKey`**
   - 这是提款的唯一凭证
   - 丢失将无法找回资金

2. **`password` 字段**
   - 这是 `privateKey` 的 uint256 表示
   - 两者本质相同，只是格式不同
   - `password = BigInt(privateKey)`

3. **`recipientAddress` 说明**
   - Type 1: 用户指定的地址
   - Type 2: 黑洞地址 `0x0000000000000000000000000000000000000000`
   - Type 3: 委托接收者地址

## 🧪 测试

运行测试页面验证更改：

```bash
./START.sh
```

访问 `http://localhost:5173/test-debug.html`，测试存款功能，控制台会显示所有返回字段。

## 📦 构建信息

- ✅ TypeScript 类型检查通过
- ✅ 构建成功
- ✅ 文档已更新（README.md 和 README.zh-CN.md）
- ✅ 测试页面已更新

## 🎉 总结

这次更新简化了返回结构，使得字段访问更直接，同时提供了更多有用的信息（password uint256 和 recipientAddress）。对用户来说，代码更简洁，信息更全面。
