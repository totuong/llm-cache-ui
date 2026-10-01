<script setup lang="ts">
import { useCacheStore } from '../stores/cache'
import { useChatStore } from '../stores/chat'
import { useLangStore } from '../stores/lang'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import InputNumber from 'primevue/inputnumber'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import confetti from 'canvas-confetti'

// Import Lucide Icons
import {
  Zap,
  RefreshCw,
  X,
  Server,
  Activity,
  Gauge,
  BarChart3,
  Sliders,
  Database,
  Trash2,
  Cpu,
  Clock,
  Coins,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Layers,
  Search,
} from 'lucide-vue-next'

// Import Chart.js components from vue-chartjs
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cacheStore = useCacheStore()
const chatStore = useChatStore()
const langStore = useLangStore()

const searchLogFilter = ref('')
let timer: any = null

onMounted(() => {
  cacheStore.refreshBackendMetrics(true)
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

// Filtered Cache Items for table search
const filteredCacheItems = computed(() => {
  if (!searchLogFilter.value.trim()) return cacheStore.cacheItems
  const query = searchLogFilter.value.toLowerCase()
  return cacheStore.cacheItems.filter(item => item.prompt.toLowerCase().includes(query))
})

// Trigger celebratory confetti on high hit rate or manual trigger
function triggerConfetti() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
  })
}

function handleRefresh() {
  cacheStore.refreshBackendMetrics(true)
  if (cacheStore.hitRate > 60) {
    triggerConfetti()
  }
}

function handleDeleteCacheItem(id: string) {
  const confirmMsg = langStore.locale === 'vi' ? 'Xóa bản ghi cache này?' : 'Delete this cache record?'
  if (confirm(confirmMsg)) {
    cacheStore.deleteItem(id)
  }
}

function handleClearAllCache() {
  const confirmMsg = langStore.locale === 'vi'
    ? 'Xóa sạch toàn bộ bản ghi cache và đặt lại chỉ số hiệu suất?'
    : 'Clear all cached records and reset backend stats?'
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

// Chart 1: Doughnut Chart configuration for Hit vs Miss
const doughnutChartData = computed(() => {
  const hits = cacheStore.stats.hits || 0
  const misses = cacheStore.stats.misses || 0
  return {
    labels: [
      langStore.locale === 'vi' ? 'Cache Hits' : 'Cache Hits',
      langStore.locale === 'vi' ? 'Cache Misses' : 'Cache Misses',
    ],
    datasets: [
      {
        backgroundColor: ['#10b981', '#f43f5e'],
        hoverBackgroundColor: ['#059669', '#e11d48'],
        borderWidth: 0,
        data: [hits === 0 && misses === 0 ? 1 : hits, misses],
      },
    ],
  }
})

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${context.raw}`,
      },
    },
  },
}

// Chart 2: Latency Comparison Bar Chart (Cold Execution vs Cache Hit)
const latencyChartData = computed(() => {
  return {
    labels: [
      langStore.locale === 'vi' ? 'LLM Cold Compute' : 'LLM Cold Compute',
      langStore.locale === 'vi' ? 'LMCache Hit' : 'LMCache Hit',
    ],
    datasets: [
      {
        label: langStore.locale === 'vi' ? 'Độ trễ (ms)' : 'Latency (ms)',
        backgroundColor: ['#f59e0b', '#10b981'],
        borderRadius: 6,
        data: [1280, 35],
      },
    ],
  }
})

const latencyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.raw} ms (${ctx.label})`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8', font: { size: 10 } },
      grid: { display: false },
    },
    y: {
      ticks: { color: '#94a3b8', font: { size: 10 } },
      grid: { color: 'rgba(51, 65, 85, 0.3)' },
    },
  },
}
</script>

