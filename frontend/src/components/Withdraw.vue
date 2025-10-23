<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '../stores/wallet'
import { BrowserProvider, Contract, Wallet, keccak256, parseEther, hexlify } from 'ethers'
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web'
import { CONTRACT_ADDRESS } from '../config/web3modal'
import contractABI from '../constant/abi.json'

// Initialize FHE instance
const fheInstance = await createInstance(SepoliaConfig)
const { address, chainId, isConnected, walletProvider } = useWallet()
const password = ref('')
const withdrawAmount = ref('')
const loading = ref(false)
const loadingVault = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const vaultInfo = ref<any>(null)

const isWalletConnected = computed(() => isConnected.value)
const hasVaultInfo = computed(() => vaultInfo.value !== null)

async function loadVaultInfo() {
  if (!walletProvider.value || !isConnected.value) {
    showMessage('Please connect your wallet first', 'error')
    return
  }

  if (!password.value) {
    showMessage('Please enter your password', 'error')
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

    // Generate password wallet from password
    const passwordWallet = new Wallet(keccak256(Buffer.from(password.value)))
    const passwordUint256 = BigInt(passwordWallet.privateKey)

    // Get vault info from contract
    const vault = await contract.getVault(passwordUint256)

    if (!vault.isPublished) {
      showMessage('No vault found for this password', 'error')
      return
    }

    // Decrypt vault information using publicDecrypt
    // Note: In production, you might need to use userDecrypt with proper authentication
    try {
      const handles = [
        hexlify(vault.transferType),
        hexlify(vault.balance),
        hexlify(vault.depositor),
        hexlify(vault.allowAddress)
      ]

      const decrypted = await fheInstance.publicDecrypt(handles)

      vaultInfo.value = {
        transferType: Number(decrypted[handles[0]]),
        balance: decrypted[handles[1]].toString(),
        depositor: decrypted[handles[2]].toString(),
        allowAddress: decrypted[handles[3]].toString(),
        passwordAddress: passwordWallet.address
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

    const passwordWallet = new Wallet(keccak256(Buffer.from(password.value)))
    const passwordUint256 = BigInt(passwordWallet.privateKey)

    const amountWei = parseEther(withdrawAmount.value)

    // Encrypt password and amount
    const encryptedInput = await fheInstance
      .createEncryptedInput(CONTRACT_ADDRESS, address.value!)
      .add256(passwordUint256)
      .add256(BigInt(amountWei.toString()))
      .encrypt()

    const handles = encryptedInput.handles.map(h => hexlify(h))
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
    password.value = ''

  } catch (error: any) {
    console.error('Withdrawal error:', error)
    showMessage(error.message || 'Withdrawal failed', 'error')
  } finally {
    loading.value = false
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
    return (BigInt(wei) / BigInt(1e18)).toString()
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
      <p class="text-secondary">Enter your password to access and withdraw from your vault</p>

      <div v-if="!isWalletConnected" class="warning">
        <p>Please connect your wallet to withdraw funds</p>
      </div>

      <div v-else class="form">
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your deposit password"
            :disabled="loading || loadingVault"
          />
        </div>

        <button
          class="secondary-button"
          :disabled="loadingVault || loading || !password"
          @click="loadVaultInfo"
        >
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
              <span class="info-label">Password Address:</span>
              <span class="info-value small">{{ vaultInfo.passwordAddress }}</span>
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
            <input
              id="withdrawAmount"
              v-model="withdrawAmount"
              type="number"
              step="0.001"
              min="0"
              :max="formatEther(vaultInfo.balance)"
              placeholder="0.0"
              :disabled="loading"
            />
            <p class="hint">
              Maximum: {{ formatEther(vaultInfo.balance) }} ETH
            </p>
          </div>

          <button
            class="submit-button"
            :disabled="loading || !withdrawAmount"
            @click="handleWithdraw"
          >
            {{ loading ? 'Processing...' : 'Withdraw' }}
          </button>
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

.submit-button {
  width: 100%;
  margin-top: 1rem;
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
</style>
