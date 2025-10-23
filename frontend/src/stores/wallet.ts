import { computed } from 'vue'
import { BrowserProvider, Contract } from 'ethers'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/vue'
import contractABI from '../constant/abi.json'
import { CONTRACT_ADDRESS } from '../config/web3modal'

export function useWallet() {
  const { walletProvider } = useWeb3ModalProvider()
  const { address, chainId, isConnected } = useWeb3ModalAccount()

  const provider = computed(() => {
    if (walletProvider.value && isConnected.value) {
      return new BrowserProvider(walletProvider.value)
    }
    return null
  })

  const contract = computed(() => {
    if (provider.value && isConnected.value) {
      // Note: This is synchronous access to signer, which might not work
      // We'll need to handle this differently
      return null
    }
    return null
  })

  return {
    address,
    chainId,
    isConnected,
    walletProvider,
    provider,
    contract
  }
}
