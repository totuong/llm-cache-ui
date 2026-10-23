<script setup lang="ts">
import { useChatStore } from '../stores/chat'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import Select from 'primevue/select'
import { ref, onMounted } from 'vue'

// Import Lucide Icons
import {
  Menu,
  Zap,
  BarChart3,
  Trash2,
  Moon,
  Sun,
  Sparkles,
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

function handleClearChat() {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Xóa sạch nội dung cuộc hội thoại hiện tại?'
    : 'Clear all contents of this chat session?'
  if (confirm(confirmMsg)) {
    chatStore.clearCurrentSession()
  }
}
</script>

<template>
  <header class="h-14 border-b border-border-p bg-bg-head/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none text-tx-p shadow-xs">
    
    <!-- Left side: Sidebar Toggle & Model Selector -->
    <div class="flex items-center gap-3">
      <button
        class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1.5 rounded-lg transition-colors cursor-pointer"
        v-tooltip.bottom="langStore.t('toggleSidebar')"
        @click="emit('toggle-sidebar')"
      >
        <Menu class="w-4 h-4" />
      </button>

      <!-- Select Model -->
      <div class="flex items-center gap-1">
        <Select
          v-model="chatStore.selectedModelId"
          :options="chatStore.models"
          optionLabel="name"
          optionValue="id"
          class="bg-bg-inp border-border-s text-xs px-2.5 py-1 text-tx-p focus:outline-none focus:ring-1 focus:ring-hust-red rounded-xl w-56 md:w-72"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center gap-2 truncate">
              <Zap class="w-3.5 h-3.5 text-hust-gold shrink-0" />
              <span class="font-semibold text-xs truncate">{{ chatStore.models.find(m => m.id === slotProps.value)?.name }}</span>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex flex-col py-0.5 text-left">
              <div class="flex items-center gap-2">
                <Zap class="w-3.5 h-3.5 text-hust-gold shrink-0" />
                <span class="font-bold text-xs text-tx-p">{{ slotProps.option.name }}</span>
              </div>
              <span class="text-[9px] text-tx-s mt-0.5 font-normal line-clamp-1">{{ slotProps.option.description }}</span>
            </div>
          </template>
        </Select>
      </div>
    </div>

    <!-- Right side: Actions -->
    <div class="flex items-center gap-2">
      <!-- Dark/Light Mode Switcher -->
      <button
        class="text-tx-s hover:text-tx-p p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
        v-tooltip.bottom="isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'"
        @click="toggleTheme"
      >
        <Sun v-if="isDarkMode" class="w-4 h-4 text-hust-gold" />
        <Moon v-else class="w-4 h-4 text-accent-violet" />
      </button>

      <!-- Clear Chat Screen -->
      <button
        class="text-tx-s hover:text-rose-400 p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors flex items-center justify-center cursor-pointer w-8 h-8"
        v-tooltip.bottom="langStore.t('clearChat')"
        @click="handleClearChat"
      >
        <Trash2 class="w-4 h-4" />
      </button>

      <!-- Full Dashboard & L2 Storage Hub Router Link -->
      <router-link
        to="/dashboard"
        class="bg-gradient-to-r from-hust-red/20 to-hust-gold/20 hover:from-hust-red/30 hover:to-hust-gold/30 border border-hust-gold/30 text-tx-p text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all duration-200 shadow-xs"
        v-tooltip.bottom="langStore.locale === 'vi' ? 'Mở Dashboard & Cấu hình L2' : 'Open Dashboard & L2 Hub'"
      >
        <Sparkles class="w-4 h-4 text-hust-gold" />
        <span class="hidden md:inline">{{ langStore.locale === 'vi' ? 'Dashboard & L2' : 'Dashboard & L2' }}</span>
      </router-link>

      <!-- Cache Analytics Quick Drawer Toggle Button -->
      <button
        class="bg-bg-inp hover:bg-bg-btn-hover border border-border-s text-tx-s hover:text-tx-p text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-all duration-200 shadow-xs"
        @click="emit('toggle-cache')"
      >
        <BarChart3 class="w-4 h-4 text-hust-gold" />
        <span class="hidden sm:inline">{{ langStore.t('cacheStats') }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
:deep(.p-select) {
  border-radius: 10px;
}
:deep(.p-select-label) {
  padding: 4px 8px !important;
}
</style>
