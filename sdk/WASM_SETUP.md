# WASM 文件设置说明

## 已完成的设置

✅ WASM文件已复制到正确位置：
- `/public/wasm/tfhe_bg.wasm` (4.4MB)
- `/public/wasm/kms_lib_bg.wasm` (638KB)

✅ 测试页面已更新：
- `test-debug.html` 已添加 Zama SDK 初始化
- 自动加载 WASM 文件

## 文件结构

```
sdk/
├── public/
│   ├── wasm/
│   │   ├── tfhe_bg.wasm      # FHE 加密核心
│   │   └── kms_lib_bg.wasm   # 密钥管理系统
│   └── polyfills.js
└── test-debug.html            # 测试页面（已配置）
```

## SDK 初始化代码

在使用 SDK 之前，需要初始化 Zama FHE SDK：

```javascript
import { initSDK } from '@zama-fhe/relayer-sdk/web';

// 初始化 WASM 模块
await initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
});

console.log('Zama FHE SDK initialized!');
```

## 在 test-debug.html 中的实现

测试页面已经包含完整的初始化代码：

```javascript
import { initSDK } from '@zama-fhe/relayer-sdk/web';
import { PrivateTransferSDK, TransferType } from './dist/index.mjs';

// 1. 首先初始化 Zama SDK
initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
  .then(() => {
    console.log('✅ Zama FHE SDK initialized');
    sdkInitialized = true;
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
  });

// 2. 然后才能使用 PrivateTransferSDK
```

## 使用说明

### 1. 启动开发服务器

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
./START.sh
```

### 2. 访问测试页面

浏览器会自动打开：`http://localhost:5173/test-debug.html`

### 3. 检查初始化状态

打开浏览器控制台（F12），应该看到：

```
Initializing Zama FHE SDK...
✅ Zama FHE SDK initialized successfully
```

### 4. 连接钱包

点击"连接 MetaMask"按钮，开始测试。

## 常见问题

### Q1: 看到 "Failed to fetch" WASM 文件

**原因：** WASM 文件路径不正确或服务器未正确提供

**解决：**
```bash
# 确认文件存在
ls -lh public/wasm/

# 应该看到：
# tfhe_bg.wasm
# kms_lib_bg.wasm
```

### Q2: "global is not defined" 错误

**原因：** Node.js polyfills 未加载

**解决：** 页面已包含 polyfill：
```html
<script>
  window.global = window.globalThis;
  window.process = window.process || { env: {} };
</script>
```

### Q3: Zama SDK 初始化失败

**检查：**
1. WASM 文件是否存在
2. 网络是否正常
3. 浏览器控制台的详细错误信息

**重试：**
```bash
# 重新复制 WASM 文件
cp ../frontend/public/wasm/*.wasm public/wasm/

# 重启服务器
./START.sh
```

### Q4: 手机访问时 WASM 加载失败

**原因：** 手机网络较慢，WASM 文件较大（5MB+）

**解决：**
1. 确保WiFi信号良好
2. 等待加载完成（可能需要几秒）
3. 查看手机浏览器控制台

## 性能优化

### WASM 文件预加载

可以在 HTML 中添加预加载标签：

```html
<link rel="preload" href="/wasm/tfhe_bg.wasm" as="fetch" crossorigin>
<link rel="preload" href="/wasm/kms_lib_bg.wasm" as="fetch" crossorigin>
```

### 缓存配置

Vite 会自动缓存 WASM 文件，第二次访问会更快。

## 在你的项目中集成

### Vue 3 项目

```javascript
// main.ts
import { createApp } from 'vue'
import { initSDK } from '@zama-fhe/relayer-sdk/web'
import App from './App.vue'

initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
  .then(() => {
    console.log('Zama FHE SDK initialized')
    createApp(App).mount('#app')
  })
  .catch((error) => {
    console.error('Failed to initialize:', error)
    createApp(App).mount('#app') // 即使失败也挂载应用
  })
```

### React 项目

```javascript
// index.tsx
import { initSDK } from '@zama-fhe/relayer-sdk/web'

initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
  .then(() => {
    console.log('Zama FHE SDK initialized')
    const root = ReactDOM.createRoot(document.getElementById('root'))
    root.render(<App />)
  })
  .catch(console.error)
```

### 纯 HTML 项目

```html
<script type="module">
  import { initSDK } from '@zama-fhe/relayer-sdk/web';
  import { PrivateTransferSDK } from './dist/index.mjs';

  // 初始化
  await initSDK({
    tfheParams: '/wasm/tfhe_bg.wasm',
    kmsParams: '/wasm/kms_lib_bg.wasm',
  });

  // 使用 SDK
  const sdk = new PrivateTransferSDK({ ... });
  await sdk.initialize(window.ethereum);
</script>
```

## 测试检查清单

启动服务器后：

- [ ] 浏览器控制台显示 "Zama FHE SDK initialized"
- [ ] 没有 "global is not defined" 错误
- [ ] 没有 WASM 加载失败错误
- [ ] 可以点击"连接 MetaMask"
- [ ] SDK 方法可以正常调用

## 相关文档

- `START_HERE.md` - 快速入门
- `QUICK_DEBUG.md` - 调试指南
- `LAN_DEBUG.md` - 局域网调试

## 技术细节

### WASM 加载流程

1. 浏览器请求 `/wasm/tfhe_bg.wasm`
2. Vite 从 `public/` 目录提供文件
3. Zama SDK 加载并初始化 WASM 模块
4. FHE 加密功能准备就绪

### 文件大小

- `tfhe_bg.wasm`: ~4.4MB (FHE 核心算法)
- `kms_lib_bg.wasm`: ~638KB (密钥管理)
- 总计: ~5MB

首次加载可能需要几秒钟，之后会被浏览器缓存。

---

✅ 配置完成！现在运行 `./START.sh` 开始测试！
