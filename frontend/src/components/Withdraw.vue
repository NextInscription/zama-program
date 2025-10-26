<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '../stores/wallet'
import { useSDKStore } from '../stores/sdkStore'
import { formatEther as ethersFormatEther } from 'ethers'
import type { VaultInfo } from '@zama-private-transfer/sdk'

const { isConnected } = useWallet()
const sdkStore = useSDKStore()

const privateKey = ref('')
const withdrawAmount = ref('')
const loading = ref(false)
const loadingVault = ref(false)
const loadingRefund = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const vaultInfo = ref<VaultInfo | null>(null)

const isWalletConnected = computed(() => isConnected.value)
const hasVaultInfo = computed(() => vaultInfo.value !== null && vaultInfo.value.isPublished)
const hasBalance = computed(() => vaultInfo.value && parseFloat(vaultInfo.value.balanceEth) > 0)

// SDK 会在钱包连接时自动初始化（通过 Pinia store 的 watch）
// 不需要手动初始化！

async function loadVaultInfo() {
  if (!isConnected.value) {
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

    // 获取 SDK 实例（Pinia store 确保已初始化）
    const sdk = await sdkStore.getSDK()
    console.log(privateKey.value)
    // Get vault info using SDK
    const vault = await sdk.getVaultInfo(privateKey.value)

    if (!vault.isPublished) {
      showMessage('No vault found for this private key', 'error')
      return
    }

    vaultInfo.value = vault
    showMessage('Vault information loaded successfully', 'success')

  } catch (error: any) {
    console.error('Load vault error:', error)
    showMessage(error.message || 'Failed to load vault information', 'error')
  } finally {
    loadingVault.value = false
  }
}

async function handleWithdraw() {
  if (!isConnected.value) {
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
  loading.value = true
  message.value = ''
  setTimeout(async () => {
    try {

      // 获取 SDK 实例（Pinia store 确保已初始化）
      const sdk = await sdkStore.getSDK()

      showMessage('Submitting withdrawal transaction...', 'success')
      console.log(withdrawAmount.value)
      // Use SDK to withdraw
      const result = await sdk.withdraw({
        privateKey: privateKey.value,
        amount: withdrawAmount.value + '',
      })

      showMessage(
        `Withdrawal successful! ${result.amount} ETH withdrawn. Transaction: ${result.transactionHash.substring(0, 10)}...`,
        'success'
      )

      console.log('Withdrawal result:', result)

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
  }, 20);
}

async function handleRefund() {
  if (!isConnected.value) {
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

    // 获取 SDK 实例（Pinia store 确保已初始化）
    const sdk = await sdkStore.getSDK()

    showMessage('Submitting refund transaction...', 'success')

    // Use SDK to refund
    const result = await sdk.refund({
      privateKey: privateKey.value,
    })

    showMessage(
      `Refund successful! ${result.amount} ETH refunded. Transaction: ${result.transactionHash.substring(0, 10)}...`,
      'success'
    )

    console.log('Refund result:', result)

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
    return wei ? ethersFormatEther(wei) : '0'
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

        <div v-if="hasVaultInfo && vaultInfo" class="vault-info">
          <h3>Vault Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Transfer Type:</span>
              <span class="info-value">{{ getTransferTypeName(vaultInfo.transferType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Balance:</span>
              <span class="info-value text-success">{{ vaultInfo.balanceEth }} ETH</span>
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
            <input id="withdrawAmount" v-model="withdrawAmount" type="number" step="0.001" min="0"
              :max="vaultInfo.balanceEth" placeholder="0.0" :disabled="loading || loadingRefund" />
            <p class="hint">
              Maximum: {{ vaultInfo.balanceEth }} ETH
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
