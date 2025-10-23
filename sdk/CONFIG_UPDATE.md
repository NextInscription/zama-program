# 配置更新说明

## 更新内容

SDK 现在直接使用 `@zama-fhe/relayer-sdk/web` 提供的官方 `SepoliaConfig`，而不是维护自定义的配置。

## 更改详情

### 之前的实现

```typescript
// src/constants.ts
export const SEPOLIA_FHE_CONFIG: FHEConfig = {
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  // ... 其他配置
};

// src/types.ts
export interface FHEConfig {
  aclContractAddress: string;
  // ... 其他字段
}
```

### 现在的实现

```typescript
// src/constants.ts
import { SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export const SEPOLIA_FHE_CONFIG = SepoliaConfig;

// src/types.ts
// FHEConfig 接口已移除，直接使用 Zama SDK 的类型

// src/index.ts
export { SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
```

## 优势

### 1. **配置同步**
- 自动与 Zama SDK 的最新配置保持同步
- 无需手动更新配置值
- 避免配置不一致导致的问题

### 2. **减少维护负担**
- 不需要维护重复的配置定义
- 配置更新由 Zama SDK 团队负责
- 减少代码量和潜在错误

### 3. **类型安全**
- 使用 Zama SDK 提供的官方类型
- 确保类型定义的准确性

### 4. **用户友好**
- 用户可以直接从我们的 SDK 导入 `SepoliaConfig`
- 也可以直接从 Zama SDK 导入，两者完全一致

## 使用方式

### 方式 1: 从我们的 SDK 导入（推荐）

```typescript
import { PrivateTransferSDK, SepoliaConfig } from '@zama-private-transfer/sdk';

// SDK 内部自动使用正确的配置
const sdk = new PrivateTransferSDK({
  contractAddress: '0x...',
});
await sdk.initialize(window.ethereum);

// 如果需要查看配置
console.log('Sepolia Config:', SepoliaConfig);
```

### 方式 2: 从 Zama SDK 导入

```typescript
import { SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { PrivateTransferSDK } from '@zama-private-transfer/sdk';

// 配置是同一个对象
console.log('Config:', SepoliaConfig);
```

### 方式 3: 使用内部常量

```typescript
import { SEPOLIA_FHE_CONFIG } from '@zama-private-transfer/sdk';

// SEPOLIA_FHE_CONFIG === SepoliaConfig
console.log('Config:', SEPOLIA_FHE_CONFIG);
```

## 配置内容

Zama SDK 提供的 Sepolia 配置包含以下内容：

```typescript
{
  // ACL Contract Address (FHEVM Host chain)
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',

  // KMS Verifier Contract Address (FHEVM Host chain)
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',

  // Input Verifier Contract Address (FHEVM Host chain)
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',

  // Decryption Address (Gateway chain)
  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',

  // Input Verification Address (Gateway chain)
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',

  // FHEVM Host chain id
  chainId: 11155111,

  // Gateway chain id
  gatewayChainId: 55815,

  // RPC provider to host chain
  network: 'https://eth-sepolia.public.blastapi.io',

  // Relayer URL
  relayerUrl: 'https://relayer.testnet.zama.cloud',
}
```

## 测试验证

运行以下命令测试配置：

```bash
# 启动开发服务器
./START.sh

# 在浏览器中访问
# http://localhost:5173/test-config.html
```

这将显示完整的配置信息并验证配置正确性。

## 迁移指南

### 对于 SDK 用户

**大多数用户无需任何更改**，SDK 会自动使用正确的配置。

如果你之前直接使用了 `FHEConfig` 类型：

```typescript
// ❌ 旧代码（不再可用）
import { FHEConfig } from '@zama-private-transfer/sdk';
const config: FHEConfig = { ... };

// ✅ 新代码（推荐）
import { SepoliaConfig } from '@zama-private-transfer/sdk';
// 或者
import { SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

// 直接使用官方配置
console.log(SepoliaConfig);
```

### 对于 SDK 维护者

- `src/types.ts` 中的 `FHEConfig` 接口已移除
- `src/constants.ts` 现在导入并重新导出 `SepoliaConfig`
- `src/index.ts` 重新导出 `SepoliaConfig` 供用户使用

## 相关文件

- `src/constants.ts` - 配置定义
- `src/index.ts` - 导出配置
- `src/types.ts` - 类型定义（已移除 FHEConfig）
- `CHANGELOG.md` - 变更日志
- `test-config.html` - 配置测试页面

## 版本信息

- 更新版本: 1.0.1
- 更新日期: 2024-10-23
- 兼容性: 完全向后兼容（除非直接使用了 FHEConfig 类型）
