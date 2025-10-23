# Zama Private Transfer DApp

A privacy-preserving transfer application built with Vue 3, TypeScript, and Zama's Fully Homomorphic Encryption (FHE) technology.

## Features

### 1. Three Deposit Types
- **Type 1 - Specified Recipient**: Only a designated address can withdraw the funds
- **Type 2 - Anyone with Password**: Anyone with the password can withdraw
- **Type 3 - Entrusted Withdrawal**: A trustee can withdraw on behalf of a recipient

### 2. Private Withdrawals
- Decrypt vault information using your password
- View encrypted balance, depositor, and recipient information
- Withdraw funds securely with FHE encryption

### 3. Bounty System
- Browse available entrusted withdrawal tasks
- Complete tasks and earn commission fees
- Commission calculated as: `(amount * fee / 1000) * 100`

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Wallet**: Web3Modal for wallet connections
- **Privacy**: Zama FHE (@zama-fhe/relayer-sdk)
- **State Management**: Valtio
- **Styling**: Custom CSS with dark theme

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- Sepolia testnet ETH

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure WalletConnect Project ID:
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy your Project ID
   - Update `src/config/web3modal.ts`:
     ```typescript
     projectId: 'YOUR_PROJECT_ID' // Replace with your actual project ID
     ```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Usage

### Making a Deposit

1. Connect your wallet using the "Connect Wallet" button
2. Navigate to the "Deposit" tab
3. Choose your transfer type:
   - **Type 1**: Enter recipient address for specified withdrawals
   - **Type 2**: No recipient needed - anyone with password can withdraw
   - **Type 3**: Enter recipient address for entrusted withdrawals
4. Enter deposit amount in ETH
5. Create a secure password (this will be used for withdrawals)
6. Click "Deposit" and confirm the transaction
7. Save the password wallet address displayed after successful deposit

### Withdrawing Funds

1. Navigate to the "Withdraw" tab
2. Enter your deposit password
3. Click "Load Vault Information" to decrypt your vault
4. Review the vault details (balance, type, addresses)
5. Enter the amount you want to withdraw
6. Click "Withdraw" and confirm the transaction

### Completing Bounty Tasks

1. Navigate to the "Bounty List" tab
2. Browse available tasks showing:
   - Task amount
   - Commission you'll earn
   - Total reward
3. Click on a task to select it
4. Enter the deposit password for that task
5. Click "Complete Task" to execute the entrusted withdrawal
6. Receive the commission fee upon successful completion

## Smart Contract

- **Network**: Sepolia Testnet
- **Contract Address**: `0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D`
- **RPC URL**: `https://1rpc.io/sepolia`

## Security Notes

### Password Security
- Passwords are converted to uint256 using keccak256 hash
- Private keys are derived from password hashes
- Never share your deposit password with anyone
- Store passwords securely - there's no recovery mechanism

### FHE Encryption
All sensitive data is encrypted using Zama's FHE technology:
- Transfer type
- Amount/Balance
- Addresses (depositor, recipient, password wallet)

### Privacy
- All vault information is encrypted on-chain
- Only authorized parties can decrypt data:
  - Password holder can decrypt their vault
  - Recipient can view relevant information (Type 1 & 3)
  - Trustee can complete entrusted withdrawals (Type 3)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Deposit.vue       # Deposit functionality
│   │   ├── Withdraw.vue      # Withdrawal functionality
│   │   └── BountyList.vue    # Bounty tasks list
│   ├── config/
│   │   └── web3modal.ts      # Web3Modal configuration
│   ├── stores/
│   │   └── wallet.ts         # Wallet state management
│   ├── constant/
│   │   └── abi.json          # Contract ABI
│   ├── App.vue               # Main app component
│   ├── main.ts               # App entry point
│   └── style.css             # Global styles
├── DEVELOPMENT_LOG.md        # Development progress log
└── package.json
```

## Scripts

- `npm install` - install dependencies
- `npm run dev` - start the dev server
- `npm run build` - type-check and create a production build
- `npm run preview` - preview the production build locally

## Recommended IDE Setup

Use [VS Code](https://code.visualstudio.com/) with the following extensions:

- [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## Known Issues

1. **WalletConnect Project ID**: Must be configured before deployment
2. **FHE Gateway**: Ensure the gateway URL is accessible
3. **Testnet Only**: Currently configured for Sepolia testnet only

## Roadmap

- [ ] Add transaction history
- [ ] Implement proper error boundaries
- [ ] Add refund functionality
- [ ] Support multiple networks
- [ ] Add analytics dashboard
- [ ] Implement advanced filtering for bounty tasks

## Contributing

This is a development project. For production use, ensure:
- Comprehensive testing on testnet
- Security audit
- Proper error handling
- Rate limiting
- User education materials

## License

MIT

## Support

For issues and questions:
- Check the DEVELOPMENT_LOG.md for implementation details
- Review the contract ABI for available functions
- Consult Zama documentation for FHE specifics

## Acknowledgments

- Built with [Zama FHE](https://www.zama.ai/)
- Wallet integration via [Web3Modal](https://web3modal.com/)
- Ethereum interactions with [ethers.js](https://ethers.org/)
