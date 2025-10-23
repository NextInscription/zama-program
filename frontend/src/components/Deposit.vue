<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '../stores/wallet'
import { BrowserProvider, Contract, Wallet, HDNodeWallet } from 'ethers'
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { BLACKHOLE_ADDRESS, CONTRACT_ADDRESS } from '../config/web3modal'
import contractABI from '../constant/abi.json'
type TransferType = 1 | 2 | 3
// Initialize FHE instance
const { address, chainId, isConnected, walletProvider } = useWallet()
const transferType = ref<TransferType>(1)
const amount = ref('')
const allowAddress = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const generatedWallet = ref<HDNodeWallet | null>(null)
const showConfirmModal = ref(false)
const hasConfirmedBackup = ref(false)
const displayPrivateKey = ref('')
const displayAddress = ref('')

const transferTypeOptions = [
  { value: 1, label: 'Type 1: Specified Recipient', description: 'Only the specified recipient can withdraw' },
  { value: 2, label: 'Type 2: Anyone with Password', description: 'Anyone with the password can withdraw' },
  { value: 3, label: 'Type 3: Entrusted Withdrawal', description: 'Trustee withdraws on behalf of recipient' }
]

const isWalletConnected = computed(() => isConnected.value)
const showAllowAddress = computed(() => transferType.value === 1 || transferType.value === 3)
const allowAddressPlaceholder = computed(() => {
  if (transferType.value === 1) return 'Enter recipient address'
  if (transferType.value === 3) return 'Enter recipient address for trustee'
  return ''
})

function selectTransferType(type: TransferType) {
  transferType.value = type
  if (type === 2) {
    allowAddress.value = ''
  }
}

function generateWallet() {
  const wallet = Wallet.createRandom()
  // Extract values BEFORE storing in reactive ref to avoid Vue proxy issues
  displayPrivateKey.value = wallet.privateKey
  displayAddress.value = wallet.address
  // Store the wallet object (it won't be accessed in template)
  generatedWallet.value = wallet
}

function prepareDeposit() {
  if (!isConnected.value) {
    showMessage('Please connect your wallet first', 'error')
    return
  }

  if (!amount.value || parseFloat(amount.value) <= 0) {
    showMessage('Please enter a valid amount', 'error')
    return
  }

  if (showAllowAddress.value && !allowAddress.value) {
    showMessage('Please enter the recipient address', 'error')
    return
  }

  // Generate wallet and show confirmation modal
  generateWallet()
  showConfirmModal.value = true
  hasConfirmedBackup.value = false
}

function closeModal() {
  showConfirmModal.value = false
  generatedWallet.value = null
  hasConfirmedBackup.value = false
  displayPrivateKey.value = ''
  displayAddress.value = ''
}

async function copyPrivateKey() {
  if (!displayPrivateKey.value) {
    showMessage('No private key to copy', 'error')
    return
  }

  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(displayPrivateKey.value)
      showMessage('Private key copied to clipboard!', 'success')
    } else {
      // Fallback to execCommand for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = displayPrivateKey.value
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        const successful = document.execCommand('copy')
        if (successful) {
          showMessage('Private key copied to clipboard!', 'success')
        } else {
          showMessage('Failed to copy. Please copy manually.', 'error')
        }
      } catch (err) {
        console.error('Fallback copy failed:', err)
        showMessage('Failed to copy. Please copy manually.', 'error')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error: any) {
    console.error('Copy error:', error)
    showMessage(`Copy failed: ${error.message}. Please copy manually.`, 'error')
  }
}

