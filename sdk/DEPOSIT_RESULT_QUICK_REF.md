# DepositResult 快速参考

## 接口定义

```typescript
interface DepositResult {
  transactionHash: string;    // 交易哈希
  password: bigint;           // 密码 (uint256)
  privateKey: string;         // 密码私钥 ⚠️ 必须保存
  passwordAddress: string;    // 密码钱包地址
  recipientAddress: string;   // 接收者地址
  blockNumber?: number;       // 区块号
}
```

## 字段说明

| 字段 | 类型 | 用途 | 示例 |
|------|------|------|------|
| `transactionHash` | `string` | 区块链交易哈希 | `"0xabc123..."` |
| `password` | `bigint` | 密码的 uint256 格式 | `123456789012345678n` |
| `privateKey` | `string` | 提款凭证（必须保存！） | `"0xdef456..."` |
| `passwordAddress` | `string` | 密码对应的钱包地址 | `"0x123abc..."` |
| `recipientAddress` | `string` | 接收者地址（见下表） | `"0x456def..."` |
| `blockNumber` | `number` | 交易所在区块 | `12345678` |

## recipientAddress 说明

| 转账类型 | recipientAddress 值 |
|---------|-------------------|
| Type 1: 指定接收者 | 用户指定的地址 |
| Type 2: 任何人凭密码 | `0x0000000000000000000000000000000000000000` (黑洞地址) |
| Type 3: 委托提款 | 委托接收者地址 |

## 使用示例

```typescript
// 存款
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.1',
});

// 访问返回值
console.log('交易:', result.transactionHash);
console.log('密码 uint256:', result.password.toString());
console.log('私钥:', result.privateKey);              // ⚠️ 保存这个
console.log('密码地址:', result.passwordAddress);
console.log('接收者:', result.recipientAddress);

// 提款时使用 privateKey
await sdk.withdraw({
  password: result.privateKey,  // 使用保存的私钥
  amount: '0.1',
});
```

## ⚠️ 重要提示

1. **必须保存 `privateKey`**
   - 这是提款的唯一凭证
   - 丢失将永久无法找回资金
   - 建议使用密码管理器或安全存储

2. **password 和 privateKey 关系**
   ```typescript
   password === BigInt(privateKey)  // true
   ```

3. **不同转账类型的使用**
   - Type 1: 只有 `recipientAddress` 可以提款
   - Type 2: 任何人知道 `privateKey` 都可以提款
   - Type 3: 受托人代 `recipientAddress` 提款

## 快速命令

```bash
# 测试
./START.sh

# 构建
npm run build

# 类型检查
npm run typecheck
```
