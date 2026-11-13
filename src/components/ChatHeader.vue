<script setup lang="ts">
import { useChatStore } from '../stores/chat'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import { ref, onMounted } from 'vue'

// Import Lucide Icons
import {
  Menu,
  BarChart3,
  Moon,
  Sun,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'toggle-cache'): void
}>()

const chatStore = useChatStore()
const cacheStore = useCacheStore()
const langStore = useLangStore()

const isDarkMode = ref(true)

onMounted(() => {
  const theme = localStorage.getItem('hust_theme') || 'dark'
  isDarkMode.value = theme === 'dark'
})

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  const newTheme = isDarkMode.value ? 'dark' : 'light'
  localStorage.setItem('hust_theme', newTheme)

  if (isDarkMode.value) {
    document.documentElement.classList.remove('light-mode')
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.add('light-mode')
    document.documentElement.classList.remove('dark')
  }
}
</script>

<template>
  <header class="h-14 border-b border-border-p bg-bg-head/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none text-tx-p shadow-xs">
    
    <!-- Left side: Sidebar Toggle & Active Session Title -->
    <div class="flex items-center gap-3 min-w-0">
      <button
        class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
        v-tooltip.bottom="langStore.t('toggleSidebar')"
        @click="emit('toggle-sidebar')"
      >
        <Menu class="w-4 h-4" />
      </button>

      <span class="text-xs font-bold text-tx-p truncate max-w-[200px] sm:max-w-xs md:max-w-md">
        {{ chatStore.activeSession?.title || langStore.t('newChat') }}
      </span>
    </div>

    <!-- Right side: Clean, minimal actions -->
    <div class="flex items-center gap-1.5">
      <!-- Dark/Light Mode Switcher -->
      <button
        class="text-tx-s hover:text-tx-p p-1.5 rounded-xl hover:bg-bg-btn-hover border border-border-s transition-colors cursor-pointer w-8 h-8 flex items-center justify-center shrink-0"
        v-tooltip.bottom="isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'"
        @click="toggleTheme"
      >
        <Sun v-if="isDarkMode" class="w-4 h-4 text-hust-gold" />
        <Moon v-else class="w-4 h-4 text-accent-violet" />
      </button>

      <!-- Cache Analytics Quick Drawer Toggle Button -->
      <button
        class="bg-bg-inp hover:bg-bg-btn-hover border border-border-s text-tx-s hover:text-tx-p text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all duration-200 shadow-xs"
        v-tooltip.bottom="langStore.t('cacheStats')"
        @click="emit('toggle-cache')"
      >
        <BarChart3 class="w-4 h-4 text-hust-gold" />
        <span class="hidden sm:inline text-xs">{{ langStore.t('cacheStats') }}</span>
      </button>
    </div>
  </header>
</template>
