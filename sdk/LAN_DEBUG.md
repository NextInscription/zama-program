# 📱 局域网调试指南

## 快速启动局域网调试

### 方法1: 一键启动（推荐）

```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run debug:lan
```

这会：
- ✅ 构建SDK
- ✅ 启动服务器（监听所有网络接口）
- ✅ 显示本地和局域网访问地址

---

## 获取局域网访问地址

启动服务器后，你会看到类似输出：

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/test-debug.html
  ➜  Network: http://192.168.1.100:5173/test-debug.html
```

**在其他设备上访问：**
- 手机浏览器打开：`http://192.168.1.100:5173/test-debug.html`
- 平板打开：`http://192.168.1.100:5173/test-debug.html`
- 其他电脑打开：`http://192.168.1.100:5173/test-debug.html`

> 注意：将 `192.168.1.100` 替换为实际显示的IP地址

---

## 手动查看本机IP地址

如果没有显示局域网地址，手动查看IP：

### Linux/Mac:
```bash
# 方法1
hostname -I

# 方法2
ip addr show | grep "inet " | grep -v 127.0.0.1

# 方法3
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 常见输出：
```
192.168.1.100  # 这就是你的局域网IP
```

---

## 所有启动命令

```bash
# 局域网调试（构建 + 启动 + 打开浏览器）
npm run debug:lan

# 仅启动局域网服务器（不构建）
npm run server:lan

# 本地调试（仅本机访问）
npm run debug
```

---

## 在手机上调试

### 准备工作

1. **确保手机和电脑在同一WiFi网络**
2. **电脑防火墙允许5173端口**
3. **手机安装支持Web3的浏览器**（推荐）：
   - MetaMask Mobile
   - Trust Wallet
   - TokenPocket
   - imToken

### 步骤

#### 1. 启动局域网服务器

在电脑上：
```bash
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run debug:lan
```

记下显示的局域网地址，例如：`http://192.168.1.100:5173`

#### 2. 在手机上访问

打开手机浏览器，输入：
```
http://192.168.1.100:5173/test-debug.html
```

#### 3. 连接钱包

- 如果使用**MetaMask Mobile**：
  1. 打开MetaMask应用
  2. 点击左上角菜单
  3. 选择"浏览器"
  4. 输入局域网地址

- 如果使用**普通浏览器**：
  1. 需要先安装支持WalletConnect的钱包
  2. 或使用手机版MetaMask内置浏览器

#### 4. 切换到Sepolia测试网

在钱包中切换网络到Sepolia Testnet

#### 5. 开始测试

点击"连接MetaMask"开始测试SDK功能！

---

## 远程调试

### 使用Chrome远程调试（Android）

#### 1. 在电脑Chrome打开
```
chrome://inspect/#devices
```

#### 2. 在手机上
1. 启用开发者选项
2. 启用USB调试
3. 用USB连接电脑和手机

#### 3. 在chrome://inspect页面
点击"inspect"查看手机浏览器的控制台

### 使用Safari远程调试（iOS）

#### 1. 在iPhone上
设置 → Safari → 高级 → 启用"Web检查器"

#### 2. 在Mac上
Safari → 开发 → 选择你的iPhone → 选择页面

---

## 防火墙配置

### Linux (UFW)

允许5173端口：
```bash
sudo ufw allow 5173/tcp
sudo ufw reload
```

### Linux (iptables)

```bash
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables-save
```

### 临时关闭防火墙测试（不推荐）

```bash
# Ubuntu/Debian
sudo ufw disable

# CentOS/RHEL
sudo systemctl stop firewalld
```

测试完成后记得重新启用！

---

## 使用二维码访问

### 生成二维码

#### 方法1: 使用在线工具
1. 访问 https://qr.io/
2. 输入你的局域网地址：`http://192.168.1.100:5173/test-debug.html`
3. 生成二维码
4. 手机扫码访问

#### 方法2: 使用命令行工具

安装qrencode：
```bash
# Ubuntu/Debian
sudo apt-get install qrencode

# Mac
brew install qrencode
```

生成二维码：
```bash
# 获取本机IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

# 生成二维码（在终端显示）
qrencode -t ANSI "http://${LOCAL_IP}:5173/test-debug.html"
```

手机扫码即可访问！

---

## 常见问题

### Q1: 手机无法访问服务器

**检查清单：**
- [ ] 手机和电脑是否在同一WiFi
- [ ] IP地址是否正确
- [ ] 服务器是否使用 `--host 0.0.0.0` 启动
- [ ] 防火墙是否允许5173端口
- [ ] 端口5173是否被其他程序占用

