<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWallet } from '../stores/wallet'
import { useSDKStore } from '../stores/sdkStore'
import { formatEther as ethersFormatEther } from 'ethers'
import type { BountyTask } from '@zama-private-transfer/sdk'

const { isConnected } = useWallet()
const sdkStore = useSDKStore()

const tasks = ref<BountyTask[]>([])
const fee = ref<number>(0)
const loading = ref(false)
const loadingTask = ref(false)
const selectedTask = ref<BountyTask | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

const isWalletConnected = computed(() => isConnected.value)

let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // SDK 会在钱包连接时自动初始化（通过 Pinia store 的 watch）
  if (isConnected.value) {
    loadTasks()
    // Auto-refresh every 10 seconds
    refreshInterval = setInterval(() => {
      if (isConnected.value) {
        loadTasks()
      }
    }, 10000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

async function loadTasks() {
  if (!isConnected.value) {
    return
  }

  try {
    // Don't show loading spinner during auto-refresh to avoid UI jump
    const isManualRefresh = loading.value === false && tasks.value.length > 0
    if (!isManualRefresh) {
      loading.value = true
    }
    message.value = ''

    // 获取 SDK 实例（Pinia store 确保已初始化）
    const sdk = await sdkStore.getSDK()

    // Get fee from SDK
    try {
      const feeValue = await sdk.getFeeRate()
      fee.value = feeValue
    } catch (feeError) {
      console.error('Failed to get fee:', feeError)
      if (fee.value === 0) {
        fee.value = 50 // Default 5% only if not set
      }
    }

    // Get all bounty tasks using SDK
    try {
      const newTasks = await sdk.getBountyTasks()
      console.log('Tasks loaded:', newTasks)

      // Only update tasks if data changed
      tasks.value = newTasks

    } catch (tasksError: any) {
      console.error('Failed to get tasks:', tasksError)
      // Only clear tasks on first load, not during refresh
      if (tasks.value.length === 0) {
        tasks.value = []
      }
      // Don't show error message if contract call fails, just show empty state
      if (tasksError.code !== 'CALL_EXCEPTION' && tasks.value.length === 0) {
        showMessage('Unable to load tasks. Please check contract deployment.', 'error')
      }
    }

  } catch (error: any) {
    console.error('Load tasks error:', error)
    // Only clear tasks on first load, not during refresh
    if (tasks.value.length === 0) {
      tasks.value = []
    }
  } finally {
    loading.value = false
  }
}

async function handleEntrustWithdraw(task: BountyTask) {
  if (!isConnected.value) {
    showMessage('Please connect your wallet first', 'error')
    return
  }
  loadingTask.value = true
  message.value = ''
  setTimeout(async () => {
    try {

      // 获取 SDK 实例（Pinia store 确保已初始化）
      const sdk = await sdkStore.getSDK()

      showMessage('Submitting entrust withdrawal transaction...', 'success')

      // Use SDK to complete the task
      const result = await sdk.completeTask({
        task: task,
        password: task.password,
      })

      showMessage(
        `Task completed successfully! You earned ${result.commission} ETH commission. Transaction: ${result.transactionHash.substring(0, 10)}...`,
        'success'
      )

      console.log('Task completion result:', result)

      // Reload tasks
      selectedTask.value = null
      await loadTasks()

    } catch (error: any) {
      console.error('Entrust withdraw error:', error)
      showMessage(error.message || 'Entrust withdrawal failed', 'error')
    } finally {
      loadingTask.value = false
    }
  }, 20);
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

function selectTask(task: BountyTask) {
  selectedTask.value = task
  message.value = ''
}

function closeTaskModal() {
  selectedTask.value = null
  message.value = ''
}
</script>

<template>
  <div class="bounty-list">
    <div class="card">
      <div class="header-section">
        <div>
          <h2>Bounty List</h2>
          <p class="text-secondary">Complete entrusted withdrawals and earn commissions</p>
          <p class="hint-text">
            Note: New tasks may take a few moments to appear due to FHE decryption processing. Auto-refreshing every
            10s.
          </p>
        </div>
        <button class="secondary-button" :disabled="loading" @click="loadTasks">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="!isWalletConnected" class="warning">
        <p>Please connect your wallet to view bounty tasks</p>
      </div>

      <div v-else-if="loading" class="loading">
        <p>Loading tasks...</p>
      </div>

      <div v-else-if="tasks.length === 0" class="empty-state">
        <p>No bounty tasks available at the moment</p>
        <p class="text-secondary">Check back later for new opportunities</p>
      </div>

      <div v-else class="tasks-grid">
        <div class="fee-info">
          <span class="fee-label">Current Commission Rate:</span>
          <span class="fee-value">{{ (fee / 10).toFixed(1) }}%</span>
        </div>

        <div class="tasks-list">
          <div v-for="(task, index) in tasks" :key="index" class="task-card" @click="selectTask(task)">
            <div class="task-header">
              <h3>Task #{{ index + 1 }}</h3>
              <span class="task-badge">Available</span>
            </div>

            <div class="task-info">
              <div class="task-row">
                <span class="task-label">Amount:</span>
                <span class="task-value">{{ formatEther(task.amount.toString()) }} ETH</span>
              </div>
              <div class="task-row">
                <span class="task-label">Your Commission:</span>
                <span class="task-value text-success">{{ task.commission }} ETH</span>
              </div>
              <div class="task-row">
                <span class="task-label">Total Reward:</span>
                <span class="task-value text-warning">{{ task.totalReward }} ETH</span>
              </div>
            </div>

            <button class="task-button">
              Complete Task
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Modal -->
    <div v-if="selectedTask" class="modal-overlay" @click="closeTaskModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Complete Bounty Task</h3>
          <button class="close-button" @click="closeTaskModal">×</button>
        </div>

        <div class="modal-body">
          <div class="task-details">
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">{{ formatEther(selectedTask.amount.toString()) }} ETH</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Commission:</span>
              <span class="detail-value text-success">{{ selectedTask.commission }} ETH</span>
            </div>
          </div>

          <div class="info-box">
            <p>
              By completing this task, you will help process a withdrawal and earn
              <strong class="text-success">{{ selectedTask.commission }} ETH</strong> as commission.
            </p>
            <p class="warning-text">
              Note: This action will execute the entrusted withdrawal for the depositor and transfer funds to the
              designated recipient.
            </p>
          </div>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>

          <div class="modal-actions">
            <button class="secondary-button" @click="closeTaskModal">
              Cancel
            </button>
            <button class="submit-button" :disabled="loadingTask" @click="handleEntrustWithdraw(selectedTask)">
              {{ loadingTask ? 'Processing...' : 'Complete Task & Earn Commission' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bounty-list {
  max-width: 1000px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
}

.hint-text {
  margin-top: 0.5rem;
  font-size: 0.85em;
  color: var(--warning-color);
  font-style: italic;
}

.secondary-button {
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  box-shadow: none;
  padding: 0.75rem 1.5rem;
}

.secondary-button:hover {
  background-color: var(--bg-card);
  border-color: var(--primary-color);
}

.warning,
.loading,
.empty-state {
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  margin-top: 1.5rem;
}

.warning {
  background-color: rgba(255, 170, 0, 0.1);
  border: 1px solid var(--warning-color);
}

.warning p {
  margin: 0;
  color: var(--warning-color);
}

.loading,
.empty-state {
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
}

.empty-state p {
  margin: 0.5rem 0;
}

.tasks-grid {
  margin-top: 2rem;
}

.fee-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 2rem;
}

.fee-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.fee-value {
  font-size: 1.3em;
  font-weight: 700;
  color: var(--primary-color);
}

.tasks-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.task-card {
  padding: 1.5rem;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(110, 84, 255, 0.2);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.task-header h3 {
  margin: 0;
  font-size: 1.2em;
}

.task-badge {
  padding: 0.25rem 0.75rem;
  background-color: var(--success-color);
  color: var(--bg-dark);
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 700;
}

.task-info {
  margin: 1.5rem 0;
}

.task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.task-row:last-child {
  border-bottom: none;
}

.task-label {
  color: var(--text-secondary);
  font-size: 0.9em;
}

.task-value {
  font-weight: 600;
}

.task-button {
  width: 100%;
  margin-top: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
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
  max-width: 500px;
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

.task-details {
  padding: 1rem;
  background-color: var(--bg-hover);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 600;
}

.info-box {
  padding: 1.5rem;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin: 1.5rem 0;
}

.info-box p {
  margin: 0.75rem 0;
  line-height: 1.6;
}

.info-box p:first-child {
  margin-top: 0;
}

.info-box p:last-child {
  margin-bottom: 0;
}

.warning-text {
  font-size: 0.9em;
  color: var(--warning-color);
  font-style: italic;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-actions button {
  flex: 1;
}

.message {
  margin: 1rem 0;
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
  .header-section {
    flex-direction: column;
  }

  .tasks-list {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
