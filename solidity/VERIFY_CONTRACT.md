# 合约验证指南

## 步骤 1: 获取 Etherscan API Key

1. 访问 https://etherscan.io/register 注册账号
2. 登录后访问 https://etherscan.io/myapikey
3. 点击 "Add" 创建新的 API key
4. 复制生成的 API key

## 步骤 2: 设置 API Key 到 Hardhat

```bash
cd /home/ekko/Desktop/codes/zama-program/solidity
npx hardhat vars set ETHERSCAN_API_KEY
# 粘贴你的 API key 并回车
```

## 步骤 3: 验证已部署的合约

你的合约地址: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`

### 方法 1: 使用命令行验证

```bash
npx hardhat verify --network sepolia 0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D "PrivateTransfer"
```

注意: 第二个参数 `"PrivateTransfer"` 是合约构造函数的参数 (name)

### 方法 2: 使用验证脚本

```bash
npm run verify:contract
```

## 步骤 4: 确认验证成功

1. 访问 https://sepolia.etherscan.io/address/0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D
2. 查看 "Contract" 标签页
3. 应该能看到绿色的 ✓ 验证标记和源代码

## 常见问题

### 错误: "Already Verified"
如果合约已经被验证过,会显示此消息。检查 Etherscan 确认。

### 错误: "Constructor arguments mismatch"
确保构造函数参数正确。你的合约构造函数接受一个 string 参数 `_name`,部署时传入的是 `"PrivateTransfer"`。

### 错误: "Invalid API Key"
重新设置 API key:
```bash
npx hardhat vars set ETHERSCAN_API_KEY
```

## 验证后的好处

1. ✅ **Zama relayer 可以读取合约代码** - 解决 "Failed to check contract code" 错误
2. ✅ **用户可以在 Etherscan 上查看和验证合约逻辑**
3. ✅ **提高合约透明度和可信度**
4. ✅ **可以直接在 Etherscan 上与合约交互**
