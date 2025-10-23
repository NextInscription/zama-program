# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2024-10-23

### Changed
- **参数统一为 privateKey**: 大部分方法参数从 `password` 改为 `privateKey`
  - `WithdrawParams.password` → `WithdrawParams.privateKey`
  - `RefundParams.password` → `RefundParams.privateKey`
  - `getVaultInfo(password)` → `getVaultInfo(privateKey)`
  - **注意**: `CompleteTaskParams` 保持使用 `password: bigint`（受托人无法获得私钥）

### Fixed
- 修正了内部转换逻辑，直接使用 `BigInt(privateKey)` 而不是错误的 `keccak256` 转换

### Benefits
- 参数命名更清晰，明确表示这是以太坊私钥
- 内部转换逻辑更简单直接
- 与 deposit 返回的 `privateKey` 命名一致
- 避免与普通文本密码混淆

### Migration Guide
```typescript
// 之前
await sdk.withdraw({ password: key, amount: '0.1' });
await sdk.refund({ password: key });

// 现在
await sdk.withdraw({ privateKey: key, amount: '0.1' });
await sdk.refund({ privateKey: key });

// completeTask 保持不变（使用 bigint password）
await sdk.completeTask({ task, password: task.password });
```

## [1.0.2] - 2024-10-23

### Changed
- **DepositResult 接口更新**: 移除了 `passwordWallet` 嵌套对象，改为直接返回所有字段
  - 新增 `password: bigint` - 密码的 uint256 格式
  - 新增 `privateKey: string` - 密码私钥（替代 passwordWallet.privateKey）
  - 新增 `passwordAddress: string` - 密码钱包地址（替代 passwordWallet.address）
  - 新增 `recipientAddress: string` - 接收者地址

### Benefits
- 扁平化的返回结构，字段访问更直接
- 提供更多有用信息（password uint256 和 recipientAddress）
- 代码更简洁，信息更全面

### Migration Guide
```typescript
// 之前
const result = await sdk.deposit({...});
const privateKey = result.passwordWallet.privateKey;
const address = result.passwordWallet.address;

// 现在
const result = await sdk.deposit({...});
const privateKey = result.privateKey;
const address = result.passwordAddress;
const password = result.password;              // 新增
const recipient = result.recipientAddress;     // 新增
```

## [1.0.1] - 2024-10-23

### Changed
- **使用 Zama SDK 官方配置**: `SEPOLIA_FHE_CONFIG` 现在直接使用 `@zama-fhe/relayer-sdk/web` 导出的 `SepoliaConfig`
- 移除了自定义的 `FHEConfig` 类型定义
- 从主入口点重新导出 `SepoliaConfig`，方便用户使用

### Benefits
- 确保与 Zama SDK 的配置始终同步
- 减少维护负担，避免配置不一致
- 用户可以直接使用官方配置

### Migration Guide
如果你之前使用了 `FHEConfig` 类型：

```typescript
// 之前 (不再支持)
import { FHEConfig } from '@zama-private-transfer/sdk';

// 现在 (推荐)
import { SepoliaConfig } from '@zama-private-transfer/sdk';
// 或者直接从 Zama SDK 导入
import { SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
```

**注意**: 大多数用户不需要直接访问配置，SDK 会自动使用正确的配置。

## [1.0.0] - 2024-10-23

### Added
- 初始版本发布
- 支持三种转账类型（指定接收人、密码提取、委托提取）
- 自动 WASM 初始化
- 完整的 TypeScript 类型支持
- 局域网调试支持
- 详细的文档和示例
