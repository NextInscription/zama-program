#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 清屏
clear

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🚀 Zama SDK 局域网调试启动器 🚀                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 获取IP地址
echo -e "${YELLOW}📡 正在获取网络信息...${NC}"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')

if [ -z "$IP" ]; then
    # 备用方法
    IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+')
fi

if [ -z "$IP" ]; then
    echo -e "${RED}❌ 无法获取IP地址${NC}"
    echo "请手动检查网络连接"
    exit 1
fi

echo -e "${GREEN}✓ 本机IP: ${IP}${NC}"
echo ""

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 检测到未安装依赖，正在安装...${NC}"
    npm install
    echo ""
fi

# 构建SDK
echo -e "${YELLOW}🔨 正在构建SDK...${NC}"
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SDK构建成功${NC}"
else
    echo -e "${RED}❌ SDK构建失败${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 服务器访问地址：${NC}"
echo ""
echo -e "${BLUE}  💻 本地访问:${NC}"
echo -e "     http://localhost:5173/test-debug.html"
echo ""
echo -e "${PURPLE}  📱 局域网访问:${NC}"
echo -e "     http://${IP}:5173/test-debug.html"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 生成二维码（如果安装了qrencode）
if command -v qrencode &> /dev/null; then
    echo -e "${YELLOW}📱 手机扫描二维码访问:${NC}"
    echo ""
    qrencode -t ANSI "http://${IP}:5173/test-debug.html"
    echo ""
else
    echo -e "${YELLOW}💡 提示: 安装 qrencode 可以显示二维码${NC}"
    echo "   sudo apt-get install qrencode"
    echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 使用说明：${NC}"
echo ""
echo "  1. 确保手机和电脑在同一WiFi网络"
echo "  2. 在手机浏览器打开上面的局域网地址"
echo "  3. 使用MetaMask Mobile连接钱包"
echo "  4. 切换到Sepolia测试网"
echo "  5. 开始测试SDK功能"
echo ""
echo -e "${YELLOW}⚠️  注意事项：${NC}"
echo "  • 确保防火墙允许5173端口"
echo "  • 建议使用MetaMask Mobile内置浏览器"
echo "  • 需要Sepolia测试网ETH"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🚀 正在启动服务器...${NC}"
echo -e "${YELLOW}   按 Ctrl+C 停止服务器${NC}"
echo ""

# 启动服务器
npx vite --host 0.0.0.0