async function handleDeposit() {
  if (!generatedWallet.value) {
    showMessage('Please generate a wallet first', 'error')
    return
  }

  if (!hasConfirmedBackup.value) {
    showMessage('Please confirm you have backed up the private key', 'error')
    return
  }

  try {
    loading.value = true
    showConfirmModal.value = false
    message.value = ''

    // Use the extracted private key and address (not from reactive ref)
    const passwordUint256 = BigInt(displayPrivateKey.value)
    const passwordAddress = displayAddress.value

    // Get provider and contract
    if (!walletProvider.value) {
      throw new Error('Wallet provider not available')
    }
    const provider = new BrowserProvider(walletProvider.value)
    const signer = await provider.getSigner()
    const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer)

    // Check signer address matches wallet address
    const signerAddress = await signer.getAddress()
    console.log('Wallet address:', address.value)
    console.log('Signer address:', signerAddress)
    console.log('Contract address:', CONTRACT_ADDRESS)

    if (signerAddress.toLowerCase() !== address.value!.toLowerCase()) {
      throw new Error('Signer address does not match wallet address')
    }

    // Encrypt all parameters in one input
    const targetAddress = transferType.value === 2 ? BLACKHOLE_ADDRESS : allowAddress.value
    console.log('Encryption params:', {
      password: passwordUint256.toString(),
      transferType: transferType.value,
      passwordAddress,
      targetAddress
    })

    const fheInstance = await createInstance(SepoliaConfig)
    console.log('FHE Instance created:', fheInstance)
    console.log('Creating encrypted input for contract:', CONTRACT_ADDRESS, 'user:', signerAddress)

    const input = fheInstance.createEncryptedInput(CONTRACT_ADDRESS, signerAddress)
    console.log('Encrypted input created successfully')
    input.add256(passwordUint256)
    input.add256(BigInt(transferType.value))
    input.addAddress(passwordAddress)
    input.addAddress(targetAddress)

    console.log('Starting encryption...')
    const encryptedInput = await input.encrypt()
    console.log('Encryption completed')

    // The encrypted data structure contains handles and inputProof
    const handles = encryptedInput.handles
    const inputProof = encryptedInput.inputProof

    console.log('Encrypted handles:', handles)
    console.log('Input proof length:', inputProof.length)

    // Call deposit function
    // Contract expects: externalEuint256, externalEuint256, externalEaddress, externalEaddress, bytes
    const tx = await contract.deposit(
      handles[0],  // password
      handles[1],  // transferType
      handles[2],  // passwordAddress
      handles[3],  // allowAddress
      inputProof,
      { value: BigInt(parseFloat(amount.value) * 1e18) }
    )

    showMessage('Transaction submitted. Waiting for confirmation...', 'success')

    await tx.wait()

    showMessage(`Deposit successful! Password wallet address: ${passwordAddress}`, 'success')

    // Reset form
    amount.value = ''
    allowAddress.value = ''
    generatedWallet.value = null
    hasConfirmedBackup.value = false
    displayPrivateKey.value = ''
    displayAddress.value = ''

  } catch (error: any) {
    console.error('Deposit error:', error)
    showMessage(error.message || 'Deposit failed', 'error')
  } finally {
    loading.value = false
  }
}

function showMessage(msg: string, type: 'success' | 'error') {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 5000)
}
</script>

