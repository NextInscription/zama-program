# SDK 初始化指南

## 三种初始化方式

SDK 提供了三种初始化方式，适应不同的使用场景。

---

## 方式1：自动初始化（最简单，推荐）

SDK 会在第一次调用 `initialize()` 时自动初始化 WASM 模块。

```typescript
import { PrivateTransferSDK } from '@zama-private-transfer/sdk';

const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
});

// 自动初始化 WASM 模块（如果还没初始化）
await sdk.initialize(window.ethereum);

// 现在可以使用 SDK 了
await sdk.deposit({ ... });
```

**优点：**
- ✅ 最简单，无需额外代码
- ✅ 自动处理 WASM 加载
- ✅ 只初始化一次（单例模式）

**注意：**
- WASM 文件必须在 `/wasm/tfhe_bg.wasm` 和 `/wasm/kms_lib_bg.wasm`
- 首次调用可能需要几秒钟（加载 WASM）

---

## 方式2：手动预初始化（推荐用于生产环境）

在应用启动时手动初始化 WASM，控制加载时机和错误处理。

```typescript
import { PrivateTransferSDK, initSDK } from '@zama-private-transfer/sdk';

// 1. 在应用启动时初始化 WASM
await initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
});

console.log('WASM initialized!');

// 2. 创建 SDK 实例（WASM 已经加载）
const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
});

// 3. 初始化 SDK（快速，因为 WASM 已加载）
await sdk.initialize(window.ethereum);

// 4. 使用 SDK
await sdk.deposit({ ... });
```

**优点：**
- ✅ 完全控制初始化时机
- ✅ 可以显示加载进度
- ✅ 更好的错误处理
- ✅ 后续操作更快（WASM 已加载）

**适用场景：**
- Vue/React 应用的 main.ts/index.tsx
- 需要显示加载动画
- 需要自定义 WASM 路径

---

## 方式3：使用 SDK 静态方法预初始化

使用 SDK 的静态方法，支持自定义 WASM 路径。

```typescript
import { PrivateTransferSDK } from '@zama-private-transfer/sdk';

// 1. 使用静态方法初始化（可选自定义路径）
await PrivateTransferSDK.initializeWasm({
  tfheParams: '/custom/path/tfhe_bg.wasm',
  kmsParams: '/custom/path/kms_lib_bg.wasm',
});

// 2. 创建 SDK 实例
const sdk = new PrivateTransferSDK({
  contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
});

// 3. 初始化 SDK
await sdk.initialize(window.ethereum);

// 4. 使用 SDK
await sdk.deposit({ ... });
```

**优点：**
- ✅ 支持自定义 WASM 路径
- ✅ 类型安全
- ✅ 与 SDK 集成更紧密

---

## 在不同框架中的使用

### Vue 3

```typescript
// main.ts
import { createApp } from 'vue';
import { initSDK } from '@zama-private-transfer/sdk';
import App from './App.vue';

// 方式1：手动初始化（推荐）
initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
  .then(() => {
    console.log('✅ WASM initialized');
    createApp(App).mount('#app');
  })
  .catch((error) => {
    console.error('❌ WASM init failed:', error);
    // 可以选择继续挂载应用并显示错误
    createApp(App).mount('#app');
  });

// 方式2：自动初始化（在组件中）
// <script setup lang="ts">
// import { PrivateTransferSDK } from '@zama-private-transfer/sdk';
//
// const sdk = new PrivateTransferSDK({ ... });
// await sdk.initialize(window.ethereum); // 自动初始化 WASM
// </script>
```

### React

```typescript
// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSDK } from '@zama-private-transfer/sdk';
import App from './App';

// 方式1：手动初始化（推荐）
initSDK({
  tfheParams: '/wasm/tfhe_bg.wasm',
  kmsParams: '/wasm/kms_lib_bg.wasm',
})
  .then(() => {
    console.log('✅ WASM initialized');
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(<App />);
  })
  .catch((error) => {
    console.error('❌ WASM init failed:', error);
  });

// 方式2：自动初始化（在组件中）
// function MyComponent() {
//   const [sdk, setSdk] = useState<PrivateTransferSDK | null>(null);
//
//   useEffect(() => {
//     const initSdk = async () => {
//       const newSdk = new PrivateTransferSDK({ ... });
//       await newSdk.initialize(window.ethereum); // 自动初始化 WASM
//       setSdk(newSdk);
//     };
//     initSdk();
//   }, []);
//
//   return <div>...</div>;
// }
```

### 纯 HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>Zama SDK Example</title>
</head>
<body>
  <!-- Polyfills for Node.js globals -->
  <script>
    window.global = window.globalThis;
    window.process = window.process || { env: {} };
  </script>

  <script type="module">
    import { PrivateTransferSDK } from './dist/index.mjs';

    // 方式1：自动初始化（最简单）
    const sdk = new PrivateTransferSDK({
      contractAddress: '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D',
    });

    // 自动初始化 WASM
    await sdk.initialize(window.ethereum);
    console.log('SDK ready!');

    // 方式2：手动初始化（更多控制）
    // import { initSDK } from './dist/index.mjs';
    // await initSDK({ tfheParams: '/wasm/tfhe_bg.wasm', kmsParams: '/wasm/kms_lib_bg.wasm' });
    // await sdk.initialize(window.ethereum);
  </script>
