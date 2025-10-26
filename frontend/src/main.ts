import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import './config/web3modal'
// 创建 Vue 应用实例
const app = createApp(App)
// 创建并注册 Pinia
const pinia = createPinia()
app.use(pinia)
// 直接挂载应用
app.mount('#app')

console.log('✅ 应用已挂载')
console.log('💡 WASM 和 SDK 将在首次使用时自动初始化（通过 sdkStore）')
