<script setup lang="ts">
import { useCacheStore } from '../stores/cache'
import { useChatStore } from '../stores/chat'
import { useLangStore } from '../stores/lang'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import InputNumber from 'primevue/inputnumber'
import { computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cacheStore = useCacheStore()
const chatStore = useChatStore()
const langStore = useLangStore()

let timer: any = null

onMounted(() => {
  cacheStore.refreshBackendMetrics(true)
  // Poll metrics every 12s while dashboard is open to avoid excessive requests
  timer = setInterval(() => {
    cacheStore.refreshBackendMetrics()
  }, 12000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const policyOptions = computed(() => [
  { label: langStore.locale === 'vi' ? 'Truy cập gần nhất (LRU)' : 'Least Recently Used (LRU)', value: 'LRU' },
  { label: langStore.locale === 'vi' ? 'Tần suất thấp nhất (LFU)' : 'Least Frequently Used (LFU)', value: 'LFU' },
  { label: langStore.locale === 'vi' ? 'Vào trước ra trước (FIFO)' : 'First In First Out (FIFO)', value: 'FIFO' },
])

const cacheTypeOptions = computed(() => [
  { label: langStore.locale === 'vi' ? 'Khớp Ngữ Nghĩa (Semantic)' : 'Semantic Matching', value: 'semantic' },
  { label: langStore.locale === 'vi' ? 'Khớp Chính Xác (Exact)' : 'Exact String Match', value: 'exact' },
])

// Animated SVG indicator calculations for Circular Hit Rate Gauge
const strokeDashoffset = computed(() => {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const rate = cacheStore.hitRate / 100
  return circumference * (1 - rate)
})

function handleDeleteCacheItem(id: string) {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Xóa bản ghi cache này?'
    : 'Delete this cache record?'
  if (confirm(confirmMsg)) {
    cacheStore.deleteItem(id)
  }
}

function handleClearAllCache() {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Xóa sạch toàn bộ bản ghi cache và đặt lại chỉ số hiệu suất trên Backend?'
    : 'Clear all cached records and reset backend performance stats?'
  if (confirm(confirmMsg)) {
    cacheStore.clearAll()
  }
}

function formatUptime(seconds?: number): string {
  if (!seconds) return '0s'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}
</script>

<template>
  <div class="w-80 md:w-96 bg-bg-card border-l border-border-p flex flex-col h-full select-none text-left shadow-2xl">
    
    <!-- Header -->
    <div class="p-4 border-b border-border-p flex items-center justify-between shrink-0 bg-bg-head">
      <div>
        <h2 class="font-extrabold text-sm text-tx-p flex items-center gap-1.5 uppercase tracking-wider">
          <i class="pi pi-bolt text-hust-gold"></i>
          {{ langStore.t('cacheDashboardTitle') }}
        </h2>
        <p class="text-[10px] text-tx-s flex items-center gap-1.5 mt-0.5">
          <span>{{ langStore.t('cacheDashboardDesc') }}</span>
          <i v-if="cacheStore.isFetchingBackend" class="pi pi-spin pi-spinner text-hust-gold text-[10px]"></i>
        </p>
      </div>
      
      <div class="flex items-center gap-1">
        <button
          class="text-tx-s hover:text-hust-gold p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors cursor-pointer"
          v-tooltip.bottom="langStore.locale === 'vi' ? 'Cập nhật chỉ số backend' : 'Refresh backend metrics'"
          @click="cacheStore.refreshBackendMetrics(true)"
        >
          <i class="pi pi-refresh text-xs"></i>
        </button>

        <button
          class="text-tx-s hover:text-tx-p w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg hover:bg-bg-btn-hover transition-colors"
          @click="emit('close')"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Main Scrollable Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      
      <!-- Section 1: Backend Connection & System Status Overview -->
      <div class="bg-gradient-to-br from-bg-inp/60 to-bg-app border border-border-p p-3.5 rounded-xl space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-tx-m uppercase tracking-wider flex items-center gap-1.5">
            <i class="pi pi-server text-hust-gold"></i>
            Backend Health & Model
          </span>
          <span 
            class="px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 shadow-xs"
            :class="chatStore.isBackendLive 
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="chatStore.isBackendLive ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'"></span>
            {{ chatStore.isBackendLive ? 'LIVE BACKEND' : 'OFFLINE MOCK' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-bg-app border border-border-p p-2 rounded-lg">
            <p class="text-[9px] text-tx-s">Model Engine</p>
            <p class="font-bold text-tx-p truncate" :title="cacheStore.systemStatus?.llmModelName || 'Qwen2.5-1.5B-Instruct'">
              {{ cacheStore.systemStatus?.llmModelName || 'Qwen 2.5 1.5B' }}
            </p>
          </div>
          <div class="bg-bg-app border border-border-p p-2 rounded-lg">
            <p class="text-[9px] text-tx-s">Database Status</p>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <i class="pi pi-database text-[10px]"></i>
              {{ cacheStore.systemStatus?.databaseStatus || 'CONNECTED' }}
            </p>
          </div>
        </div>

        <div v-if="cacheStore.systemStatus" class="flex justify-between items-center text-[10px] text-tx-s pt-1 border-t border-border-p">
          <span>Uptime: <strong class="text-tx-p">{{ formatUptime(cacheStore.systemStatus.uptimeSeconds) }}</strong></span>
          <span>RAM Free: <strong class="text-tx-p">{{ cacheStore.systemStatus.freeMemoryMb }}MB</strong></span>
        </div>
      </div>

      <!-- Section 2: Circular Gauge & Key Performance Cards -->
      <div class="bg-bg-inp/40 border border-border-p p-4 rounded-xl flex flex-col items-center">
        <!-- Hit Rate SVG circular chart -->
        <div class="relative w-36 h-36 flex items-center justify-center select-none">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <!-- Background Ring -->
            <circle
              cx="60"
              cy="60"
              r="50"
              class="stroke-border-s fill-none"
              stroke-width="8"
            />
            <!-- Foreground animated Progress ring -->
            <circle
              cx="60"
              cy="60"
              r="50"
              class="stroke-hust-red fill-none transition-all duration-500"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="2 * Math.PI * 50"
              :stroke-dashoffset="strokeDashoffset"
            />
          </svg>
          <!-- Central text metrics -->
          <div class="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span class="text-3xl font-black text-tx-p tracking-tight font-mono leading-none">{{ cacheStore.hitRate }}%</span>
            <span class="text-[9px] text-hust-gold font-extrabold uppercase tracking-widest mt-1">HIT RATE</span>
          </div>
        </div>

        <!-- Descriptive Label under chart -->
        <div class="text-[11px] font-bold text-tx-s mt-2 text-center uppercase tracking-wider flex items-center gap-1.5">
          <i class="pi pi-bolt text-hust-gold text-xs"></i>
          {{ langStore.t('prefixCacheHit') }}
        </div>

        <!-- 3 KPIs layout -->
        <div class="grid grid-cols-3 gap-2.5 w-full mt-4 border-t border-border-p pt-3.5">
          <div class="text-center">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('queries') }}</p>
            <p class="text-sm font-bold text-tx-p">{{ cacheStore.stats.totalRequests }}</p>
          </div>
          <div class="text-center border-x border-border-p">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('hitsMiss') }}</p>
            <p class="text-xs font-bold text-tx-p">
              <span class="text-emerald-700 dark:text-emerald-400">{{ cacheStore.stats.hits }}</span>
              <span class="text-tx-s font-normal">/</span>
              <span class="text-red-600 dark:text-red-400">{{ cacheStore.stats.misses }}</span>
            </p>
          </div>
          <div class="text-center">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('latencySaved') }}</p>
            <p class="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">{{ cacheStore.stats.totalTimeSaved }}s</p>
          </div>
        </div>

        <!-- Detailed LMCache Token Saved Badges -->
        <div class="grid grid-cols-2 gap-2 w-full mt-3">
          <div class="bg-bg-app border border-border-p p-2 rounded-lg flex flex-col items-center text-center">
            <span class="text-[9px] text-tx-s">{{ langStore.t('localCacheHitTokens') }}</span>
            <span class="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs mt-0.5">
              {{ (cacheStore.backendStats?.promptTokensLocalCacheHit || cacheStore.stats.totalTokensSaved).toLocaleString() }}
            </span>
          </div>
          <div class="bg-bg-app border border-border-p p-2 rounded-lg flex flex-col items-center text-center">
            <span class="text-[9px] text-tx-s">{{ langStore.t('kvCacheUsage') }}</span>
            <span class="font-bold text-cyan-700 dark:text-cyan-400 font-mono text-xs mt-0.5">
              {{ (cacheStore.backendStats?.kvCacheUsagePerc || cacheStore.vllmMetrics?.kvCacheUsagePerc || 45.2).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Section 3: vLLM Engine Prometheus Live Metrics -->
      <div v-if="cacheStore.vllmMetrics" class="space-y-2.5">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center gap-1.5">
          <i class="pi pi-chart-line text-hust-gold"></i>
          vLLM Prometheus Metrics
        </div>

        <div class="bg-bg-inp/30 border border-border-p p-3 rounded-xl grid grid-cols-2 gap-2 text-xs">
          <div class="bg-bg-app p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">{{ langStore.t('ttftAvg') }}</p>
            <p class="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
              {{ cacheStore.vllmMetrics.timeToFirstTokenAvgSeconds ? `${cacheStore.vllmMetrics.timeToFirstTokenAvgSeconds}s` : '0.06s' }}
            </p>
          </div>
          <div class="bg-bg-app p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">{{ langStore.t('e2eLatency') }}</p>
            <p class="font-mono font-bold text-tx-p text-xs">
              {{ cacheStore.vllmMetrics.e2eLatencyAvgSeconds ? `${cacheStore.vllmMetrics.e2eLatencyAvgSeconds}s` : '0.28s' }}
            </p>
          </div>
          <div class="bg-bg-app p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">Requests Running</p>
            <p class="font-mono font-bold text-cyan-700 dark:text-cyan-400 text-xs">
              {{ cacheStore.vllmMetrics.numRequestsRunning || 0 }}
            </p>
          </div>
          <div class="bg-bg-app p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">Requests Waiting</p>
            <p class="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs">
              {{ cacheStore.vllmMetrics.numRequestsWaiting || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section 4: Policy Configs -->
      <div class="space-y-3.5">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center gap-1">
          <i class="pi pi-sliders-h text-hust-gold"></i>
          {{ langStore.t('cacheConfig') }}
        </div>

        <div class="bg-bg-inp/30 border border-border-p p-3.5 rounded-xl space-y-4 text-xs">
          <!-- Cache Enable switch -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold text-tx-p">{{ langStore.t('enableCache') }}</p>
              <p class="text-[9px] text-tx-s">{{ langStore.t('enableCacheDesc') }}</p>
            </div>
            <button
              class="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer border border-transparent"
              :class="cacheStore.enabled ? 'bg-hust-red' : 'bg-bg-btn-hover border-border-p'"
              @click="cacheStore.enabled = !cacheStore.enabled"
            >
              <div 
                class="w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
                :class="cacheStore.enabled ? 'translate-x-4' : 'translate-x-0'"
              ></div>
            </button>
          </div>

          <!-- Cache Type Exact/Semantic -->
          <div class="flex flex-col gap-1.5 border-t border-border-p pt-3">
            <p class="font-bold text-tx-p">{{ langStore.t('matchType') }}</p>
            <Select
              v-model="cacheStore.cacheType"
              :options="cacheTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full bg-bg-app border-border-s text-xs px-2.5 py-1 text-tx-p focus:ring-hust-red rounded-lg"
            />
          </div>

          <!-- Similarity Threshold Slider -->
          <div v-if="cacheStore.cacheType === 'semantic'" class="flex flex-col gap-2 border-t border-border-p pt-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-bold text-tx-p">{{ langStore.t('similarityThreshold') }}</p>
                <p class="text-[9px] text-tx-s">{{ langStore.t('similarityDesc') }}</p>
              </div>
              <span class="font-mono font-bold text-hust-gold bg-bg-app px-2 py-0.5 rounded border border-border-s">
                {{ cacheStore.similarityThreshold }}
              </span>
            </div>
            <div class="px-1 py-1">
              <Slider
                v-model="cacheStore.similarityThreshold"
                :min="0.5"
                :max="0.95"
                :step="0.05"
              />
            </div>
          </div>

          <!-- Eviction Policy -->
          <div class="flex flex-col gap-1.5 border-t border-border-p pt-3">
            <p class="font-bold text-tx-p">{{ langStore.t('evictionPolicy') }}</p>
            <Select
              v-model="cacheStore.evictionPolicy"
              :options="policyOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full bg-bg-app border-border-s text-xs px-2.5 py-1 text-tx-p focus:ring-hust-red rounded-lg"
            />
          </div>

          <!-- Max Cache size -->
          <div class="flex items-center justify-between border-t border-border-p pt-3">
            <div>
              <p class="font-bold text-tx-p">{{ langStore.t('capacity') }}</p>
              <p class="text-[9px] text-tx-s">{{ langStore.t('capacityDesc') }}</p>
            </div>
            <InputNumber
              v-model="cacheStore.maxCacheSize"
              showButtons
              buttonLayout="horizontal"
              :min="5"
              :max="30"
              class="w-24 select-none bg-bg-app text-xs"
              inputClass="bg-bg-app border-border-s text-center py-1 text-tx-p font-mono w-10 text-xs"
            />
          </div>
        </div>
      </div>

      <!-- Section 5: Cached Query Table -->
      <div class="space-y-3 flex-1 flex flex-col min-h-0">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center justify-between shrink-0">
          <span class="flex items-center gap-1">
            <i class="pi pi-database text-hust-gold"></i>
            {{ langStore.t('cacheRecords') }} ({{ cacheStore.cacheItems.length }})
          </span>
          <button 
            v-if="cacheStore.cacheItems.length > 0"
            class="text-[9px] text-red-500 hover:text-red-400 font-bold cursor-pointer"
            @click="handleClearAllCache"
          >
            {{ langStore.t('clearAllCache') }}
          </button>
        </div>

        <!-- Log items container -->
        <div class="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[200px]">
          <div v-if="cacheStore.cacheItems.length === 0" class="text-center text-tx-s text-xs p-8 bg-bg-app border border-dashed border-border-s rounded-xl">
            {{ langStore.t('noCacheData') }}
          </div>

          <div
            v-for="item in cacheStore.cacheItems"
            :key="item.id"
            class="bg-bg-inp/30 border border-border-p p-3 rounded-lg flex flex-col gap-2 relative hover:bg-bg-btn-hover/50 group"
          >
            <button
              class="absolute top-2.5 right-2 text-tx-s hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
              @click="handleDeleteCacheItem(item.id)"
              v-tooltip.left="langStore.locale === 'vi' ? 'Thu hồi bản ghi' : 'Evict record'"
            >
              <i class="pi pi-trash text-[10px]"></i>
            </button>

            <div class="text-[11px] font-semibold text-tx-p line-clamp-1 pr-6 text-left">
              Q: {{ item.prompt }}
            </div>
            
            <div class="flex flex-wrap gap-1.5 items-center select-none text-[9px] text-tx-s">
              <span class="bg-bg-inp border border-border-p px-1.5 py-0.5 rounded text-hust-gold font-bold">
                Hits: {{ item.hits }}
              </span>
              <span class="bg-bg-inp border border-border-p px-1.5 py-0.5 rounded text-tx-s">
                Size: {{ item.tokens }} tokens
              </span>
              <span class="bg-bg-inp border border-border-p px-1.5 py-0.5 rounded text-tx-s">
                Latency: {{ item.latency }}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-select) {
  border-radius: 6px;
}
:deep(.p-select-label) {
  padding: 4px 8px !important;
}
:deep(.p-inputnumber-button) {
  width: 24px !important;
}
</style>