</body>
</html>
```

---

## 错误处理

### 如果 WASM 初始化失败

SDK 会抛出详细的错误信息：

```typescript
try {
  await sdk.initialize(window.ethereum);
} catch (error) {
  console.error('SDK initialization failed:', error);

  // 错误信息会提示：
  // - WASM 文件路径是否正确
  // - 如何使用自定义路径
  // - 具体的错误原因
}
```

### 常见错误

#### 1. WASM 文件未找到

```
Error: Failed to initialize Zama FHE WASM modules.
Please ensure WASM files are available at /wasm/tfhe_bg.wasm and /wasm/kms_lib_bg.wasm
```

**解决方案：**
```bash
# 确保 WASM 文件在 public 目录
ls -lh public/wasm/

# 如果没有，复制文件
cp path/to/wasm/*.wasm public/wasm/
```

#### 2. 自定义路径

```typescript
// 使用自定义路径
await PrivateTransferSDK.initializeWasm({
  tfheParams: '/my-custom-path/tfhe_bg.wasm',
  kmsParams: '/my-custom-path/kms_lib_bg.wasm',
});
```

#### 3. CDN 路径

```typescript
// 从 CDN 加载（如果 WASM 文件在 CDN 上）
await initSDK({
  tfheParams: 'https://cdn.example.com/wasm/tfhe_bg.wasm',
  kmsParams: 'https://cdn.example.com/wasm/kms_lib_bg.wasm',
});
```

---

## 性能优化

### 预加载 WASM 文件

在 HTML 中添加预加载标签：

```html
<link rel="preload" href="/wasm/tfhe_bg.wasm" as="fetch" crossorigin>
<link rel="preload" href="/wasm/kms_lib_bg.wasm" as="fetch" crossorigin>
```

### 显示加载进度

```typescript
import { initSDK } from '@zama-private-transfer/sdk';

// 显示加载提示
console.log('Loading WASM modules...');
showLoadingSpinner();

try {
  await initSDK({
    tfheParams: '/wasm/tfhe_bg.wasm',
    kmsParams: '/wasm/kms_lib_bg.wasm',
  });

  console.log('✅ WASM loaded successfully');
  hideLoadingSpinner();
} catch (error) {
  console.error('❌ WASM loading failed:', error);
  showErrorMessage('Failed to load encryption modules');
}
```

### 懒加载

```typescript
// 只在需要时加载 SDK
async function whenUserClicksDeposit() {
  // 动态导入 SDK
  const { PrivateTransferSDK } = await import('@zama-private-transfer/sdk');

  const sdk = new PrivateTransferSDK({ ... });
  await sdk.initialize(window.ethereum); // 自动初始化 WASM

  // 使用 SDK
  await sdk.deposit({ ... });
}
```

---

## 最佳实践

### ✅ 推荐做法

1. **生产环境：手动初始化**
   ```typescript
   // 在应用启动时
   await initSDK({ tfheParams: '...', kmsParams: '...' });
   ```

2. **开发环境：自动初始化**
   ```typescript
   // 简单快速
   await sdk.initialize(window.ethereum);
   ```

3. **显示加载状态**
   ```typescript
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     initSDK({ ... })
       .then(() => setLoading(false))
       .catch(console.error);
   }, []);
   ```

### ❌ 避免做法

1. **不要多次初始化**
   ```typescript
   // ❌ 错误：每次都初始化
   function MyComponent() {
     useEffect(() => {
       initSDK({ ... }); // 每次组件挂载都初始化！
     }, []);
   }

   // ✅ 正确：只初始化一次
   // 在应用入口初始化，或让 SDK 自动初始化
   ```

2. **不要忽略错误**
   ```typescript
   // ❌ 错误：不处理错误
   await sdk.initialize(window.ethereum);

   // ✅ 正确：处理错误
   try {
     await sdk.initialize(window.ethereum);
   } catch (error) {
     console.error('Init failed:', error);
     showErrorToUser();
   }
   ```

---

## 检查初始化状态

```typescript
// SDK 内部会检查 WASM 是否已初始化
// 你不需要手动检查，但如果需要：

import { PrivateTransferSDK } from '@zama-private-transfer/sdk';

// 检查是否已初始化（通过尝试使用）
try {
  await sdk.deposit({ ... });
  console.log('SDK is ready');
} catch (error) {
  if (error.message.includes('WASM')) {
    console.log('WASM not initialized yet');
  }
}
```

---

## 总结

| 方式 | 适用场景 | 难度 | 控制力 |
|------|----------|------|--------|
| 自动初始化 | 快速开发、原型 | ⭐ 简单 | ⭐ 低 |
| 手动 initSDK | 生产环境 | ⭐⭐ 中等 | ⭐⭐⭐ 高 |
| SDK静态方法 | 自定义路径 | ⭐⭐ 中等 | ⭐⭐ 中 |

**推荐选择：**
- 🚀 **快速测试**：使用自动初始化
- 🏭 **生产环境**：使用手动 initSDK
- 🎨 **自定义需求**：使用 SDK 静态方法

---

## 相关文档

- `README.md` - 完整 API 文档
- `WASM_SETUP.md` - WASM 文件配置
- `QUICK_DEBUG.md` - 调试指南
