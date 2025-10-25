<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '../stores/wallet'
import { BrowserProvider, Contract, Wallet, parseEther, formatEther as ethersFormatEther, hexlify } from 'ethers'
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web'
import { CONTRACT_ADDRESS } from '../config/web3modal'
import contractABI from '../constant/abi.json'

const { address, chainId, isConnected, walletProvider } = useWallet()
let fheInstance: any = null

// Initialize FHE instance on demand
async function getFheInstance() {
  if (!fheInstance) {
    fheInstance = await createInstance(SepoliaConfig)
  }
  return fheInstance
}
const privateKey = ref('')
const withdrawAmount = ref('')
const loading = ref(false)
const loadingVault = ref(false)
const loadingRefund = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const vaultInfo = ref<any>(null)

const isWalletConnected = computed(() => isConnected.value)
const hasVaultInfo = computed(() => vaultInfo.value !== null)
const hasBalance = computed(() => vaultInfo.value && parseFloat(vaultInfo.value.balance) > 0)

async function loadVaultInfo() {
  if (!walletProvider.value || !isConnected.value) {
    showMessage('Please connect your wallet first', 'error')
    return
  }

  if (!privateKey.value) {
    showMessage('Please enter your private key', 'error')
    return
  }

  try {
    loadingVault.value = true
    message.value = ''
    vaultInfo.value = null

    // Get provider and contract
    const provider = new BrowserProvider(walletProvider.value)
    const signer = await provider.getSigner()
    const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer)

    // Create wallet from private key
    const wallet = new Wallet(privateKey.value)
    const privateKeyUint256 = BigInt(wallet.privateKey)

    // Get vault info from contract
    const vault = await contract.getVault(privateKeyUint256)
    console.log(vault)
    if (!vault.isPublished) {
      showMessage('No vault found for this private key', 'error')
      return
    }

    // Decrypt vault information using userDecrypt
    try {
      const fhe = await getFheInstance()

      // Generate keypair for decryption
      const keypair = fhe.generateKeypair()

      // Store handles as strings
      const transferTypeHandle = hexlify(vault.transferType)
      const balanceHandle = hexlify(vault.balance)
      const depositorHandle = hexlify(vault.depositor)
      const allowAddressHandle = hexlify(vault.allowAddress)

      // Prepare handle-contract pairs
      const handleContractPairs = [
        { handle: transferTypeHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: balanceHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: depositorHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: allowAddressHandle, contractAddress: CONTRACT_ADDRESS }
      ]

      // Create EIP712 signature request
      const startTimeStamp = Math.floor(Date.now() / 1000).toString()
      const durationDays = '10'
      const contractAddresses = [CONTRACT_ADDRESS]

      const eip712 = fhe.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      )

      // Sign with the private key wallet
      const signature = await wallet.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      )

      // Perform user decryption
      const result = await fhe.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        wallet.address,
        startTimeStamp,
        durationDays
      )
      vaultInfo.value = {
        transferType: Number(result[transferTypeHandle]),
        balance: result[balanceHandle].toString(),
        depositor: result[depositorHandle].toString(),
        allowAddress: result[allowAddressHandle].toString(),
        walletAddress: wallet.address
      }
      showMessage('Vault information loaded successfully', 'success')
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      showMessage('Failed to decrypt vault information. You may not have permission to access this vault.', 'error')
    }

  } catch (error: any) {
    console.error('Load vault error:', error)
    showMessage(error.message || 'Failed to load vault information', 'error')
  } finally {
    loadingVault.value = false
  }
}

async function handleWithdraw() {
  if (!walletProvider.value || !isConnected.value) {
    showMessage('Please connect your wallet first', 'error')
    return
  }

  if (!hasVaultInfo.value) {
    showMessage('Please load vault information first', 'error')
    return
  }

  if (!withdrawAmount.value || parseFloat(withdrawAmount.value) <= 0) {
    showMessage('Please enter a valid withdrawal amount', 'error')
    return
  }

  try {
    loading.value = true
    message.value = ''

    // Get provider and contract
    const provider = new BrowserProvider(walletProvider.value)
    const signer = await provider.getSigner()
    const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer)

    const wallet = new Wallet(privateKey.value)
    const privateKeyUint256 = BigInt(wallet.privateKey)

    const amountWei = parseEther(withdrawAmount.value.toString())

    // Encrypt private key and amount
    const fhe = await getFheInstance()
    const encryptedInput = await fhe
      .createEncryptedInput(CONTRACT_ADDRESS, address.value!)
      .add256(privateKeyUint256)
      .add256(BigInt(amountWei.toString()))
      .encrypt()

    const handles = encryptedInput.handles.map((h: Uint8Array) => hexlify(h))
    const inputProof = hexlify(encryptedInput.inputProof)

    // Call withdraw function
    const tx = await contract.withdraw(
      handles[0],
      handles[1],
      inputProof
    )

    showMessage('Withdrawal transaction submitted. Waiting for confirmation...', 'success')

    await tx.wait()

    showMessage('Withdrawal successful!', 'success')

    // Reset form
    withdrawAmount.value = ''
    vaultInfo.value = null
    privateKey.value = ''

  } catch (error: any) {
    console.error('Withdrawal error:', error)
    showMessage(error.message || 'Withdrawal failed', 'error')
  } finally {
    loading.value = false
  }
}