**测试连接：**
```bash
# 在手机浏览器直接访问
http://192.168.1.100:5173
```

如果能看到Vite的欢迎页面，说明连接正常。

### Q2: 手机上MetaMask无法连接

**解决方案：**
1. 使用MetaMask Mobile内置浏览器
2. 确保MetaMask已切换到Sepolia网络
3. 在MetaMask中手动添加网络（如果没有）

**Sepolia网络配置：**
```
Network Name: Sepolia
RPC URL: https://1rpc.io/sepolia
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

### Q3: 找不到本机IP地址

```bash
# 多种方式查找
hostname -I                              # 方法1
ip addr show | grep "inet "              # 方法2
ifconfig | grep "inet "                  # 方法3
ip route get 8.8.8.8 | grep src          # 方法4
```

通常是 `192.168.x.x` 或 `10.0.x.x` 格式

### Q4: 端口被占用

```bash
# 查看5173端口占用
sudo lsof -i :5173

# 或
sudo netstat -tulpn | grep 5173

# 杀掉占用进程
sudo kill -9 <PID>

# 或使用其他端口
npx vite --host 0.0.0.0 --port 8080
```

### Q5: 速度很慢

**优化建议：**
1. 确保WiFi信号良好
2. 关闭不必要的网络程序
3. 使用5GHz WiFi（如果支持）
4. 减少浏览器插件

---

## 高级配置

### 自定义端口

```bash
# 使用8080端口
npx vite --host 0.0.0.0 --port 8080
```

### HTTPS配置（用于手机测试）

创建 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync('path/to/key.pem'),
      cert: fs.readFileSync('path/to/cert.pem'),
    },
  },
});
```

### 允许特定IP访问

在 `vite.config.ts` 中：

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: {
      // 配置代理规则
    },
    hmr: {
      host: '192.168.1.100', // 你的IP
    },
  },
});
```

---

## 实用工具

### 网络监控

```bash
# 查看网络连接
watch -n 1 "netstat -an | grep 5173"

# 查看实时日志
tail -f /var/log/vite.log
```

### 性能测试

在手机浏览器控制台：

```javascript
// 测试网络延迟
console.time('api-call');
await fetch('http://192.168.1.100:5173/api/test');
console.timeEnd('api-call');
```

---

## 团队协作

### 让团队成员访问

1. **启动服务器**
```bash
npm run server:lan
```

2. **获取IP地址**
```bash
hostname -I
```

3. **分享给团队**
```
📱 测试地址：http://192.168.1.100:5173/test-debug.html
🔗 确保在同一WiFi网络
✅ 需要安装MetaMask
```

### 使用ngrok（外网访问）

如果需要外网访问：

```bash
# 安装ngrok
# 下载：https://ngrok.com/download

# 启动SDK服务器
npm run test-server

# 在另一个终端启动ngrok
ngrok http 5173
```

会获得一个公网地址：
```
https://xxxx-xx-xxx-xxx-xx.ngrok.io
```

团队成员可以在任何地方访问这个地址！

---

## 快速启动脚本

创建 `start-lan.sh`：

```bash
#!/bin/bash

echo "🚀 启动局域网调试..."

# 获取IP地址
IP=$(hostname -I | awk '{print $1}')

echo "📱 本机IP: $IP"
echo ""

# 构建SDK
echo "🔨 构建SDK..."
npm run build

echo ""
echo "🌐 启动服务器..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  本地访问: http://localhost:5173/test-debug.html"
echo "  局域网访问: http://$IP:5173/test-debug.html"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 在手机浏览器打开:"
echo "   http://$IP:5173/test-debug.html"
echo ""

# 生成二维码（如果安装了qrencode）
if command -v qrencode &> /dev/null; then
    echo "📱 扫描二维码访问:"
    qrencode -t ANSI "http://$IP:5173/test-debug.html"
fi

# 启动服务器
npx vite --host 0.0.0.0
```

使用：
```bash
chmod +x start-lan.sh
./start-lan.sh
```

---

## 总结

**最简单的方式：**

```bash
# 1. 启动局域网服务器
cd /home/ekko/Desktop/codes/zama-program/sdk
npm run debug:lan

# 2. 查看显示的Network地址
# 例如: http://192.168.1.100:5173/test-debug.html

# 3. 在手机浏览器打开这个地址

# 4. 连接MetaMask开始测试！
```

**需要帮助？**
- 检查防火墙设置
- 确认在同一WiFi
- 使用二维码快速访问
- 查看常见问题部分

祝调试顺利！📱✨
