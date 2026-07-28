<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useChatStore } from '../stores/chat'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import { ref } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const chatStore = useChatStore()
const cacheStore = useCacheStore()
const langStore = useLangStore()

const currentTheme = ref(localStorage.getItem('hust_theme') || 'dark')

function handleClearChats() {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử các cuộc hội thoại? Hành động này không thể hoàn tác.'
    : 'Are you sure you want to clear all conversation history? This action cannot be undone.'
    
  if (confirm(confirmMsg)) {
    chatStore.sessions = []
    chatStore.createNewSession()
    emit('update:visible', false)
  }
}

function handleClearAllData() {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Xóa toàn bộ cache và dữ liệu mô phỏng?'
    : 'Clear all caching database records and statistics?'
    
  if (confirm(confirmMsg)) {
    chatStore.sessions = []
    chatStore.createNewSession()
    cacheStore.clearAll()
    emit('update:visible', false)
  }
}

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('hust_theme', currentTheme.value)
  if (currentTheme.value === 'light') {
    document.documentElement.classList.add('light-mode')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.remove('light-mode')
    document.documentElement.classList.add('dark')
  }
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :header="langStore.t('settingsTitle')"
    class="w-full max-w-md mx-4"
  >
    <div class="flex flex-col gap-4 py-2 text-left">
      <!-- 1. Theme Selection -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-sm font-medium text-tx-p">{{ langStore.t('themeMode') }}</h4>
          <p class="text-xs text-tx-s mt-0.5">{{ langStore.t('themeDesc') }}</p>
        </div>
        <button
          class="border border-border-s bg-bg-inp hover:bg-bg-btn-hover text-tx-s hover:text-tx-p text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
          @click="toggleTheme"
        >
          <i :class="currentTheme === 'dark' ? 'pi pi-moon' : 'pi pi-sun'"></i>
          <span>{{ currentTheme === 'dark' ? langStore.t('dark') : langStore.t('light') }}</span>
        </button>
      </div>

      <!-- 2. Language Selection -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-sm font-medium text-tx-p">{{ langStore.t('language') }}</h4>
          <p class="text-xs text-tx-s mt-0.5">{{ langStore.t('languageDesc') }}</p>
        </div>
        <div class="flex gap-1 bg-bg-inp border border-border-s p-0.5 rounded-lg select-none">
          <button
            class="text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all"
            :class="langStore.locale === 'vi' ? 'bg-hust-red text-white' : 'text-tx-s hover:text-tx-p'"
            @click="langStore.setLocale('vi')"
          >
            Tiếng Việt
          </button>
          <button
            class="text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all"
            :class="langStore.locale === 'en' ? 'bg-hust-red text-white' : 'text-tx-s hover:text-tx-p'"
            @click="langStore.setLocale('en')"
          >
            English
          </button>
        </div>
      </div>

      <!-- 3. Clear Chats -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-sm font-medium text-tx-p">{{ langStore.t('clearHistory') }}</h4>
          <p class="text-xs text-tx-s mt-0.5">{{ langStore.t('clearHistoryDesc') }}</p>
        </div>
        <button
          class="text-red-400 hover:text-white border border-red-900/50 bg-red-950/10 hover:bg-red-700/80 text-xs px-3.5 py-1.5 rounded-lg transition-all font-bold cursor-pointer"
          @click="handleClearChats"
        >
          <i class="pi pi-trash mr-1 text-[10px]"></i>
          <span>{{ langStore.t('clearBtn') }}</span>
        </button>
      </div>

      <!-- 4. Hard Reset -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-sm font-medium text-tx-p">{{ langStore.t('resetCache') }}</h4>
          <p class="text-xs text-tx-s mt-0.5">{{ langStore.t('resetCacheDesc') }}</p>
        </div>
        <button
          class="text-yellow-400 hover:text-zinc-950 border border-yellow-900/50 bg-yellow-950/10 hover:bg-yellow-500 text-xs px-3.5 py-1.5 rounded-lg transition-all font-bold cursor-pointer"
          @click="handleClearAllData"
        >
          <i class="pi pi-refresh mr-1 text-[10px]"></i>
          <span>{{ langStore.t('resetBtn') }}</span>
        </button>
      </div>

      <!-- Info panel -->
      <div class="flex flex-col gap-1.5 bg-bg-inp/40 border border-border-s p-3 rounded-lg text-tx-s">
        <div class="flex justify-between text-[11px]">
          <span>{{ langStore.t('version') }}:</span>
          <span class="text-tx-p font-semibold font-mono">1.0.0 (Thesis Release)</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span>{{ langStore.t('copyright') }}:</span>
          <span class="text-tx-p font-medium">Đại học Bách Khoa Hà Nội</span>
        </div>
      </div>

      <!-- Close footer button -->
      <div class="flex justify-end gap-2 mt-2 pt-3 border-t border-border-p">
        <button
          class="bg-bg-btn-hover hover:bg-bg-inp text-tx-s hover:text-tx-p text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer transition-colors border border-border-s"
          @click="emit('update:visible', false)"
        >
          {{ langStore.t('close') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
