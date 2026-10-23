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
  Network,
  ExternalLink,
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

const activeDrawerTab = ref<'metrics' | 'settings' | 'records'>('metrics')

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
  const hits = cacheStore.stats.hits ?? 0
  const misses = cacheStore.stats.misses ?? 0
  const isEmpty = hits === 0 && misses === 0

  return {
    labels: isEmpty
      ? [langStore.locale === 'vi' ? 'Chưa có truy vấn' : 'No queries yet']
      : [
          langStore.locale === 'vi' ? 'Cache Hits' : 'Cache Hits',
          langStore.locale === 'vi' ? 'Cache Misses' : 'Cache Misses',
        ],
    datasets: [
      {
        backgroundColor: isEmpty ? ['rgba(148, 163, 184, 0.2)'] : ['#10b981', '#f43f5e'],
        hoverBackgroundColor: isEmpty ? ['rgba(148, 163, 184, 0.3)'] : ['#059669', '#e11d48'],
        borderWidth: 0,
        data: isEmpty ? [1] : [hits, misses],
      },
    ],
  }
})

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${context.raw}`,
      },
    },
  },
}
</script>

<template>
  <div class="w-80 md:w-96 glass-panel flex flex-col h-full select-none text-left shadow-2xl border-l border-border-p bg-bg-side/95 backdrop-blur-xl">
    
    <!-- Top Header -->
    <div class="p-3.5 border-b border-border-p flex items-center justify-between shrink-0 bg-bg-head/80">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-lg bg-hust-gold/15 text-hust-gold border border-hust-gold/30">
          <Zap class="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h2 class="font-extrabold text-xs text-tx-p uppercase tracking-wider flex items-center gap-1.5">
            LMCache Monitor
          </h2>
          <p class="text-[9px] text-tx-s font-mono truncate max-w-[180px]">
            {{ cacheStore.systemStatus?.llmModelName || 'Qwen 2.5 1.5B' }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-1">
        <button
          class="text-tx-s hover:text-hust-gold p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors cursor-pointer"
          v-tooltip.bottom="'Làm mới dữ liệu'"
          :disabled="cacheStore.isFetchingBackend"
          @click="handleRefresh"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': cacheStore.isFetchingBackend }" />
        </button>

        <button
          class="text-tx-s hover:text-tx-p w-7 h-7 flex items-center justify-center cursor-pointer rounded-lg hover:bg-bg-btn-hover transition-colors"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Segmented Tab Switcher (Giám sát / Cài đặt / Bản ghi) -->
    <div class="p-2 border-b border-border-p bg-bg-inp/40 shrink-0">
      <div class="grid grid-cols-3 gap-1 bg-bg-app p-1 rounded-xl border border-border-p text-center text-xs font-bold">
        <button
          class="py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]"
          :class="activeDrawerTab === 'metrics' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeDrawerTab = 'metrics'"
        >
          <Gauge class="w-3.5 h-3.5" />
          <span>Giám Sát</span>
        </button>

        <button
          class="py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]"
          :class="activeDrawerTab === 'settings' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeDrawerTab = 'settings'"
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>Cài Đặt</span>
        </button>

        <button
          class="py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]"
          :class="activeDrawerTab === 'records' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeDrawerTab = 'records'"
        >
          <Database class="w-3.5 h-3.5" />
          <span>Bản Ghi ({{ cacheStore.cacheItems.length }})</span>
        </button>
      </div>
    </div>

    <!-- Main Tab Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <!-- ================= TAB 1: GIÁM SÁT (METRICS) ================= -->
      <div v-if="activeDrawerTab === 'metrics'" class="space-y-4 animate-fade-in">


        <!-- Circular Hit Rate Doughnut -->
        <div class="bg-bg-inp/40 border border-border-p p-4 rounded-xl flex flex-col items-center shadow-xs">
          <div class="w-full flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold text-tx-m uppercase tracking-wider">Hit Ratio</span>
            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {{ cacheStore.hitRate }}%
            </span>
          </div>

          <div class="relative w-32 h-32 flex items-center justify-center my-1 select-none">
            <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
            <div class="absolute flex flex-col items-center justify-center pointer-events-none text-center">
              <span class="text-2xl font-black text-tx-p font-mono leading-none">{{ cacheStore.hitRate }}%</span>
              <span class="text-[8px] text-hust-gold font-extrabold uppercase tracking-widest mt-0.5">HIT RATIO</span>
            </div>
          </div>

          <!-- 4 Core KPIs Grid -->
          <div class="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-border-p text-center text-xs font-mono">
            <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
              <p class="text-[9px] text-tx-s font-sans">Truy Vấn</p>
              <p class="font-bold text-tx-p text-sm mt-0.5">{{ cacheStore.stats.totalRequests }}</p>
            </div>
            <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
              <p class="text-[9px] text-tx-s font-sans">Hit / Miss</p>
              <p class="font-bold text-sm mt-0.5">
                <span class="text-emerald-400">{{ cacheStore.stats.hits }}</span>
                <span class="text-tx-s font-normal"> / </span>
                <span class="text-rose-400">{{ cacheStore.stats.misses }}</span>
              </p>
            </div>
            <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
              <p class="text-[9px] text-tx-s font-sans">Time Saved</p>
              <p class="font-bold text-hust-gold text-sm mt-0.5">{{ cacheStore.stats.totalTimeSaved }}s</p>
            </div>
            <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
              <p class="text-[9px] text-tx-s font-sans">Tokens Saved</p>
              <p class="font-bold text-accent-cyan text-sm mt-0.5">
                {{ (cacheStore.backendStats?.totalCachedTokensSaved ?? cacheStore.backendStats?.promptTokensLocalCacheHit ?? cacheStore.stats.totalTokensSaved ?? 0).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Prometheus / vLLM Live Micro-Stats -->
        <div class="bg-bg-inp/30 border border-border-p p-3 rounded-xl grid grid-cols-2 gap-2 text-xs font-mono">
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
            <p class="text-[9px] text-tx-s font-sans">TTFT Avg</p>
            <p class="font-bold text-emerald-400 mt-0.5">
              {{ cacheStore.vllmMetrics?.timeToFirstTokenAvgSeconds != null ? `${(cacheStore.vllmMetrics.timeToFirstTokenAvgSeconds * 1000).toFixed(0)} ms` : '0 ms' }}
            </p>
          </div>
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
            <p class="text-[9px] text-tx-s font-sans">KV GPU Usage</p>
            <p class="font-bold text-accent-violet mt-0.5">
              {{ ((cacheStore.backendStats?.kvCacheUsagePerc ?? cacheStore.vllmMetrics?.kvCacheUsagePerc) ?? 0).toFixed(1) }}%
            </p>
          </div>
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
            <p class="text-[9px] text-tx-s font-sans">E2E Latency</p>
            <p class="font-bold text-tx-p mt-0.5">
              {{ cacheStore.vllmMetrics?.e2eLatencyAvgSeconds != null ? `${(cacheStore.vllmMetrics.e2eLatencyAvgSeconds * 1000).toFixed(0)} ms` : '0 ms' }}
            </p>
          </div>
          <div class="bg-bg-app/80 p-2 rounded-lg border border-border-p">
            <p class="text-[9px] text-tx-s font-sans">Running Requests</p>
            <p class="font-bold text-accent-cyan mt-0.5">
              {{ cacheStore.vllmMetrics?.numRequestsRunning ?? 0 }}
            </p>
          </div>
        </div>

        <!-- Router Link to Full Dashboard -->
        <router-link
          to="/dashboard"
          class="w-full bg-gradient-to-r from-hust-red to-hust-red-hover text-white text-xs py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <BarChart3 class="w-4 h-4" />
          <span>Mở Dashboard Chi Tiết & Cấu Hình L2 &rarr;</span>
        </router-link>

      </div>

      <!-- ================= TAB 2: CÀI ĐẶT (SETTINGS) ================= -->
      <div v-else-if="activeDrawerTab === 'settings'" class="space-y-4 animate-fade-in text-xs">
        
        <div class="bg-bg-inp/40 border border-border-p p-4 rounded-xl space-y-4">
          <!-- Cache Enable Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold text-tx-p">Bật LMCache</p>
              <p class="text-[9px] text-tx-s">Kích hoạt bộ nhớ đệm KV Cache</p>
            </div>
            <button
              class="w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer border border-transparent"
              :class="cacheStore.enabled ? 'bg-hust-red' : 'bg-bg-btn-hover border-border-p'"
              @click="cacheStore.enabled = !cacheStore.enabled"
            >
              <div 
                class="w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm"
                :class="cacheStore.enabled ? 'translate-x-4' : 'translate-x-0'"
              ></div>
            </button>
          </div>

          <!-- Match Type -->
          <div class="border-t border-border-p pt-3 space-y-1.5">
            <p class="font-bold text-tx-p">Phương thức đối sánh</p>
            <Select
              v-model="cacheStore.cacheType"
              :options="cacheTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full bg-bg-app border-border-s text-xs px-2.5 py-1 text-tx-p rounded-lg"
            />
          </div>

          <!-- Similarity Threshold Slider -->
          <div v-if="cacheStore.cacheType === 'semantic'" class="border-t border-border-p pt-3 space-y-2">
            <div class="flex justify-between items-center">
              <p class="font-bold text-tx-p">Ngưỡng tương đồng (Threshold)</p>
              <span class="font-mono font-bold text-hust-gold bg-bg-app px-2 py-0.5 rounded border border-border-s">
                {{ cacheStore.similarityThreshold }}
              </span>
            </div>
            <Slider v-model="cacheStore.similarityThreshold" :min="0.5" :max="0.95" :step="0.05" />
          </div>

          <!-- Eviction Policy -->
          <div class="border-t border-border-p pt-3 space-y-1.5">
            <p class="font-bold text-tx-p">Chính sách thu hồi (Eviction)</p>
            <Select
              v-model="cacheStore.evictionPolicy"
              :options="policyOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full bg-bg-app border-border-s text-xs px-2.5 py-1 text-tx-p rounded-lg"
            />
          </div>

          <!-- Capacity -->
          <div class="border-t border-border-p pt-3 flex items-center justify-between">
            <p class="font-bold text-tx-p">Dung lượng tối đa</p>
            <InputNumber
              v-model="cacheStore.maxCacheSize"
              showButtons
              buttonLayout="horizontal"
              :min="5"
              :max="50"
              class="w-24 bg-bg-app text-xs"
              inputClass="bg-bg-app border-border-s text-center py-1 text-tx-p font-mono w-10 text-xs"
            />
          </div>
        </div>

      </div>

      <!-- ================= TAB 3: BẢN GHI (RECORDS) ================= -->
      <div v-else-if="activeDrawerTab === 'records'" class="space-y-3 animate-fade-in text-xs flex flex-col h-full">
        
        <div class="flex items-center justify-between gap-2">
          <div class="relative flex-1">
            <input
              v-model="searchLogFilter"
              type="text"
              placeholder="Tìm kiếm prompt..."
              class="w-full bg-bg-inp border border-border-p text-tx-p text-xs px-3 py-1.5 rounded-lg pl-8 focus:outline-none focus:border-border-s"
            />
            <Search class="w-3.5 h-3.5 text-tx-m absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button 
            v-if="cacheStore.cacheItems.length > 0"
            class="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer transition-colors whitespace-nowrap"
            @click="handleClearAllCache"
          >
            Xóa sạch
          </button>
        </div>

        <div class="space-y-2 overflow-y-auto flex-1">
          <div v-if="filteredCacheItems.length === 0" class="text-center text-tx-s text-xs p-8 bg-bg-app/50 border border-dashed border-border-s rounded-xl">
            Chưa có bản ghi cache nào (0 bản ghi)
          </div>

          <div
            v-for="item in filteredCacheItems"
            :key="item.id"
            class="bg-bg-inp/30 border border-border-p p-3 rounded-xl space-y-1.5 relative group hover:bg-bg-btn-hover/50 transition-all"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold text-tx-p line-clamp-2 text-[11px] leading-snug">{{ item.prompt }}</p>
              <button
                class="text-tx-s hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer shrink-0"
                @click="handleDeleteCacheItem(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div class="flex items-center gap-2 text-[9px] font-mono text-tx-s">
              <span class="text-hust-gold font-bold">Hits: {{ item.hits }}</span>
              <span>•</span>
              <span>{{ item.tokens }} tokens</span>
              <span>•</span>
              <span class="text-emerald-400">{{ item.latency }}s</span>
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