async function handleRefund() {
  if (!walletProvider.value || !isConnected.value) {
    showMessage('Please connect your wallet first', 'error')
    return
  }

  if (!hasVaultInfo.value) {
    showMessage('Please load vault information first', 'error')
    return
  }

  if (!hasBalance.value) {
    showMessage('No balance to refund', 'error')
    return
  }

  try {
    loadingRefund.value = true
    message.value = ''

    // Get provider and contract
    const provider = new BrowserProvider(walletProvider.value)
    const signer = await provider.getSigner()
    const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer)

    const wallet = new Wallet(privateKey.value)
    const privateKeyUint256 = BigInt(wallet.privateKey)

    // Encrypt private key
    const fhe = await getFheInstance()
    const encryptedInput = await fhe
      .createEncryptedInput(CONTRACT_ADDRESS, address.value!)
      .add256(privateKeyUint256)
      .encrypt()

    const handle = hexlify(encryptedInput.handles[0])
    const inputProof = hexlify(encryptedInput.inputProof)

    // Call refund function
    const tx = await contract.refund(handle, inputProof)

    showMessage('Refund transaction submitted. Waiting for confirmation...', 'success')

    await tx.wait()

    showMessage('Refund successful! All funds have been returned.', 'success')

    // Reset form
    withdrawAmount.value = ''
    vaultInfo.value = null
    privateKey.value = ''

  } catch (error: any) {
    console.error('Refund error:', error)
    showMessage(error.message || 'Refund failed', 'error')
  } finally {
    loadingRefund.value = false
  }
}

function showMessage(msg: string, type: 'success' | 'error') {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    if (messageType.value === type) {
      message.value = ''
      messageType.value = ''
    }
  }, 5000)
}

function formatEther(wei: string): string {
  try {
    return ethersFormatEther(wei)
  } catch {
    return '0'
  }
}

function getTransferTypeName(type: number): string {
  const types: Record<number, string> = {
    1: 'Specified Recipient',
    2: 'Anyone with Password',
    3: 'Entrusted Withdrawal'
  }
  return types[type] || 'Unknown'
}
</script>

<template>
  <div class="withdraw">
    <div class="card">
      <h2>Withdraw Funds</h2>
      <p class="text-secondary">Enter your private key to access and withdraw from your vault</p>

      <div v-if="!isWalletConnected" class="warning">
        <p>Please connect your wallet to withdraw funds</p>
      </div>

      <div v-else class="form">
        <div class="form-group">
          <label for="privateKey">Private Key</label>
          <input id="privateKey" v-model="privateKey" type="password" placeholder="Enter your vault private key"
            :disabled="loading || loadingVault || loadingRefund" />
        </div>

        <button class="secondary-button" :disabled="loadingVault || loading || loadingRefund || !privateKey"
          @click="loadVaultInfo">
          {{ loadingVault ? 'Loading...' : 'Load Vault Information' }}
        </button>

        <div v-if="hasVaultInfo" class="vault-info">
          <h3>Vault Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Transfer Type:</span>
              <span class="info-value">{{ getTransferTypeName(vaultInfo.transferType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Balance:</span>
              <span class="info-value text-success">{{ formatEther(vaultInfo.balance) }} ETH</span>
            </div>
            <div class="info-item">
              <span class="info-label">Wallet Address:</span>
              <span class="info-value small">{{ vaultInfo.walletAddress }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Depositor:</span>
              <span class="info-value small">{{ vaultInfo.depositor }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Allowed Address:</span>
              <span class="info-value small">{{ vaultInfo.allowAddress }}</span>
            </div>
          </div>

          <div class="form-group" style="margin-top: 2rem;">
            <label for="withdrawAmount">Withdrawal Amount (ETH)</label>
            <input id="withdrawAmount" v-model="withdrawAmount" type="number" step="0.001" min="0"
              :max="formatEther(vaultInfo.balance)" placeholder="0.0" :disabled="loading || loadingRefund" />
            <p class="hint">
              Maximum: {{ formatEther(vaultInfo.balance) }} ETH
            </p>
          </div>

          <div class="button-group">
            <button class="submit-button" :disabled="loading || loadingRefund || !withdrawAmount"
              @click="handleWithdraw">
              {{ loading ? 'Processing...' : 'Withdraw' }}
            </button>

            <button v-if="hasBalance" class="refund-button" :disabled="loading || loadingRefund" @click="handleRefund">
              {{ loadingRefund ? 'Processing...' : 'Refund All' }}
            </button>
          </div>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.withdraw {
  max-width: 800px;
  margin: 0 auto;
}

.form {
  margin-top: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.secondary-button {
  width: 100%;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.secondary-button:hover {
  background-color: var(--bg-card);
  border-color: var(--primary-color);
}

.vault-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.vault-info h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.3em;
  color: var(--primary-color);
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--bg-card);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  word-break: break-all;
}

.info-value.small {
  font-size: 0.85em;
  font-family: monospace;
}

.warning {
  padding: 1rem;
  background-color: rgba(255, 170, 0, 0.1);
  border: 1px solid var(--warning-color);
  border-radius: 8px;
  text-align: center;
  margin-top: 1.5rem;
}

.warning p {
  margin: 0;
  color: var(--warning-color);
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-button {
  flex: 1;
}

.refund-button {
  flex: 1;
  background-color: #ff6b6b;
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.refund-button:hover:not(:disabled) {
  background-color: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
}

.refund-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.message.success {
  background-color: rgba(0, 214, 143, 0.1);
  border: 1px solid var(--success-color);
  color: var(--success-color);
}

.message.error {
  background-color: rgba(255, 56, 96, 0.1);
  border: 1px solid var(--error-color);
  color: var(--error-color);
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }
}
</style>
