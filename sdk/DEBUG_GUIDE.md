# SDK 调试指南

## 方法1: 使用 npm link 本地调试（推荐）

### 步骤1: 在SDK目录建立链接

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm link
```

### 步骤2: 在前端项目中使用链接

```bash
cd /home/ekko/Desktop/codes/zama-program/frontend
npm link @zama-private-transfer/sdk
```

### 步骤3: 在前端项目中使用SDK

修改前端代码，导入SDK：

```typescript
// 在前端项目中使用
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';

// 替代原来的组件逻辑
const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
});
await sdk.initialize(window.ethereum);
```

### 步骤4: 实时编译SDK（开发模式）

在SDK目录开启watch模式，代码修改会自动重新编译：

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run dev
```

### 步骤5: 启动前端开发服务器

```bash
cd /home/ekko/Desktop/codes/zama-program/frontend
npm run dev
```

现在修改SDK代码会自动重新编译，刷新浏览器即可看到变化！

### 取消链接

完成调试后：

```bash
# 在前端项目中
cd /home/ekko/Desktop/codes/zama-program/frontend
npm unlink @zama-private-transfer/sdk

# 在SDK项目中
cd /home/ekko/Desktop/codes/zama-program/sdk
npm unlink
```

---

## 方法2: 创建独立测试页面

### 步骤1: 创建测试HTML文件

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
```

创建 `test.html` 文件（已在examples/web-integration.html中提供）

### 步骤2: 使用开发服务器

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npx vite
```

### 步骤3: 访问测试页面

打开浏览器访问 `http://localhost:5173/examples/web-integration.html`

---

## 方法3: 使用相对路径直接引用

在前端项目中直接使用相对路径引用SDK源码：

```typescript
// 在前端项目中
import { PrivateTransferSDK, TransferType } from '../../sdk/src/index';
```

这样可以直接调试源代码，不需要构建。

---

## 方法4: 使用浏览器调试工具

### 在SDK代码中添加断点

```typescript
// src/PrivateTransferSDK.ts
async deposit(params: DepositParams): Promise<DepositResult> {
  debugger; // 浏览器会在这里暂停
  console.log('Deposit params:', params);

  // ... 其他代码
}
```

### 使用 console.log 调试

```typescript
async deposit(params: DepositParams): Promise<DepositResult> {
  console.log('[SDK] Deposit called with:', params);
  console.log('[SDK] Contract address:', this.config.contractAddress);

  // ... 其他代码

  console.log('[SDK] Encrypted input:', encryptedInput);
  console.log('[SDK] Transaction hash:', tx.hash);
}
```

### 查看浏览器控制台

按 `F12` 打开浏览器开发者工具：
- **Console** - 查看日志
- **Sources** - 设置断点
- **Network** - 查看网络请求

---

## 方法5: 单元测试（需要配置）

### 安装测试依赖

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm install --save-dev vitest @vitest/ui
```

### 创建测试文件

创建 `src/__tests__/PrivateTransferSDK.test.ts`

### 运行测试

```bash
npm run test
```

---

## 调试技巧

### 1. 添加详细日志

在SDK中添加一个调试模式：

```typescript
export class PrivateTransferSDK {
  private debug: boolean = false;

  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[SDK Debug]', ...args);
    }
  }

  async deposit(params: DepositParams) {
    this.log('Deposit called', params);
    // ... 代码
  }
}

// 使用
sdk.setDebug(true);
```

### 2. 使用 Source Maps

SDK已配置source maps，在浏览器中可以直接调试TypeScript源码。

### 3. 错误追踪

SDK已实现完整的错误处理，所有错误都会包含详细信息：

```typescript
try {
  await sdk.deposit({ ... });
} catch (error) {
  console.error('Error details:', error);
  console.error('Stack trace:', error.stack);
}
```

### 4. 事件回调调试

使用回调函数追踪所有操作：

```typescript
sdk.setCallbacks({
  onTransactionSubmitted: (txHash) => {
    console.log('✅ TX Submitted:', txHash);
  },
  onTransactionConfirmed: (receipt) => {
    console.log('✅ TX Confirmed:', receipt);
  },
  onError: (error) => {
    console.error('❌ Error:', error);
  },
});
```

---

## 常见问题排查

### 问题1: SDK未正确初始化

```typescript
// 检查初始化
console.log('SDK initialized:', sdk);
console.log('Contract:', await sdk.getContractAddress());
console.log('Signer:', await sdk.getSignerAddress());
```

### 问题2: 交易失败

```typescript
// 查看交易详情
try {
  const result = await sdk.deposit({ ... });
} catch (error) {
  console.error('Transaction failed:', error);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
}
```

### 问题3: FHE加密问题

```typescript
// 检查FHE实例
console.log('FHE Instance:', sdk.fheInstance);
```

### 问题4: 钱包连接问题

```typescript
// 检查钱包连接
if (!window.ethereum) {
  console.error('MetaMask not installed');
}

const accounts = await window.ethereum.request({
  method: 'eth_accounts'
});
console.log('Connected accounts:', accounts);

const chainId = await window.ethereum.request({
  method: 'eth_chainId'
});
console.log('Chain ID:', chainId);
// Sepolia应该是 0xaa36a7 (11155111)
```

---

## 推荐的调试工作流

### 开发新功能时：

1. 在SDK目录运行 `npm run dev` 开启watch模式
2. 在前端目录使用 `npm link` 链接本地SDK
3. 在前端目录运行 `npm run dev` 启动开发服务器
4. 修改SDK代码，保存后自动编译
5. 刷新浏览器查看效果
6. 使用浏览器开发者工具查看日志和断点

### 调试问题时：

1. 在SDK代码中添加 `console.log` 或 `debugger`
2. 使用 `sdk.setCallbacks()` 追踪所有操作
3. 查看浏览器控制台的错误信息
4. 使用 Sources 面板设置断点
5. 单步执行代码查找问题

---

## VS Code 调试配置（可选）

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug SDK in Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverrides": {
        "webpack:///./*": "${webRoot}/*"
      }
    }
  ]
}
```

然后在VS Code中按F5启动调试。

---

## 性能监控

### 测量函数执行时间

```typescript
async deposit(params: DepositParams) {
  console.time('deposit');

  // ... 代码

  console.timeEnd('deposit');
}
```

### 监控网络请求

在浏览器开发者工具的Network面板查看：
- RPC请求
- 交易发送
- 区块链交互

---

## 下一步

1. 先尝试**方法1**（npm link），这是最接近实际使用场景的方式
2. 如果遇到问题，使用**方法3**（直接引用源码）快速调试
3. 生产环境前，创建完整的测试套件（方法5）

需要我帮你配置具体的调试环境吗？
