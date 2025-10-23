# 🎯 从这里开始

## 最快的调试方式 - 3步开始

### 本地调试（仅电脑）

#### 1. 进入SDK目录
```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
```

#### 2. 一键启动调试
```bash
npm run debug
```

这会自动：
✅ 构建SDK
✅ 启动本地服务器
✅ 在浏览器打开测试页面

#### 3. 开始测试
在打开的浏览器页面中：
1. 点击"连接 MetaMask"
2. 测试存款、提款等功能
3. 查看实时调试日志
4. 按F12打开开发者工具深度调试

---

### 局域网调试（手机/平板/其他设备）

#### 方式1: 使用启动脚本（推荐）
```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
./start-lan.sh
```

这会显示：
- 🌐 局域网访问地址
- 📱 二维码（手机扫码访问）
- 📋 详细使用说明

#### 方式2: 使用npm命令
```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run debug:lan
```

#### 在手机上访问
1. 确保手机和电脑在同一WiFi
2. 打开MetaMask Mobile
3. 使用内置浏览器访问显示的局域网地址
4. 例如：`http://192.168.1.100:5173/test-debug.html`

**详细说明请查看：`LAN_DEBUG.md`**

---

## 其他调试方式

### 在现有前端项目中调试

**终端1 - 启动SDK监听：**
```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run dev
```

**终端2 - 链接并启动前端：**
```bash
cd /home/ekko/Desktop/codes/zama-program/frontend
npm link ../sdk
npm run dev
```

修改SDK代码会自动重新编译！

---

## 📚 详细文档

| 文档 | 说明 |
|------|------|
| `QUICK_DEBUG.md` | 快速调试指南（推荐先看） |
| `LAN_DEBUG.md` | 📱 局域网/手机调试指南（新增） |
| `DEBUG_GUIDE.md` | 完整调试文档（5种方法） |
| `README.md` | 完整API文档（英文） |
| `README.zh-CN.md` | 完整API文档（中文） |
| `QUICKSTART.md` | 5分钟快速入门 |

---

## 🔧 常用命令

```bash
npm run build        # 构建SDK
npm run dev          # 监听模式（自动重新构建）
npm run debug        # 启动调试页面（本地）
npm run debug:lan    # 🆕 启动局域网调试
npm run typecheck    # 类型检查
./start-lan.sh       # 🆕 一键启动局域网（推荐）
```

---

## ⚡ 快速测试

打开浏览器，访问本地文件：
```
file:///home/ekko/Desktop/codes/zama-program/sdk/test-debug.html
```

或使用服务器（推荐）：
```bash
npm run test-server
# 然后访问 http://localhost:5173/test-debug.html
```

---

## 🎯 你需要什么？

- ✅ **最快速测试SDK** → 运行 `npm run debug`
- ✅ **在前端项目使用** → 查看 `QUICK_DEBUG.md`
- ✅ **完整调试方法** → 查看 `DEBUG_GUIDE.md`
- ✅ **学习API使用** → 查看 `README.md` 或 `QUICKSTART.md`

---

## 🚨 调试前确认

- [ ] 已安装 MetaMask
- [ ] 已切换到 Sepolia 测试网
- [ ] 钱包有测试 ETH
- [ ] 已运行 `npm install`

获取测试ETH: https://sepoliafaucet.com/

---

**现在就开始：**
```bash
npm run debug
```