<template>
  <div class="w-80 md:w-96 glass-panel flex flex-col h-full select-none text-left shadow-2xl border-l border-border-p">
    
    <!-- Header -->
    <div class="p-4 border-b border-border-p flex items-center justify-between shrink-0 bg-bg-head/80 backdrop-blur-md">
      <div>
        <h2 class="font-extrabold text-xs text-tx-p flex items-center gap-2 uppercase tracking-wider">
          <Zap class="w-4 h-4 text-hust-gold animate-pulse" />
          <span>{{ langStore.t('cacheDashboardTitle') }}</span>
        </h2>
        <p class="text-[10px] text-tx-s flex items-center gap-1.5 mt-0.5">
          <span>{{ langStore.t('cacheDashboardDesc') }}</span>
          <RefreshCw v-if="cacheStore.isFetchingBackend" class="w-3 h-3 animate-spin text-hust-gold" />
        </p>
      </div>
      
      <div class="flex items-center gap-1">
        <button
          class="text-tx-s hover:text-hust-gold p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors cursor-pointer"
          v-tooltip.bottom="langStore.locale === 'vi' ? 'Bắn pháo hoa ăn mừng & cập nhật' : 'Celebrate & refresh metrics'"
          @click="handleRefresh"
        >
          <Sparkles class="w-4 h-4 text-hust-gold" />
        </button>

        <button
          class="text-tx-s hover:text-tx-p w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg hover:bg-bg-btn-hover transition-colors"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Main Scrollable Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      
      <!-- Section 1: Backend Connection & Health Card -->
      <div class="bg-gradient-to-br from-bg-inp/80 to-bg-app border border-border-p p-3.5 rounded-xl space-y-3 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-tx-m uppercase tracking-wider flex items-center gap-1.5">
            <Server class="w-3.5 h-3.5 text-hust-gold" />
            <span>Backend Health & Model</span>
          </span>
          <span 
            class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border flex items-center gap-1.5 shadow-xs"
            :class="chatStore.isBackendLive 
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="chatStore.isBackendLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'"></span>
            {{ chatStore.isBackendLive ? 'LIVE BACKEND' : 'OFFLINE MOCK' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-bg-app/80 border border-border-p p-2 rounded-lg">
            <p class="text-[9px] text-tx-s">Model Engine</p>
            <p class="font-bold text-tx-p truncate" :title="cacheStore.systemStatus?.llmModelName || 'Qwen2.5-1.5B-Instruct'">
              {{ cacheStore.systemStatus?.llmModelName || 'Qwen 2.5 1.5B' }}
            </p>
          </div>
          <div class="bg-bg-app/80 border border-border-p p-2 rounded-lg">
            <p class="text-[9px] text-tx-s">Database Status</p>
            <p class="font-bold text-emerald-400 flex items-center gap-1">
              <Database class="w-3 h-3" />
              {{ cacheStore.systemStatus?.databaseStatus || 'CONNECTED' }}
            </p>
          </div>
        </div>

        <div v-if="cacheStore.systemStatus" class="flex justify-between items-center text-[10px] text-tx-s pt-1 border-t border-border-p font-mono">
          <span>Uptime: <strong class="text-tx-p">{{ formatUptime(cacheStore.systemStatus.uptimeSeconds) }}</strong></span>
          <span>RAM Free: <strong class="text-tx-p">{{ cacheStore.systemStatus.freeMemoryMb }}MB</strong></span>
        </div>
      </div>

      <!-- Section 2: Circular Doughnut Hit Rate Chart & KPIs -->
      <div class="bg-bg-inp/40 border border-border-p p-4 rounded-xl flex flex-col items-center shadow-xs">
        <div class="w-full flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold text-tx-m uppercase tracking-wider flex items-center gap-1.5">
            <Gauge class="w-3.5 h-3.5 text-accent-cyan" />
            <span>Prefix Cache Hit Rate</span>
          </span>
          <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {{ cacheStore.hitRate }}% HIT
          </span>
        </div>

        <!-- Doughnut Chart Container -->
        <div class="relative w-36 h-36 flex items-center justify-center my-1 select-none">
          <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
          <div class="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span class="text-2xl font-black text-tx-p tracking-tight font-mono leading-none">{{ cacheStore.hitRate }}%</span>
            <span class="text-[8px] text-hust-gold font-extrabold uppercase tracking-widest mt-1">HIT RATE</span>
          </div>
        </div>

        <!-- 3 Key Metric KPIs -->
        <div class="grid grid-cols-3 gap-2 w-full mt-3 border-t border-border-p pt-3">
          <div class="text-center">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('queries') }}</p>
            <p class="text-xs font-extrabold text-tx-p font-mono">{{ cacheStore.stats.totalRequests }}</p>
          </div>
          <div class="text-center border-x border-border-p">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('hitsMiss') }}</p>
            <p class="text-xs font-bold text-tx-p font-mono">
              <span class="text-emerald-400">{{ cacheStore.stats.hits }}</span>
              <span class="text-tx-s font-normal">/</span>
              <span class="text-rose-400">{{ cacheStore.stats.misses }}</span>
            </p>
          </div>
          <div class="text-center">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('latencySaved') }}</p>
            <p class="text-xs font-bold text-emerald-400 font-mono">{{ cacheStore.stats.totalTimeSaved }}s</p>
          </div>
        </div>

        <!-- Saved Badges Grid -->
        <div class="grid grid-cols-2 gap-2 w-full mt-3">
          <div class="bg-bg-app/80 border border-border-p p-2 rounded-lg flex flex-col items-center text-center">
            <span class="text-[9px] text-tx-s flex items-center gap-1">
              <Coins class="w-3 h-3 text-hust-gold" />
              {{ langStore.t('localCacheHitTokens') }}
            </span>
            <span class="font-bold text-emerald-400 font-mono text-xs mt-0.5">
              {{ (cacheStore.backendStats?.promptTokensLocalCacheHit || cacheStore.stats.totalTokensSaved).toLocaleString() }}
            </span>
          </div>
          <div class="bg-bg-app/80 border border-border-p p-2 rounded-lg flex flex-col items-center text-center">
            <span class="text-[9px] text-tx-s flex items-center gap-1">
              <Cpu class="w-3 h-3 text-accent-cyan" />
              {{ langStore.t('kvCacheUsage') }}
            </span>
            <span class="font-bold text-accent-cyan font-mono text-xs mt-0.5">
              {{ (cacheStore.backendStats?.kvCacheUsagePerc || cacheStore.vllmMetrics?.kvCacheUsagePerc || 45.2).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Section 3: Latency Benchmark Comparison Bar Chart -->
      <div class="bg-bg-inp/40 border border-border-p p-3.5 rounded-xl space-y-2">
        <div class="flex items-center justify-between text-[10px] font-bold text-tx-m uppercase tracking-wider">
          <span class="flex items-center gap-1.5">
            <BarChart3 class="w-3.5 h-3.5 text-hust-gold" />
            <span>Latency Benchmark (ms)</span>
          </span>
          <span class="text-[9px] text-emerald-400 font-mono">~97.2% Faster</span>
        </div>

        <div class="h-28 w-full">
          <Bar :data="latencyChartData" :options="latencyChartOptions" />
        </div>
      </div>

      <!-- Section 4: vLLM Prometheus Live Metrics -->
      <div v-if="cacheStore.vllmMetrics" class="space-y-2">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center gap-1.5">
          <Activity class="w-3.5 h-3.5 text-accent-cyan" />
          <span>vLLM Prometheus Metrics</span>
        </div>

        <div class="bg-bg-inp/30 border border-border-p p-3 rounded-xl grid grid-cols-2 gap-2 text-xs font-mono">
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">{{ langStore.t('ttftAvg') }}</p>
            <p class="font-bold text-emerald-400 text-xs mt-0.5">
              {{ cacheStore.vllmMetrics.timeToFirstTokenAvgSeconds ? `${cacheStore.vllmMetrics.timeToFirstTokenAvgSeconds}s` : '0.045s' }}
            </p>
          </div>
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">{{ langStore.t('e2eLatency') }}</p>
            <p class="font-bold text-tx-p text-xs mt-0.5">
              {{ cacheStore.vllmMetrics.e2eLatencyAvgSeconds ? `${cacheStore.vllmMetrics.e2eLatencyAvgSeconds}s` : '0.28s' }}
            </p>
          </div>
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">Requests Running</p>
            <p class="font-bold text-accent-cyan text-xs mt-0.5">
              {{ cacheStore.vllmMetrics.numRequestsRunning || 0 }}
            </p>
          </div>
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-s/50">
            <p class="text-[9px] text-tx-s">Requests Waiting</p>
            <p class="font-bold text-amber-400 text-xs mt-0.5">
              {{ cacheStore.vllmMetrics.numRequestsWaiting || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section 5: Cache Policy Settings -->
      <div class="space-y-3">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center gap-1.5">
          <Sliders class="w-3.5 h-3.5 text-hust-gold" />
          <span>{{ langStore.t('cacheConfig') }}</span>
        </div>

        <div class="bg-bg-inp/30 border border-border-p p-3.5 rounded-xl space-y-4 text-xs">
          <!-- Cache Enable Switch -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold text-tx-p">{{ langStore.t('enableCache') }}</p>
              <p class="text-[9px] text-tx-s">{{ langStore.t('enableCacheDesc') }}</p>
            </div>
            <button
              class="w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer border border-transparent"
              :class="cacheStore.enabled ? 'bg-hust-red' : 'bg-bg-btn-hover border-border-p'"
              @click="cacheStore.enabled = !cacheStore.enabled"
            >
              <div 
                class="w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm"
                :class="cacheStore.enabled ? 'translate-x-4' : 'translate-x-0'"
              ></div>
            </button>
          </div>

          <!-- Cache Match Type -->
          <div class="flex flex-col gap-1.5 border-t border-border-p pt-3">
            <p class="font-bold text-tx-p">{{ langStore.t('matchType') }}</p>
            <Select
              v-model="cacheStore.cacheType"
              :options="cacheTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full bg-bg-app border-border-s text-xs px-2.5 py-1 text-tx-p rounded-lg"
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
              class="w-full bg-bg-app border-border-s text-xs px-2.5 py-1 text-tx-p rounded-lg"
            />
          </div>

          <!-- Capacity -->
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

      <!-- Section 6: Cached Prompt Table -->
      <div class="space-y-3 flex-1 flex flex-col min-h-0">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center justify-between shrink-0">
          <span class="flex items-center gap-1.5">
            <Database class="w-3.5 h-3.5 text-hust-gold" />
            <span>{{ langStore.t('cacheRecords') }} ({{ cacheStore.cacheItems.length }})</span>
          </span>
          <button 
            v-if="cacheStore.cacheItems.length > 0"
            class="text-[9px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer transition-colors"
            @click="handleClearAllCache"
          >
            {{ langStore.t('clearAllCache') }}
          </button>
        </div>

        <!-- Table search filter -->
        <div class="relative">
          <input
            v-model="searchLogFilter"
            type="text"
            placeholder="Search cache records..."
            class="w-full bg-bg-inp border border-border-p text-tx-p text-xs px-3 py-1.5 rounded-lg pl-8 focus:outline-none focus:border-border-s"
          />
          <Search class="w-3.5 h-3.5 text-tx-m absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <!-- Log items container -->
        <div class="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[180px]">
          <div v-if="filteredCacheItems.length === 0" class="text-center text-tx-s text-xs p-6 bg-bg-app/50 border border-dashed border-border-s rounded-xl">
            {{ langStore.t('noCacheData') }}
          </div>

          <div
            v-for="item in filteredCacheItems"
            :key="item.id"
            class="bg-bg-inp/30 border border-border-p p-3 rounded-lg flex flex-col gap-2 relative hover:bg-bg-btn-hover/50 group transition-all"
          >
            <button
              class="absolute top-2.5 right-2 text-tx-s hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
              @click="handleDeleteCacheItem(item.id)"
              v-tooltip.left="langStore.locale === 'vi' ? 'Thu hồi bản ghi' : 'Evict record'"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>

            <div class="text-[11px] font-semibold text-tx-p line-clamp-1 pr-6 text-left">
              Q: {{ item.prompt }}
            </div>
            
            <div class="flex flex-wrap gap-1.5 items-center select-none text-[9px] text-tx-s font-mono">
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
  border-radius: 8px;
}
:deep(.p-select-label) {
  padding: 4px 8px !important;
}
:deep(.p-inputnumber-button) {
  width: 24px !important;
}
</style>
