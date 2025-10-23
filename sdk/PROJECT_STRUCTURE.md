# Zama Private Transfer SDK - Project Structure

## Directory Structure

```
sdk/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point (exports)
│   ├── PrivateTransferSDK.ts     # Core SDK class implementation
│   ├── types.ts                  # TypeScript type definitions
│   └── constants.ts              # Contract ABI, addresses, configs
│
├── examples/                     # Usage examples
│   ├── basic-usage.ts            # Basic deposit/withdraw examples
│   ├── bounty-example.ts         # Bounty task examples
│   └── web-integration.html      # Complete web app example
│
├── dist/                         # Build output (generated)
│   ├── index.js                  # CommonJS build
│   ├── index.mjs                 # ES Module build
│   ├── index.d.ts                # TypeScript definitions
│   └── index.d.mts               # TypeScript definitions (ESM)
│
├── package.json                  # NPM package configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Complete documentation
├── QUICKSTART.md                 # Quick start guide
├── .gitignore                    # Git ignore rules
└── .npmignore                    # NPM ignore rules
```

## Core Files Overview

### `src/index.ts`
Main entry point that exports all public APIs:
- `PrivateTransferSDK` class
- Type definitions
- Enums (TransferType)
- Constants

### `src/PrivateTransferSDK.ts`
Core SDK implementation with methods:
- `initialize()` - Initialize with wallet provider
- `deposit()` - Make deposits (3 types)
- `withdraw()` - Withdraw funds
- `getVaultInfo()` - Get vault information
- `getBountyTasks()` - List bounty tasks
- `completeTask()` - Complete bounty task
- `refund()` - Refund deposit
- `getFeeRate()` - Get commission rate
- Event callbacks support

### `src/types.ts`
TypeScript type definitions:
- `TransferType` enum
- `SDKConfig` - SDK configuration
- `DepositParams` / `DepositResult`
- `WithdrawParams` / `WithdrawResult`
- `VaultInfo` - Vault information structure
- `BountyTask` - Task information
- `SDKEventCallbacks` - Event handlers
- All other interface definitions

### `src/constants.ts`
Configuration constants:
- Contract address (Sepolia)
- RPC URL
- Blackhole address
- FHE configuration (Zama)
- Complete contract ABI

## Key Features

### 1. Deposit Operations
Three types of deposits supported:
- **Type 1**: Specified recipient only
- **Type 2**: Anyone with password
- **Type 3**: Entrusted withdrawal (creates bounty)

### 2. Withdrawal Operations
- Password-based withdrawal
- Vault information retrieval
- Balance checking
- Encrypted transaction data

### 3. Bounty System
- List available tasks
- View commission rates
- Complete tasks for rewards
- Automatic commission calculation

### 4. Security Features
- FHE (Fully Homomorphic Encryption) using Zama
- Private key generation
- Encrypted vault data
- No on-chain password storage

### 5. Developer Experience
- Full TypeScript support
- Event callbacks
- Error handling
- Comprehensive documentation
- Multiple examples

## Build System

### Commands
```bash
npm run build      # Build for production (CJS + ESM + types)
npm run dev        # Watch mode for development
npm run typecheck  # Type checking without build
```

### Output Formats
- **CommonJS** (`dist/index.js`) - For Node.js
- **ES Modules** (`dist/index.mjs`) - For modern bundlers
- **TypeScript Definitions** (`dist/index.d.ts`) - For type safety

## Package Exports

The package uses modern Node.js exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

This ensures:
- Proper TypeScript support
- Tree-shaking in modern bundlers
- Backward compatibility with older tools

## Dependencies

### Runtime Dependencies
- `ethers@^6.15.0` - Ethereum interaction
- `@zama-fhe/relayer-sdk@^0.2.0` - FHE encryption

### Development Dependencies
- `typescript@^5.0.0` - TypeScript compiler
- `tsup@^8.0.0` - Build tool
- `@types/node@^20.0.0` - Node.js type definitions

## Usage Scenarios

### 1. Web Applications
```typescript
import { PrivateTransferSDK } from '@zama-private-transfer/sdk';
await sdk.initialize(window.ethereum);
```

### 2. React Applications
```tsx
import { PrivateTransferSDK, TransferType } from '@zama-private-transfer/sdk';
// Use in components with hooks
```

### 3. Vue Applications
```typescript
import { PrivateTransferSDK } from '@zama-private-transfer/sdk';
// Use with ref() and reactive()
```

### 4. Node.js Scripts
```javascript
const { PrivateTransferSDK } = require('@zama-private-transfer/sdk');
// Provide custom provider/signer
```

## Testing Checklist

- [x] TypeScript compilation
- [x] Build output (CJS + ESM)
- [x] Type definitions generation
- [x] Dependency installation
- [ ] Unit tests (to be added)
- [ ] Integration tests (to be added)
- [ ] Web browser testing

## Contract Information

- **Network**: Sepolia Testnet
- **Contract Address**: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`
- **RPC URL**: `https://1rpc.io/sepolia`
- **Chain ID**: 11155111

## Security Considerations

1. **Private Key Storage**: Users must securely store password keys
2. **Testnet Only**: Currently deployed on Sepolia testnet
3. **Gas Fees**: All operations require ETH for gas
4. **FHE Encryption**: All sensitive data encrypted with Zama FHE
5. **No Password Recovery**: Lost passwords cannot be recovered

## Future Enhancements

Potential improvements:
- [ ] Unit test suite
- [ ] Integration tests
- [ ] Mainnet deployment support
- [ ] Multiple network support
- [ ] Enhanced error messages
- [ ] Transaction retry logic
- [ ] Gas estimation helpers
- [ ] Batch operations
- [ ] Event listening (contract events)
- [ ] Transaction history

## Version History

- **v1.0.0** - Initial release
  - Core deposit/withdraw functionality
  - Bounty task system
  - Refund support
  - TypeScript SDK
  - Comprehensive documentation

## License

MIT License

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check documentation in README.md
- Review examples in examples/
- Test with web-integration.html
