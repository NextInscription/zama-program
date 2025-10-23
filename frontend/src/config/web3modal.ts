import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/vue'

// Contract configuration
export const CONTRACT_ADDRESS = '0x8ea2dDD9DD550d500B4cef4C560fE27cde37508D'
export const SEPOLIA_RPC = 'https://1rpc.io/sepolia'
export const BLACKHOLE_ADDRESS = '0x0000000000000000000000000000000000000000'

// Chain configuration
const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: SEPOLIA_RPC
}

// Metadata
const metadata = {
  name: 'Zama Private Transfer',
  description: 'Privacy-preserving transfer application built with Zama FHE',
  url: 'https://zama-transfer.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create Web3Modal
export const web3Modal = createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [sepolia],
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6e54ff',
    '--w3m-border-radius-master': '4px'
  }
})
