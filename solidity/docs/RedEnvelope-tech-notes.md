# RedEnvelope 合约技术说明

## 1. 项目概览
- 合约路径：`contracts/RedEnvelope/RedEnvelope.sol`
- 主要职责：在 FHEVM 环境下接收密文红包、触发同态解密请求，并将明文结果通过回调写回链上。
- 关键特性：
  - 使用 `@fhevm/solidity` 提供的 `FHE` 库管理密文类型（`euint256`）。
  - 集成 Zama 提供的 Sepolia 配置（`SepoliaConfig`），自动设置 Coprocessor、ACL、DecryptionOracle、KMSVerifier 地址。
  - 支持外部密文写入 (`setRandom`) 与链上平凡加密 (`setRandomFromPlain`)。
  - 通过 `FHE.requestDecryption` 异步请求解密，并在 `fulfillDecryption` 回调中校验签名、记录明文。

## 2. 依赖环境
1. Hardhat + `@fhevm/hardhat-plugin`（提供 FHEVM mock 引擎、helper API）。
2. Node 18+，建议使用项目自带的 `package-lock.json` 安装依赖。
3. 若运行本地测试，Hardhat 默认使用插件内置的 mock coprocessor/KMS/relayer。
4. 线上或 devnet 部署需确保网络支持 FHEVM，并配置真实的 relayer/KMS 服务。

## 3. 合约设计要点
### 3.1 状态变量与事件
- `encryptedGift`：存储密文红包（`euint256` 类型）。
- `requestInitiator` / `decryptedAmounts` / `requestHandled`：追踪解密请求的发起人、解密结果以及是否已经处理。
- 事件：
  - `EnvelopeUpdated`：每次写入或更新密文时触发，方便监听最新密文本。
  - `DecryptionRequested`：调用 `FHE.requestDecryption` 后立刻触发，记录 requestID 与发起者。
  - `EnvelopeDecrypted`：回调 `fulfillDecryption` 执行成功后触发，携带请求方、明文金额。

### 3.2 写入流程
1. `setRandom(externalEuint256, bytes)`：
   - 使用 `FHE.fromExternal` 将外部密文 handle + proof 验证后存储。
   - 调用 `FHE.allowThis` 与 `FHE.allow`，确保合约自身及调用者在当前交易可以访问该密文。
2. `setRandomFromPlain(uint256)`：
   - 使用 `FHE.asEuint256` 做平凡加密，适用于测试或快速演示。
   - 同样触发授权 + `EnvelopeUpdated` 事件。

### 3.3 解密流程
1. 用户调用 `requestGiftDecryption()`：
   - 先检查 `encryptedGift` 是否初始化。
   - 将密文句柄转为 `bytes32[]`，传入 `FHE.requestDecryption(handles, callbackSelector)`。
   - 该调用会：
     - 在 ACL 中登记允许解密权限。
     - 触发 `DecryptionOracle` 事件，返回 `requestID`。
   - 合约记录请求者地址并触发 `DecryptionRequested` 事件。

2. 链下 relayer/KMS：
   - 监听解密请求事件。
   - 调用 KMS 获取明文并生成 EIP-712 签名。
   - 以 relayer 身份调用合约的 `fulfillDecryption`。

3. `fulfillDecryption(uint256, bytes, bytes)` 回调：
   - 校验请求尚未处理。
   - 调用 `FHE.checkSignatures` 验证 KMS 签名（防止伪造明文）。
   - 解码明文（`abi.decode(cleartexts, (uint256))`），写入 `decryptedAmounts`，标记处理完成。
   - 触发 `EnvelopeDecrypted` 事件。
   - **注意**：为了兼容 mock relayer，该函数没有限制 `msg.sender` 必须等于官方 Decryption Oracle 地址；如需上线加强安全，可额外校验 `msg.sender`。

4. `getDecryptedAmount(uint256)`：
   - 发起者或其他调用者可在回调完成后读取明文。
   - 若解密尚未完成会 revert（`RedEnvelope: decryption pending`）。

