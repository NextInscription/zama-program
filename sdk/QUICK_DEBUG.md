# 🚀 快速调试指南

## 最快速的调试方式（推荐新手）

### 方式1: 使用测试页面（无需配置）

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk

# 1. 确保SDK已构建
npm run build

# 2. 启动开发服务器并打开测试页面
npm run debug
```

这会自动：
- 构建SDK
- 启动本地服务器
- 在浏览器中打开测试页面

然后你就可以：
1. 点击"连接 MetaMask"
2. 测试存款、提款、赏金任务
3. 查看实时日志
4. 使用浏览器开发者工具调试（F12）

---

## 方式2: 在前端项目中调试

如果你想在现有的前端项目中使用SDK：

### 步骤1: 链接本地SDK

```bash
# 在SDK目录
cd /home/ekko/Desktop/codes/zama-program/sdk
npm link

# 在前端目录
cd /home/ekko/Desktop/codes/zama-program/frontend
npm link @zama-private-transfer/sdk
```

### 步骤2: 开启SDK监听模式

在一个终端窗口：

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run dev
```

SDK代码修改后会自动重新编译。

### 步骤3: 启动前端开发服务器

在另一个终端窗口：

```bash
cd /home/ekko/Desktop/codes/zama-program/frontend
npm run dev
```

### 步骤4: 在前端中使用SDK

修改你的前端组件，例如 `frontend/src/components/Deposit.vue`：

```typescript
// 在文件开头添加
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

// 在 setup 中创建SDK实例
const sdk = new PrivateTransferSDK({
  contractAddress: CONTRACT_ADDRESS,
});

// 初始化
await sdk.initialize(walletProvider.value);

// 使用SDK方法替代原来的逻辑
const result = await sdk.deposit({
  transferType: TransferType.ANYONE_WITH_PASSWORD,
  amount: '0.01',
});
```

---

## 常用调试命令

```bash
# 在SDK目录

# 构建一次
npm run build

# 监听模式（自动重新构建）
npm run dev

# 类型检查
npm run typecheck

# 启动测试服务器
npm run test-server

# 构建并打开测试页面
npm run debug
```

---

## 浏览器调试技巧

### 打开开发者工具
按 `F12` 或右键 → 检查

### 查看日志
1. 打开 **Console** 标签
2. 所有 SDK 操作都会输出日志
3. 错误会显示为红色

### 设置断点
1. 打开 **Sources** 标签
2. 找到 SDK 代码（在 `webpack://` 或 `node_modules` 下）
3. 点击行号设置断点
4. 执行操作时代码会在断点处暂停

### 在代码中添加断点

在SDK代码中添加 `debugger;`：

```typescript
// src/PrivateTransferSDK.ts
async deposit(params: DepositParams) {
  debugger; // 浏览器会在这里暂停
  console.log('Deposit called', params);
  // ...
}
```

---

## 添加调试日志

### 方法1: 直接使用 console.log

```typescript
// src/PrivateTransferSDK.ts
async deposit(params: DepositParams) {
  console.log('[SDK] Deposit params:', params);
  console.log('[SDK] Contract:', this.config.contractAddress);

  // ... 业务逻辑

  console.log('[SDK] Transaction sent:', tx.hash);
}
```

### 方法2: 使用回调函数

```typescript
// 在你的应用中
sdk.setCallbacks({
  onTransactionSubmitted: (txHash) => {
    console.log('✅ TX:', txHash);
  },
  onTransactionConfirmed: (receipt) => {
    console.log('✅ Confirmed:', receipt);
  },
  onError: (error) => {
    console.error('❌ Error:', error);
  },
});
```

---

## 常见问题排查

### Q: SDK方法报错 "SDK not initialized"

**A:** 确保先调用 `await sdk.initialize(provider)`

```typescript
const sdk = new PrivateTransferSDK({ ... });
await sdk.initialize(window.ethereum); // 必须先初始化
await sdk.deposit({ ... }); // 然后才能调用其他方法
```

### Q: 交易失败或pending太久

**A:** 检查：
1. 是否连接到 Sepolia 测试网
2. 钱包是否有足够的测试ETH
3. 在浏览器控制台查看详细错误

```typescript
try {
  await sdk.deposit({ ... });
} catch (error) {
  console.error('详细错误:', error);
  console.error('错误消息:', error.message);
  console.error('错误代码:', error.code);
}
```

### Q: 提款时报 "No vault found"

**A:** 确保：
1. 密码正确（使用存款时生成的私钥）
2. 该密码对应的金库已创建
3. 使用正确的网络（Sepolia）

### Q: npm link 后前端找不到SDK

**A:** 尝试：

```bash
# 1. 取消链接
cd /home/ekko/Desktop/codes/zama-program/frontend
npm unlink @zama-private-transfer/sdk

cd /home/ekko/Desktop/codes/zama-program/sdk
npm unlink

# 2. 重新链接
cd /home/ekko/Desktop/codes/zama-program/sdk
npm link

cd /home/ekko/Desktop/codes/zama-program/frontend
npm link @zama-private-transfer/sdk

# 3. 重启开发服务器
npm run dev
```

---

## 推荐的调试工作流

### 第一次使用（测试SDK是否工作）：

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run debug
```

在浏览器中测试所有功能。

### 开发新功能时：

**终端1 - SDK监听：**
```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run dev
```

**终端2 - 前端开发：**
```bash
cd /home/ekko/Desktop/codes/zama-program/frontend
npm run dev
```

修改SDK代码 → 自动重新编译 → 刷新浏览器查看效果

---

## 检查清单

开始调试前确认：

- [ ] SDK已构建 (`npm run build`)
- [ ] MetaMask已安装
- [ ] 已切换到Sepolia测试网
- [ ] 钱包有测试ETH（从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取）
- [ ] 浏览器控制台已打开（F12）

---

## 获取帮助

如果遇到问题：

1. 查看浏览器控制台的错误信息
2. 查看 `DEBUG_GUIDE.md` 获取更详细的调试方法
3. 查看 `README.md` 了解API使用方法
4. 检查 `examples/` 目录的示例代码

---

## 一键启动调试（复制粘贴）

```bash
# 完整的调试启动命令
cd /home/ekko/Desktop/codes/zama-program/sdk && npm run debug
```

这是最快的方式！🚀
