<script setup lang="ts">
import { useChatStore } from '../stores/chat'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import Select from 'primevue/select'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'toggle-cache'): void
}>()

const chatStore = useChatStore()
const cacheStore = useCacheStore()
const langStore = useLangStore()

function handleClearChat() {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Xóa sạch nội dung cuộc hội thoại hiện tại?'
    : 'Clear all contents of this chat session?'
  if (confirm(confirmMsg)) {
    chatStore.clearCurrentSession()
  }
}

function toggleApiMode() {
  chatStore.apiMode = chatStore.apiMode === 'live' ? 'mock' : 'live'
  chatStore.checkHealth()
}
</script>

<template>
  <header class="h-14 border-b border-border-p bg-bg-head px-4 flex items-center justify-between shrink-0 select-none text-tx-p shadow-sm">
    
    <!-- Left side: Sidebar Toggle & Model Selector -->
    <div class="flex items-center gap-3">
      <button
        class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1.5 rounded transition-colors cursor-pointer"
        v-tooltip.bottom="langStore.t('toggleSidebar')"
        @click="emit('toggle-sidebar')"
      >
        <i class="pi pi-bars text-sm"></i>
      </button>

      <!-- Select Model -->
      <div class="flex items-center gap-1">
        <Select
          v-model="chatStore.selectedModelId"
          :options="chatStore.models"
          optionLabel="name"
          optionValue="id"
          class="bg-bg-inp border-border-s text-xs px-2.5 py-1 text-tx-p focus:outline-none focus:ring-1 focus:ring-hust-red rounded-lg w-56 md:w-72"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center gap-2 truncate">
              <i :class="chatStore.models.find(m => m.id === slotProps.value)?.icon" class="text-[10px] text-hust-gold"></i>
              <span class="font-semibold text-xs truncate">{{ chatStore.models.find(m => m.id === slotProps.value)?.name }}</span>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex flex-col py-0.5 text-left">
              <div class="flex items-center gap-2">
                <i :class="slotProps.option.icon" class="text-[10px] text-hust-gold"></i>
                <span class="font-bold text-xs text-tx-p">{{ slotProps.option.name }}</span>
              </div>
              <span class="text-[9px] text-tx-s mt-0.5 font-normal line-clamp-1">{{ slotProps.option.description }}</span>
            </div>
          </template>
        </Select>
      </div>
    </div>

    <!-- Right side: Connection Status, Cache toggle & Analytics -->
    <div class="flex items-center gap-2">
      <!-- Backend Live Health Indicator & Toggle -->
      <button
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer select-none shadow-xs"
        :class="[
          chatStore.isBackendLive && chatStore.apiMode === 'live'
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
        ]"
        v-tooltip.bottom="chatStore.isBackendLive 
          ? (langStore.locale === 'vi' ? 'Backend Spring Boot (8081) đang kết nối Live' : 'Spring Boot Backend Live (8081)') 
          : (langStore.locale === 'vi' ? 'Backend ngắt kết nối - đang dùng Chế độ Giả lập Offline' : 'Backend offline - using Mock Mode')"
        @click="toggleApiMode"
      >
        <span class="w-2 h-2 rounded-full" :class="chatStore.isBackendLive && chatStore.apiMode === 'live' ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'"></span>
        <span>{{ chatStore.isBackendLive && chatStore.apiMode === 'live' ? 'BACKEND LIVE' : 'MOCK MODE' }}</span>
      </button>

      <!-- LLM Cache Enable Switch Badge -->
      <button
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer select-none shadow-xs"
        :class="[
          cacheStore.enabled 
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' 
            : 'bg-bg-inp text-tx-s border-border-s hover:bg-bg-btn-hover'
        ]"
        v-tooltip.bottom="cacheStore.enabled 
          ? (langStore.locale === 'vi' ? 'Click để tắt LMCache Engine' : 'Click to disable LMCache Engine') 
          : (langStore.locale === 'vi' ? 'Click để bật LMCache Engine' : 'Click to enable LMCache Engine')"
        @click="cacheStore.enabled = !cacheStore.enabled"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="cacheStore.enabled ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-tx-m'"></span>
        <span>LMCache: {{ cacheStore.enabled ? 'BẬT' : 'TẮT' }}</span>
      </button>

      <!-- Clear Chat Screen -->
      <button
        class="text-tx-s hover:text-red-400 p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors flex items-center justify-center cursor-pointer w-8 h-8"
        v-tooltip.bottom="langStore.t('clearChat')"
        @click="handleClearChat"
      >
        <i class="pi pi-trash text-sm"></i>
      </button>

      <!-- Cache analytics panel toggle -->
      <button
        class="bg-bg-inp hover:bg-bg-btn-hover border border-border-s text-tx-s hover:text-tx-p text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-all duration-200"
        @click="emit('toggle-cache')"
      >
        <i class="pi pi-chart-bar text-hust-gold text-xs"></i>
        <span class="hidden sm:inline">{{ langStore.t('cacheStats') }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
:deep(.p-select) {
  border-radius: 8px;
}
:deep(.p-select-label) {
  padding: 4px 8px !important;
}
</style>