## 4. 本地测试流程
示例测试脚本：`test/RedEnvelope.ts`

1. `setRandom` / `setRandomFromPlain` 测试：
   - 使用 `fhevm.createEncryptedInput(...).encrypt()` 生成密文。
   - 调用合约后通过 `fhevm.userDecryptEuint` 验证返回值与明文一致。

2. 解密流程测试：
   - 调用 `requestGiftDecryption()` 并记录 `requestID` 与事件。
   - 调用 `await fhevm.awaitDecryptionOracle();`
     - 这是插件提供的 mock relayer 调用，会自动处理所有待解密请求并调用回调函数。
   - 检查 `getDecryptedAmount(requestID)`、`EnvelopeDecrypted` 事件是否存在。

3. 运行命令：
   ```bash
   npx hardhat test test/RedEnvelope.ts
   ```
   **备注**：首次运行可能需要 Hardhat 创建配置目录；若出现权限问题，可在提示的路径上添加写权限。

## 5. 与线上环境的差异
- 本地 mock 环境：
  - 同态运算、解密、签名全部由插件内置逻辑完成。
  - `fhevm.awaitDecryptionOracle()` 会同步处理所有请求，通常数百毫秒内完成。
- 线上 / 官方 devnet：
  - 要部署真实的 Coprocessor、ACL、DecryptionOracle、KMSVerifier，并运行 relayer 服务。
  - 请求与回调之间存在网络延迟；需要保证 relayer 有足够 gas 和正确的私钥。
  - 签名验证对 KMS signer 与链上地址严格匹配，部署时务必使用官方提供的配置。

## 6. 常见问题
### 6.1 `EnvelopeDecrypted` 没触发
- 检查是否执行了 `await fhevm.awaitDecryptionOracle()`（在本地）或确保线上 relayer 正常运行。
- 确认 `requestGiftDecryption` 发出的 `DecryptionRequested` 事件包含正确的 handle。
- 查看回调交易的日志，可通过 `queryFilter` 查询 `EnvelopeDecrypted`。

### 6.2 `await fhevm.awaitDecryptionOracle()` 是什么
- 它不是部署操作，而是通知 **mock relayer** 去扫描未完成的解密请求并执行回调。
- 未调用时，只会看到 `DecryptionRequested` 事件，明文永远不会写回链上。

### 6.3 事件 topics 解析
- 事件中的地址通常在 topics 数组里，需要剥掉前导零再通过 `ethers.getAddress` 转成常规地址：
  ```ts
  const requesterTopic = log.topics[2];
  const requester = ethers.getAddress("0x" + requesterTopic.slice(26));
  ```
- `requestID` 这类 uint256 可以直接使用 `ethers.toBigInt(log.topics[index])` 读取。

### 6.4 调试建议
- 使用 `console.log` 打印 `requestID` 和相关地址，结合 `queryFilter` 交叉验证事件。
- Hardhat 控制台中执行 `await fhevm.parseDecryptionRequestEvents(receipt.logs)` 能快速定位解密请求内容。
- 如果回调 revert，可借助 `fhevm.tryParseFhevmError(err)` 获取更友好的错误描述。

## 7. 上线建议
1. 在官方 devnet（或目标链的 FHEVM 环境）完整跑一遍流程，确保 oracle 地址、KMS 配置无误。
2. 如需限制回调调用者，可在 `fulfillDecryption` 里重新启用 `require(msg.sender == decryptionOracle, ...)` 并确保 relayer 使用官方地址。
3. 监控 `DecryptionRequested` / `EnvelopeDecrypted` 事件，方便排查线上问题。
4. 对重要数据增加链上存证或 off-chain 审计，以防回调延迟导致业务流程阻塞。

---

如需扩展更多功能（例如多红包支持、领取权限控制、批量解密等），可以在本说明的基础上添加额外状态和流程，保持与 FHEVM API 的兼容即可。
