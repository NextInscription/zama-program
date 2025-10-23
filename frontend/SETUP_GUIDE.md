# Setup Guide - Zama Private Transfer DApp

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure WalletConnect Project ID

Before running the app, you need to get a WalletConnect Project ID:

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

Then update the configuration file:

**File: `src/config/web3modal.ts`**

```typescript
// Replace this line:
projectId: 'YOUR_PROJECT_ID'

// With your actual project ID:
projectId: 'abc123def456...'  // Your actual WalletConnect Project ID
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy)

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Testing on Sepolia

### Prerequisites

1. **Web3 Wallet**: Install MetaMask or another Web3 wallet
2. **Sepolia ETH**: Get test ETH from a Sepolia faucet:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
   - [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

3. **Add Sepolia Network** to your wallet if not already added:
   - Network Name: Sepolia
   - RPC URL: https://1rpc.io/sepolia
   - Chain ID: 11155111
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.etherscan.io

### Testing Workflow

#### Test 1: Type 1 Deposit (Specified Recipient)

1. Connect your wallet
2. Go to "Deposit" tab
3. Select "Type 1: Specified Recipient"
4. Enter amount (e.g., 0.001 ETH)
5. Create a password (e.g., "test123")
6. Enter a recipient address (can be your own address for testing)
7. Click "Deposit" and confirm transaction
8. **Save the password wallet address** shown in success message

#### Test 2: Type 2 Deposit (Anyone with Password)

1. Select "Type 2: Anyone with Password"
2. Enter amount
3. Create a password
4. Click "Deposit" (no recipient address needed)
5. Save the password

#### Test 3: Type 3 Deposit (Entrusted Withdrawal)

1. Select "Type 3: Entrusted Withdrawal"
2. Enter amount
3. Create a password
4. Enter recipient address
5. Click "Deposit"
6. Save the password

#### Test Withdrawal

1. Go to "Withdraw" tab
2. Enter the password you used for deposit
3. Click "Load Vault Information"
4. Verify the vault details are decrypted correctly
5. Enter withdrawal amount
6. Click "Withdraw" and confirm transaction

#### Test Bounty Task

1. First, create a Type 3 deposit (if not already done)
2. Go to "Bounty List" tab
3. Click "Refresh" to see available tasks
4. Click on a task
5. Enter the password for that deposit
6. Click "Complete Task"
7. Check you received the commission fee

## Troubleshooting

### Build Errors

**Error: Cannot find module '@zama-fhe/relayer-sdk'**
- Solution: Run `npm install` again
- Make sure you're importing from `@zama-fhe/relayer-sdk/web`

**TypeScript errors**
- Solution: Run `npm run build` to see detailed errors
- Check that all dependencies are installed

### Runtime Errors

**Wallet won't connect**
- Make sure you've configured your WalletConnect Project ID
- Try a different wallet (MetaMask, Coinbase Wallet, etc.)
- Check browser console for errors

**Transaction fails**
- Ensure you have enough Sepolia ETH
- Check that you're on Sepolia network
- Verify contract address is correct: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`

**FHE encryption errors**
- Check browser console for WASM-related errors
- Try refreshing the page
- Ensure you're using a modern browser (Chrome, Firefox, Edge)

**Decryption fails**
- Make sure you entered the correct password
- Verify you have permission to access the vault
- Check that the vault exists (isPublished should be true)

## Development Tips

### Hot Reload

The dev server supports hot module replacement (HMR). Changes to Vue files will update instantly without full page reload.

### Browser DevTools

- Open browser DevTools (F12)
- Check Console for errors
- Use Network tab to monitor transactions
- Use Application tab to check LocalStorage/IndexedDB

### Viewing Transactions

All transactions can be viewed on [Sepolia Etherscan](https://sepolia.etherscan.io/)

Search by:
- Transaction hash
- Contract address: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`
- Your wallet address

## Project Structure Overview

```
frontend/
├── src/
│   ├── components/
│   │   ├── Deposit.vue       # Handles all 3 deposit types
│   │   ├── Withdraw.vue      # Withdrawal with decryption
│   │   └── BountyList.vue    # Bounty tasks & entrust withdraw
│   ├── config/
│   │   └── web3modal.ts      # Web3Modal & network config
│   ├── stores/
│   │   └── wallet.ts         # Wallet state management
│   ├── constant/
│   │   └── abi.json          # Smart contract ABI
│   ├── App.vue               # Main app with tabs
│   ├── main.ts               # Entry point
│   └── style.css             # Global styles
├── public/                   # Static assets
├── dist/                     # Build output (after npm run build)
├── package.json              # Dependencies
├── vite.config.ts            # Vite configuration
└── tsconfig.json             # TypeScript configuration
```

## Important Notes

### Security

- **NEVER** share your deposit passwords
- **NEVER** commit your WalletConnect Project ID to public repos
- **TEST** thoroughly on testnet before any mainnet deployment
- Store passwords securely - there's no recovery mechanism

### FHE Considerations

- FHE operations are computationally intensive
- Large bundle size (2.5MB+) is expected due to WASM modules
- First load may take a few seconds to initialize FHE libraries
- Some operations may require gas fees for KMS decryption

### Network Configuration

Currently configured for **Sepolia testnet only**. For mainnet:
1. Update contract address in `src/config/web3modal.ts`
2. Update network configuration
3. Verify contract deployment
4. Conduct thorough security audit

## Support

For issues:
1. Check this guide first
2. Review `DEVELOPMENT_LOG.md` for technical details
3. Check browser console for error messages
4. Verify contract is deployed and accessible

## Next Steps

After successful testing:
1. ✅ Verify all three deposit types work
2. ✅ Verify withdrawal and decryption work
3. ✅ Verify bounty task completion works
4. Consider adding features:
   - Transaction history
   - Refund functionality
   - Email notifications
   - Mobile responsiveness improvements
5. Prepare for mainnet deployment (if applicable)
