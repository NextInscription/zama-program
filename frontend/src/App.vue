<script setup lang="ts">
import { ref } from 'vue'
import Deposit from './components/Deposit.vue'
import Withdraw from './components/Withdraw.vue'
import BountyList from './components/BountyList.vue'
type Tab = 'deposit' | 'withdraw' | 'bounty'

const activeTab = ref<Tab>('deposit')

function setTab(tab: Tab) {
  activeTab.value = tab
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>Zama Private Transfer</h1>
            <p class="text-secondary">Privacy-Preserving Transactions</p>
          </div>
          <w3m-button />
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div class="tabs">
          <button :class="['tab-button', { active: activeTab === 'deposit' }]" @click="setTab('deposit')">
            Deposit
          </button>
          <button :class="['tab-button', { active: activeTab === 'withdraw' }]" @click="setTab('withdraw')">
            Withdraw
          </button>
          <button :class="['tab-button', { active: activeTab === 'bounty' }]" @click="setTab('bounty')">
            Bounty List
          </button>
        </div>

        <div class="tab-content">
          <Deposit v-if="activeTab === 'deposit'" />
          <Withdraw v-if="activeTab === 'withdraw'" />
          <BountyList v-if="activeTab === 'bounty'" />
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p class="text-secondary">Powered by Zama FHE Technology</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.logo h1 {
  font-size: 1.8em;
  margin: 0;
  background: linear-gradient(135deg, #6e54ff 0%, #9d7eff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo p {
  margin: 0.25rem 0 0 0;
  font-size: 0.9em;
}

.main {
  flex: 1;
  padding: 3rem 0;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background-color: var(--bg-card);
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.tab-button {
  flex: 1;
  padding: 1rem 2rem;
  background-color: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  font-size: 1.1em;
  box-shadow: none;
}

.tab-button:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  transform: none;
}

.tab-button.active {
  background-color: var(--primary-color);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(110, 84, 255, 0.3);
}

.tab-content {
  min-height: 400px;
}

.footer {
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  text-align: center;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-button {
    width: 100%;
  }
}
</style>
