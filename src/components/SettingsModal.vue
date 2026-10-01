<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useChatStore } from '../stores/chat'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import { ref } from 'vue'

// Lucide Icons
import {
  Moon,
  Sun,
  Globe,
  Trash2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  X,
  Database,
  ExternalLink,
  BookOpen,
} from 'lucide-vue-next'

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
          <h4 class="text-xs font-bold text-tx-p flex items-center gap-1.5">
            <Sun v-if="currentTheme === 'dark'" class="w-3.5 h-3.5 text-hust-gold" />
            <Moon v-else class="w-3.5 h-3.5 text-accent-violet" />
            {{ langStore.t('themeMode') }}
          </h4>
          <p class="text-[10px] text-tx-s mt-0.5">{{ langStore.t('themeDesc') }}</p>
        </div>
        <button
          class="border border-border-s bg-bg-inp hover:bg-bg-btn-hover text-tx-s hover:text-tx-p text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-xs"
          @click="toggleTheme"
        >
          <Sun v-if="currentTheme === 'dark'" class="w-3.5 h-3.5 text-hust-gold" />
          <Moon v-else class="w-3.5 h-3.5 text-accent-violet" />
          <span>{{ currentTheme === 'dark' ? langStore.t('dark') : langStore.t('light') }}</span>
        </button>
      </div>

      <!-- 2. Language Selection -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-xs font-bold text-tx-p flex items-center gap-1.5">
            <Globe class="w-3.5 h-3.5 text-accent-cyan" />
            {{ langStore.t('language') }}
          </h4>
          <p class="text-[10px] text-tx-s mt-0.5">{{ langStore.t('languageDesc') }}</p>
        </div>
        <div class="flex gap-1 bg-bg-inp border border-border-s p-0.5 rounded-xl select-none">
          <button
            class="text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
            :class="langStore.locale === 'vi' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
            @click="langStore.setLocale('vi')"
          >
            Tiếng Việt
          </button>
          <button
            class="text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
            :class="langStore.locale === 'en' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
            @click="langStore.setLocale('en')"
          >
            English
          </button>
        </div>
      </div>

      <!-- 3. Clear Chat History -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-xs font-bold text-tx-p flex items-center gap-1.5">
            <Trash2 class="w-3.5 h-3.5 text-rose-400" />
            {{ langStore.t('clearHistory') }}
          </h4>
          <p class="text-[10px] text-tx-s mt-0.5">{{ langStore.t('clearHistoryDesc') }}</p>
        </div>
        <button
          class="text-rose-400 hover:text-white border border-rose-500/30 bg-rose-500/10 hover:bg-rose-600 text-xs px-3 py-1.5 rounded-xl transition-all font-bold cursor-pointer flex items-center gap-1 shadow-xs"
          @click="handleClearChats"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>{{ langStore.t('clearBtn') }}</span>
        </button>
      </div>

      <!-- 4. Reset Cache & Metrics -->
      <div class="flex items-center justify-between border-b border-border-p pb-3">
        <div>
          <h4 class="text-xs font-bold text-tx-p flex items-center gap-1.5">
            <RefreshCw class="w-3.5 h-3.5 text-hust-gold" />
            {{ langStore.t('resetCache') }}
          </h4>
          <p class="text-[10px] text-tx-s mt-0.5">{{ langStore.t('resetCacheDesc') }}</p>
        </div>
        <button
          class="text-hust-gold hover:text-zinc-950 border border-hust-gold/40 bg-hust-gold/10 hover:bg-hust-gold text-xs px-3 py-1.5 rounded-xl transition-all font-bold cursor-pointer flex items-center gap-1 shadow-xs"
          @click="handleClearAllData"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>{{ langStore.t('resetBtn') }}</span>
        </button>
      </div>

      <!-- Info Panel -->
      <div class="flex flex-col gap-1.5 bg-bg-inp/40 border border-border-s p-3 rounded-xl text-tx-s">
        <div class="flex justify-between items-center text-[11px]">
          <span>{{ langStore.t('version') }}:</span>
          <span class="text-tx-p font-bold font-mono">1.0.0 (LMCache + vLLM)</span>
        </div>
        <div class="flex justify-between items-center text-[11px]">
          <span>{{ langStore.t('copyright') }}:</span>
          <span class="text-tx-p font-medium">LLM Cache Team</span>
        </div>
        <div class="pt-2 border-t border-border-p flex justify-between items-center text-xs">
          <span class="text-[10px] text-tx-s">Tổng quan Đề tài:</span>
          <router-link
            to="/about"
            class="text-hust-gold hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            @click="emit('update:visible', false)"
          >
            <BookOpen class="w-3.5 h-3.5" />
            <span>Giới thiệu Đề tài</span>
          </router-link>
        </div>
      </div>

      <!-- Footer Button -->
      <div class="flex justify-end gap-2 mt-1 pt-3 border-t border-border-p">
        <button
          class="bg-bg-btn-hover hover:bg-bg-inp text-tx-s hover:text-tx-p text-xs font-bold py-1.5 px-4 rounded-xl cursor-pointer transition-colors border border-border-s"
          @click="emit('update:visible', false)"
        >
          {{ langStore.t('close') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
