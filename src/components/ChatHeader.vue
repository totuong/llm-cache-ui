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
</script>

<template>
  <header class="h-14 border-b border-border-p bg-bg-head px-4 flex items-center justify-between shrink-0 select-none text-tx-p">
    
    <!-- Left side: Toggle & Model Selector -->
    <div class="flex items-center gap-3">
      <!-- Sidebar toggle -->
      <button
        class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1.5 rounded transition-colors cursor-pointer"
        v-tooltip.bottom="langStore.t('toggleSidebar')"
        @click="emit('toggle-sidebar')"
      >
        <i class="pi pi-bars text-sm"></i>
      </button>

      <!-- PrimeVue Select for Model choice -->
      <div class="flex items-center gap-1">
        <Select
          v-model="chatStore.selectedModelId"
          :options="chatStore.models"
          optionLabel="name"
          optionValue="id"
          class="bg-bg-inp border-border-s text-xs px-2.5 py-1 text-tx-p focus:outline-none focus:ring-1 focus:ring-hust-red rounded-lg w-56 md:w-64"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center gap-2">
              <i :class="chatStore.models.find(m => m.id === slotProps.value)?.icon" class="text-[10px] text-hust-gold"></i>
              <span class="font-medium text-xs">{{ chatStore.models.find(m => m.id === slotProps.value)?.name }}</span>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex flex-col py-0.5 text-left">
              <div class="flex items-center gap-2">
                <i :class="slotProps.option.icon" class="text-[10px] text-hust-gold"></i>
                <span class="font-semibold text-xs text-tx-p">{{ slotProps.option.name }}</span>
              </div>
              <span class="text-[9px] text-tx-s mt-0.5 font-normal">{{ slotProps.option.description }}</span>
            </div>
          </template>
        </Select>
      </div>
    </div>

    <!-- Right side: Cache status & control triggers -->
    <div class="flex items-center gap-2">
      <!-- Cache Enable Toggle Switch-like badge -->
      <button
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer select-none"
        :class="[
          cacheStore.enabled 
            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/30' 
            : 'bg-bg-inp text-tx-s border-border-s hover:bg-bg-btn-hover'
        ]"
        v-tooltip.bottom="cacheStore.enabled 
          ? (langStore.locale === 'vi' ? 'Click để tắt LLM Cache' : 'Click to disable LLM Cache') 
          : (langStore.locale === 'vi' ? 'Click để bật LLM Cache' : 'Click to enable LLM Cache')"
        @click="cacheStore.enabled = !cacheStore.enabled"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="cacheStore.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-tx-m'"></span>
        <span>LLM Cache: {{ cacheStore.enabled ? (langStore.locale === 'vi' ? 'BẬT' : 'ON') : (langStore.locale === 'vi' ? 'TẮT' : 'OFF') }}</span>
      </button>

      <!-- Clear screen -->
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
