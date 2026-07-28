import './assets/main.css'

// Synchronously apply theme before Vue mounts to avoid dark visual flashes
const theme = localStorage.getItem('hust_theme') || 'dark'
if (theme === 'light') {
  document.documentElement.classList.add('light-mode')
  document.documentElement.classList.remove('dark')
} else {
  document.documentElement.classList.remove('light-mode')
  document.documentElement.classList.add('dark')
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'system',
    }
  }
})
app.use(ToastService)
app.directive('tooltip', Tooltip)

app.mount('#app')