<template>
  <div class="deposit">
    <div class="card">
      <h2>Deposit Funds</h2>
      <p class="text-secondary">Choose a deposit type and make a private transfer</p>

      <div v-if="!isWalletConnected" class="warning">
        <p>Please connect your wallet to make a deposit</p>
      </div>

      <div v-else class="form">
        <div class="form-group">
          <label>Transfer Type</label>
          <div class="transfer-types">
            <div v-for="option in transferTypeOptions" :key="option.value"
              :class="['transfer-type-card', { active: transferType === option.value }]"
              @click="selectTransferType(option.value as TransferType)">
              <div class="type-header">
                <span class="type-label">{{ option.label }}</span>
                <span v-if="transferType === option.value" class="checkmark">✓</span>
              </div>
              <p class="type-description">{{ option.description }}</p>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="amount">Amount (ETH)</label>
          <input id="amount" v-model="amount" type="number" step="0.001" min="0" placeholder="0.0"
            :disabled="loading" />
        </div>

        <div v-if="showAllowAddress" class="form-group">
          <label for="allowAddress">Recipient Address</label>
          <input id="allowAddress" v-model="allowAddress" type="text" :placeholder="allowAddressPlaceholder"
            :disabled="loading" />
        </div>

        <div class="info-box">
          <p><strong>Note:</strong> A random private key will be generated for this deposit. You MUST save it to
            withdraw funds later.</p>
        </div>

        <button class="submit-button" :disabled="loading || !isWalletConnected" @click="prepareDeposit">
          {{ loading ? 'Processing...' : 'Continue to Deposit' }}
        </button>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Backup Your Private Key</h3>
          <button class="close-button" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="warning-box">
            <p><strong>⚠️ IMPORTANT WARNING</strong></p>
            <p>Save this private key immediately. You will need it to withdraw your funds.</p>
            <p><strong>This key will NEVER be shown again!</strong></p>
          </div>

          <div class="key-display">
            <label>Private Key:</label>
            <input type="text" class="key-value-input" :value="displayPrivateKey" readonly
              @click="($event.target as HTMLInputElement).select()" />
            <button class="copy-button" @click="copyPrivateKey">
              📋 Copy to Clipboard
            </button>
          </div>

          <div class="wallet-info">
            <div class="info-row">
              <span class="info-label">Withdrawal Address:</span>
              <span class="info-value">{{ displayAddress }}</span>
            </div>
          </div>

          <div class="confirmation-checkbox">
            <label>
              <input type="checkbox" v-model="hasConfirmedBackup" />
              <span>I have securely saved the private key and understand it cannot be recovered if lost</span>
            </label>
          </div>

          <div class="modal-actions">
            <button class="secondary-button" @click="closeModal">
              Cancel
            </button>
            <button class="submit-button" :disabled="!hasConfirmedBackup || loading" @click="handleDeposit">
              {{ loading ? 'Processing...' : 'Confirm & Deposit' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deposit {
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

.transfer-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.transfer-type-card {
  padding: 1rem;
  background-color: var(--bg-hover);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.transfer-type-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.transfer-type-card.active {
  border-color: var(--primary-color);
  background-color: rgba(110, 84, 255, 0.1);
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.type-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.checkmark {
  color: var(--primary-color);
  font-size: 1.2rem;
  font-weight: bold;
}

.type-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
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

.info-box {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: rgba(110, 84, 255, 0.1);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
}

.info-box p {
  margin: 0;
  color: var(--text-primary);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--primary-color);
}

.close-button {
  background: none;
  border: none;
  font-size: 2em;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: none;
}

.close-button:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  transform: none;
}

.modal-body {
  padding: 1.5rem;
}

.warning-box {
  padding: 1rem;
  background-color: rgba(255, 170, 0, 0.1);
  border: 2px solid var(--warning-color);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.warning-box p {
  margin: 0.5rem 0;
  color: var(--warning-color);
}

.warning-box p:first-child {
  font-size: 1.1em;
}

.key-display {
  margin: 1.5rem 0;
}

.key-display label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.key-value {
  padding: 1rem;
  background-color: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9em;
  word-break: break-all;
  color: var(--success-color);
  margin-bottom: 1rem;
}

.key-value-input {
  padding: 1rem;
  background-color: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9em;
  color: var(--success-color);
  margin-bottom: 1rem;
  cursor: pointer;
  width: 100%;
}

.key-value-input:focus {
  border-color: var(--success-color);
  box-shadow: 0 0 0 3px rgba(0, 214, 143, 0.1);
}

.copy-button {
  width: 100%;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  box-shadow: none;
  padding: 12px 24px;
  font-size: 1em;
}

.copy-button:hover {
  background-color: var(--bg-card);
  border-color: var(--primary-color);
}

.wallet-info {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: var(--bg-hover);
  border-radius: 8px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9em;
}

.info-value {
  font-family: monospace;
  font-size: 0.85em;
  color: var(--text-primary);
  word-break: break-all;
}

.confirmation-checkbox {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: var(--bg-hover);
  border-radius: 8px;
}

.confirmation-checkbox label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.confirmation-checkbox input[type="checkbox"] {
  width: auto;
  margin-top: 0.25rem;
  cursor: pointer;
}

.confirmation-checkbox span {
  flex: 1;
  color: var(--text-primary);
  font-size: 0.95em;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  align-items: center;
}

.modal-actions button {
  flex: 1;
  padding: 12px 24px;
  font-size: 1em;
  font-weight: 600;
}

.modal-actions .secondary-button {
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  width: 100%;
  margin-top: 1rem;
  box-shadow: none;
}

.modal-actions .secondary-button:hover {
  background-color: var(--bg-card);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .transfer-types {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
