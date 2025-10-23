# 🎯 快速参考卡片

## 一键启动命令

```bash
# 进入SDK目录
cd /home/ekko/Desktop/codes/zama-program/sdk

# === 本地调试 ===
npm run debug              # 构建 + 启动 + 打开浏览器（仅本机）

# === 局域网调试 ===
./start-lan.sh            # 🌟 推荐！彩色UI + 二维码
npm run debug:lan         # 构建 + 启动（局域网）
npm run server:lan        # 仅启动服务器（局域网）
```

---

## 开发命令

```bash
npm run build             # 构建SDK（生产）
npm run dev               # 监听模式（开发时自动重编译）
npm run typecheck         # TypeScript类型检查
```

---

## 访问地址

### 本地调试
```
http://localhost:5173/test-debug.html
```

### 局域网调试
```
http://<你的IP>:5173/test-debug.html
例如: http://192.168.1.100:5173/test-debug.html
```

**查看IP地址:**
```bash
hostname -I
```

---

## 文档快速导航

| 需求 | 文档 |
|------|------|
| 🚀 **马上开始** | `START_HERE.md` |
| 📱 **手机调试** | `LAN_DEBUG.md` |
| ⚡ **快速调试** | `QUICK_DEBUG.md` |
| 📖 **完整调试** | `DEBUG_GUIDE.md` |
| 📚 **API文档** | `README.md` (英) / `README.zh-CN.md` (中) |
| 🎓 **快速入门** | `QUICKSTART.md` |
| 🏗️ **项目结构** | `PROJECT_STRUCTURE.md` |

---

## 常见操作

### 链接到前端项目
```bash
# 在SDK目录
npm link

# 在前端目录
cd ../frontend
npm link @zama-private-transfer/sdk
```

### 取消链接
```bash
# 在前端目录
npm unlink @zama-private-transfer/sdk

# 在SDK目录
npm unlink
```

### 监听 + 前端开发
```bash
# 终端1: SDK监听
cd sdk
npm run dev

# 终端2: 前端开发
cd frontend
npm run dev
```

---

## 调试技巧

### 在代码中添加断点
```typescript
debugger; // 浏览器会在这里暂停
```

### 添加日志
```typescript
console.log('[SDK]', message);
console.error('[SDK Error]', error);
```

### 使用回调
```typescript
sdk.setCallbacks({
  onTransactionSubmitted: (tx) => console.log('TX:', tx),
  onError: (err) => console.error('Error:', err),
});
```

---

## 防火墙快速配置

```bash
# Ubuntu/Debian
sudo ufw allow 5173/tcp
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --reload
```

---

## 手机调试清单

- [ ] 手机和电脑在同一WiFi
- [ ] 防火墙允许5173端口
- [ ] MetaMask Mobile已安装
- [ ] 已切换到Sepolia测试网
- [ ] 钱包有测试ETH

---

## 问题排查

| 问题 | 解决方案 |
|------|----------|
| 手机无法访问 | 检查WiFi、防火墙、IP地址 |
| SDK未初始化 | 确保先调用 `await sdk.initialize()` |
| 交易失败 | 检查网络、Gas、余额 |
| 找不到vault | 确认密码正确、网络正确 |

---

## 合约信息

```
Network:  Sepolia Testnet
Address:  0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D
RPC:      https://1rpc.io/sepolia
Chain ID: 11155111
```

---

## 获取测试ETH

https://sepoliafaucet.com/

---

## 联系支持

- 📖 文档: 查看各个.md文件
- 🐛 问题: 查看 `DEBUG_GUIDE.md` 常见问题部分
- 💬 示例: 查看 `examples/` 目录

---

**快速启动:**
```bash
./start-lan.sh
```
