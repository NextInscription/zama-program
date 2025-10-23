# Etherscan 验证指南 - Standard JSON Input 方式

## 为什么需要使用 Standard JSON Input?

你的合约使用了多个导入和库,flattened 文件包含多个合约定义。使用 **Solidity (Standard Json Input)** 模式可以让 Etherscan 正确识别并编译目标合约。

## 步骤 1: 生成 Standard JSON Input

运行以下命令:

```bash
cd /home/ekko/Desktop/codes/zama-program/solidity
npx hardhat verify --network sepolia --show-stack-traces 0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D "PrivateTransfer" > verify-output.txt 2>&1
```

这会生成包含 standard JSON 的输出。

## 步骤 2: 访问 Etherscan 验证页面

https://sepolia.etherscan.io/verifyContract?a=0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D

## 步骤 3: 选择 Standard JSON Input

- **Compiler Type**: 选择 **Solidity (Standard Json Input)**
- **Compiler Version**: 选择 **v0.8.27+commit.40a35a09**
- **Open Source License**: 选择 **3) MIT License**

点击 **Continue**

## 步骤 4: 填写 Standard JSON Input

### 方法 A: 使用 Hardhat 生成的 JSON (推荐)

1. 找到项目的编译 artifacts:
```bash
cat artifacts/build-info/*.json
```

2. 从 build-info JSON 中提取 `input` 部分

### 方法 B: 手动创建 Standard JSON

创建一个文件 `standard-input.json`:

```json
{
  "language": "Solidity",
  "sources": {
    "contracts/PrivateTransfer/PrivateTransfer.sol": {
      "content": "需要粘贴完整的合约源码"
    }
  },
  "settings": {
    "optimizer": {
      "enabled": true,
      "runs": 800
    },
    "evmVersion": "cancun",
    "viaIR": true,
    "metadata": {
      "bytecodeHash": "none"
    }
  }
}
```

## 步骤 5: 简化方法 - 使用 Hardhat 任务直接生成

让我为你创建一个脚本自动生成 Standard JSON...

## 最简单的方法: 使用 Sourcify

Sourcify 是一个自动化验证服务,支持 Hardhat artifacts。

1. 访问: https://sourcify.dev/
2. 上传 `artifacts/contracts/PrivateTransfer/PrivateTransfer.json`
3. 上传 `artifacts/build-info/*.json`
4. 填写合约地址和网络信息
5. 点击 Verify

验证成功后,Etherscan 会自动同步验证状态。
