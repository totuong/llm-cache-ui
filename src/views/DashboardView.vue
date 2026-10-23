<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCacheStore } from '../stores/cache'
import { useChatStore } from '../stores/chat'
import { useLangStore } from '../stores/lang'
import Slider from 'primevue/slider'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import confetti from 'canvas-confetti'

// Import Lucide Icons
import {
  Zap,
  RefreshCw,
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
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  Cloud,
  Code2,
  Copy,
  Check,
  Sun,
  Moon,
  ExternalLink,
  Network,
  Link2,
  Save,
  Terminal,
  Eye,
  EyeOff,
} from 'lucide-vue-next'

// Import Chart.js components
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

const cacheStore = useCacheStore()
const chatStore = useChatStore()
const langStore = useLangStore()
const toast = useToast()

// 2 Consolidated Tabs: Metrics vs L2 Storage Hub
const activeTab = ref<'metrics' | 'l2hub'>('metrics')
const searchLogFilter = ref('')
const copiedL2Yaml = ref(false)
const copiedCli = ref(false)
const isTestingL2 = ref(false)
const showAuthToken = ref(false)
const isDarkMode = ref(true)
const activeLogView = ref<'db' | 'client'>('db')

// 4 L2 Architecture Presets
const l2Presets = [
  {
    name: 'Host DRAM (RAM Máy Chủ)',
    type: 'dram' as const,
    url: 'dram://host_ram_pool',
    chunkSize: 256,
    cpuLimit: 64,
    latency: '< 2 ms',
    tag: 'Độ trễ thấp nhất',
  },
  {
    name: 'Local NVMe SSD',
    type: 'nvme' as const,
    url: '/mnt/nvme_ssd/lmcache_store',
    chunkSize: 256,
    cpuLimit: 16,
    latency: '~15 ms',
    tag: 'Chi phí tối ưu',
  },
  {
    name: 'Redis Cluster Pool',
    type: 'redis' as const,
    url: 'redis://cache-redis-cluster.internal:6379/0',
    chunkSize: 256,
    cpuLimit: 16,
    latency: '~25 ms',
    tag: 'Cụm GPU phân tán',
  },
  {
    name: 'MinIO / AWS S3',
    type: 's3' as const,
    url: 's3://hust-lmcache-bucket/kv-pool',
    chunkSize: 512,
    cpuLimit: 32,
    latency: '~80 ms',
    tag: 'Dung lượng vô hạn',
  },
]

function applyL2Preset(preset: (typeof l2Presets)[0]) {
  cacheStore.l2Config.backendType = preset.type
  cacheStore.l2Config.connectionUrl = preset.url
  cacheStore.l2Config.chunkSize = preset.chunkSize
  cacheStore.l2Config.localCpuMemoryLimitGb = preset.cpuLimit
  cacheStore.saveL2Config()
  toast.add({
    severity: 'info',
    summary: 'Đã gán cấu hình L2',
    detail: preset.name,
    life: 2000,
  })
}

async function handleTestL2Connection() {
  isTestingL2.value = true
  try {
    const res = await cacheStore.testL2Connection()
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      })
      toast.add({
        severity: 'success',
        summary: 'Kết nối L2 thành công!',
        detail: res.message,
        life: 3000,
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Lỗi liên kết L2',
        detail: res.message,
        life: 4000,
      })
    }
  } finally {
    isTestingL2.value = false
  }
}

function handleSaveL2Config() {
  cacheStore.saveL2Config()
  toast.add({
    severity: 'success',
    summary: 'Đã lưu cấu hình L2 Storage',
    detail: cacheStore.l2Config.connectionUrl,
    life: 2500,
  })
}

const liveL2Yaml = computed(() => {
  return `chunk_size: ${cacheStore.l2Config.chunkSize}
local_device: "cuda"
remote_url: "${cacheStore.l2Config.connectionUrl}"
remote_serde: "torch"
max_local_cpu_memory: ${cacheStore.l2Config.localCpuMemoryLimitGb}.0 # GB Host RAM
max_local_disk_size: ${cacheStore.l2Config.maxDiskSizeGb}.0 # GB NVMe Disk
eviction_policy: "${cacheStore.l2Config.evictionPolicy}"
pin_memory: ${cacheStore.l2Config.pinMemory ? 'true' : 'false'}`
})

const liveCliCommand = computed(() => {
  return `# Chạy vLLM kết hợp LMCache với tầng L2 đã cấu hình:
export LMCACHE_CONFIG_FILE=lmcache.yaml
vllm serve ${cacheStore.systemStatus?.llmModelName || 'Qwen/Qwen2.5-1.5B-Instruct'} \\
  --gpu-memory-utilization 0.90 \\
  --kv-cache-dtype auto`
})

function copyL2Yaml() {
  navigator.clipboard.writeText(liveL2Yaml.value)
  copiedL2Yaml.value = true
  toast.add({
    severity: 'success',
    summary: 'Đã sao chép YAML',
    detail: 'Mẫu cấu hình lmcache.yaml đã lưu vào Clipboard.',
    life: 2000,
  })
  setTimeout(() => (copiedL2Yaml.value = false), 2000)
}

function copyCliCommand() {
  navigator.clipboard.writeText(liveCliCommand.value)
  copiedCli.value = true
  toast.add({
    severity: 'success',
    summary: 'Đã sao chép lệnh',
    detail: 'Lệnh vLLM CLI đã lưu vào Clipboard.',
    life: 2000,
  })
  setTimeout(() => (copiedCli.value = false), 2000)
}

let timer: any = null

onMounted(() => {
  const theme = localStorage.getItem('hust_theme') || 'dark'
  isDarkMode.value = theme === 'dark'

  cacheStore.refreshBackendMetrics(true)
  timer = setInterval(() => {
    cacheStore.refreshBackendMetrics()
  }, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
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

function handleRefresh() {
  cacheStore.refreshBackendMetrics(true)
  confetti({
    particleCount: 40,
    spread: 50,
    origin: { y: 0.6 },
  })
}

// Filtered PostgreSQL DB Chat History
const filteredDbHistory = computed(() => {
  if (!searchLogFilter.value.trim()) return cacheStore.dbChatHistory
  const query = searchLogFilter.value.toLowerCase()
  return cacheStore.dbChatHistory.filter(item =>
    item.prompt.toLowerCase().includes(query) ||
    (item.response && item.response.toLowerCase().includes(query))
  )
})

// Filtered Cache Items for table search
const filteredCacheItems = computed(() => {
  if (!searchLogFilter.value.trim()) return cacheStore.cacheItems
  const query = searchLogFilter.value.toLowerCase()
  return cacheStore.cacheItems.filter(item => item.prompt.toLowerCase().includes(query))
})

// Chart 1: Doughnut Chart
const doughnutChartData = computed(() => {
  const hits = cacheStore.stats.hits ?? 0
  const misses = cacheStore.stats.misses ?? 0
  const isEmpty = hits === 0 && misses === 0

  return {
    labels: isEmpty ? ['Chưa có truy vấn'] : ['Cache Hits', 'Cache Misses'],
    datasets: [
      {
        backgroundColor: isEmpty ? ['rgba(148, 163, 184, 0.2)'] : ['#10b981', '#f43f5e'],
        borderWidth: 0,
        data: isEmpty ? [1] : [hits, misses],
      },
    ],
  }
})

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '74%',
  plugins: {
    legend: { display: false },
  },
}

// Chart 2: Latency Benchmark Comparison Bar Chart
const latencyChartData = computed(() => {
  return {
    labels: ['Cold LLM', 'Host DRAM L2', 'NVMe SSD L2', 'Cloud/Redis L2'],
    datasets: [
      {
        label: 'Latency (ms)',
        backgroundColor: ['#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'],
        borderRadius: 8,
        data: [1280, 35, 110, 220],
      },
    ],
  }
})

const latencyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
    y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(51, 65, 85, 0.3)' } },
  },
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString()
  } catch {
    return dateStr
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
  <div class="w-screen h-screen flex flex-col bg-bg-app overflow-hidden text-tx-p select-none">
    <Toast position="top-right" />

    <!-- Top Main App Navigation Bar -->
    <header class="h-16 border-b border-border-p bg-bg-head/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-xs">
      
      <!-- Left: Logo & Route Back Link -->
      <div class="flex items-center gap-4">
        <router-link
          to="/"
          class="flex items-center gap-2 text-tx-s hover:text-tx-p bg-bg-inp hover:bg-bg-btn-hover px-3 py-1.5 rounded-xl border border-border-s text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft class="w-4 h-4 text-hust-gold" />
          <span>Chat Studio</span>
        </router-link>

        <div class="h-4 w-px bg-border-p hidden sm:block"></div>

        <div class="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="LLM Cache Logo" class="w-8 h-8 shrink-0 object-contain shadow-xs" />
          <div>
            <h1 class="font-extrabold text-xs tracking-wide text-tx-p flex items-center gap-1.5">
              <span>LMCache Hub</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded bg-hust-red/15 text-hust-red border border-hust-red/30 font-mono font-bold">vLLM</span>
            </h1>
            <p class="text-[10px] text-tx-s font-mono truncate max-w-[200px]">
              {{ cacheStore.systemStatus?.llmModelName || 'Qwen 2.5 1.5B' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Center: 2 Clean Streamlined Tabs -->
      <div class="hidden sm:flex items-center gap-1 bg-bg-inp/80 p-1 rounded-2xl border border-border-p">
        <button
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'metrics' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeTab = 'metrics'"
        >
          <BarChart3 class="w-3.5 h-3.5" />
          <span>Giám Sát & Hiệu Năng</span>
        </button>

        <button
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'l2hub' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeTab = 'l2hub'"
        >
          <Network class="w-3.5 h-3.5 text-accent-cyan" />
          <span>Cấu Hình Tầng L2</span>
          <span 
            v-if="cacheStore.l2Config.status === 'connected'" 
            class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"
          ></span>
        </button>
      </div>

      <!-- Right: Theme & Refresh Actions -->
      <div class="flex items-center gap-2.5">

        <!-- Dark/Light Theme Toggle -->
        <button
          class="text-tx-s hover:text-tx-p p-2 rounded-xl hover:bg-bg-btn-hover border border-border-s transition-colors cursor-pointer"
          @click="toggleTheme"
        >
          <Sun v-if="isDarkMode" class="w-4 h-4 text-hust-gold" />
          <Moon v-else class="w-4 h-4 text-accent-violet" />
        </button>

        <!-- Refresh Button -->
        <button
          class="bg-hust-red hover:bg-hust-red-hover text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          :disabled="cacheStore.isFetchingBackend"
          @click="handleRefresh"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': cacheStore.isFetchingBackend }" />
          <span class="hidden md:inline">Làm mới</span>
        </button>
      </div>
    </header>

    <!-- Mobile Sub-navigation Tabs -->
    <div class="sm:hidden flex items-center justify-center gap-2 bg-bg-head p-2 border-b border-border-p">
      <button
        class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
        :class="activeTab === 'metrics' ? 'bg-hust-red text-white' : 'text-tx-s'"
        @click="activeTab = 'metrics'"
      >
        <BarChart3 class="w-3.5 h-3.5" />
        <span>Giám Sát</span>
      </button>
      <button
        class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
        :class="activeTab === 'l2hub' ? 'bg-hust-red text-white' : 'text-tx-s'"
        @click="activeTab = 'l2hub'"
      >
        <Network class="w-3.5 h-3.5" />
        <span>Cấu Hình L2</span>
      </button>
    </div>

    <!-- Main View Content Area -->
    <main class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      
      <!-- ================================================================= -->
      <!-- TAB 1: METRICS & LOGS (GIÁM SÁT HIỆU NĂNG) -->
      <!-- ================================================================= -->
      <div v-if="activeTab === 'metrics'" class="space-y-6 animate-fade-in">
        
        <!-- 4 Top KPI Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <!-- KPI 1: Prefix Cache Hit Ratio -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-tx-m uppercase tracking-wider">Tỉ Lệ Trúng Cache</span>
              <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Gauge class="w-3.5 h-3.5" />
              </div>
            </div>
            <div class="mt-2.5">
              <div class="text-2xl sm:text-3xl font-black text-tx-p font-mono tracking-tight">{{ cacheStore.hitRate }}%</div>
              <p class="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1 font-mono">
                <TrendingUp class="w-3 h-3" />
                <span>{{ cacheStore.stats.hits }} Hits / {{ cacheStore.stats.misses }} Misses</span>
              </p>
            </div>
          </div>

          <!-- KPI 2: Total Time / Latency Saved -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-tx-m uppercase tracking-wider">Thời Gian Tiết Kiệm</span>
              <div class="p-1.5 rounded-lg bg-hust-gold/10 text-hust-gold border border-hust-gold/20">
                <Clock class="w-3.5 h-3.5" />
              </div>
            </div>
            <div class="mt-2.5">
              <div class="text-2xl sm:text-3xl font-black text-tx-p font-mono tracking-tight">{{ cacheStore.stats.totalTimeSaved }}s</div>
              <p class="text-[10px] text-hust-gold mt-1 font-semibold font-mono">
                {{ cacheStore.stats.hits === 0 ? 'Chưa có lượt trúng (0s)' : '~97.2% tốc độ cải thiện' }}
              </p>
            </div>
          </div>

          <!-- KPI 3: Cached Tokens Saved -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-tx-m uppercase tracking-wider">Tokens Tiết Kiệm</span>
              <div class="p-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                <Coins class="w-3.5 h-3.5" />
              </div>
            </div>
            <div class="mt-2.5">
              <div class="text-2xl sm:text-3xl font-black text-tx-p font-mono tracking-tight">
                {{ (cacheStore.backendStats?.totalCachedTokensSaved ?? cacheStore.backendStats?.promptTokensLocalCacheHit ?? cacheStore.stats.totalTokensSaved ?? 0).toLocaleString() }}
              </div>
              <p class="text-[10px] text-accent-cyan mt-1 font-semibold font-mono">
                {{ (cacheStore.backendStats?.promptTokensLocalCompute ?? 0) > 0 ? `${cacheStore.backendStats?.promptTokensLocalCompute.toLocaleString()} computed` : 'Tránh tính toán lại Prefill' }}
              </p>
            </div>
          </div>

          <!-- KPI 4: KV Cache GPU Usage -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-tx-m uppercase tracking-wider">Sử Dụng KV Cache</span>
              <div class="p-1.5 rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                <Cpu class="w-3.5 h-3.5" />
              </div>
            </div>
            <div class="mt-2.5">
              <div class="text-2xl sm:text-3xl font-black text-tx-p font-mono tracking-tight">
                {{ ((cacheStore.backendStats?.kvCacheUsagePerc ?? cacheStore.vllmMetrics?.kvCacheUsagePerc) ?? 0).toFixed(1) }}%
              </div>
              <p class="text-[10px] text-accent-violet mt-1 font-semibold font-mono">
                vLLM PagedAttention Pool
              </p>
            </div>
          </div>
        </div>

        <!-- Live Performance Telemetry Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div class="bg-bg-inp/40 border border-border-p p-2.5 rounded-xl flex items-center justify-between">
            <span class="text-[10px] text-tx-s font-sans">TTFT Trung Bình</span>
            <span class="font-bold text-emerald-400">
              {{ cacheStore.vllmMetrics?.timeToFirstTokenAvgSeconds != null ? `${(cacheStore.vllmMetrics.timeToFirstTokenAvgSeconds * 1000).toFixed(0)} ms` : '0 ms' }}
            </span>
          </div>
          <div class="bg-bg-inp/40 border border-border-p p-2.5 rounded-xl flex items-center justify-between">
            <span class="text-[10px] text-tx-s font-sans">E2E Latency</span>
            <span class="font-bold text-tx-p">
              {{ cacheStore.vllmMetrics?.e2eLatencyAvgSeconds != null ? `${(cacheStore.vllmMetrics.e2eLatencyAvgSeconds * 1000).toFixed(0)} ms` : '0 ms' }}
            </span>
          </div>
          <div class="bg-bg-inp/40 border border-border-p p-2.5 rounded-xl flex items-center justify-between">
            <span class="text-[10px] text-tx-s font-sans">Running Requests</span>
            <span class="font-bold text-accent-cyan">
              {{ cacheStore.vllmMetrics?.numRequestsRunning ?? 0 }}
            </span>
          </div>
          <div class="bg-bg-inp/40 border border-border-p p-2.5 rounded-xl flex items-center justify-between">
            <span class="text-[10px] text-tx-s font-sans">Uptime Máy Chủ</span>
            <span class="font-bold text-hust-gold">
              {{ formatUptime(cacheStore.systemStatus?.uptimeSeconds) }}
            </span>
          </div>
        </div>

        <!-- 2 Main Chart Visualizations -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Chart 1: Hit Rate Distribution Doughnut -->
          <div class="glass-panel p-5 rounded-2xl border border-border-p flex flex-col items-center justify-between shadow-xs">
            <div class="w-full flex items-center justify-between mb-2">
              <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                <Gauge class="w-4 h-4 text-emerald-400" />
                <span>Phân Bổ Hit / Miss</span>
              </h3>
              <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {{ cacheStore.stats.totalRequests === 0 ? '0 Truy Vấn' : `${cacheStore.stats.totalRequests} Tổng` }}
              </span>
            </div>

            <div class="relative w-40 h-40 flex items-center justify-center my-3 select-none">
              <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
              <div class="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                <span class="text-3xl font-black text-tx-p font-mono leading-none">{{ cacheStore.hitRate }}%</span>
                <span class="text-[9px] text-hust-gold font-extrabold uppercase tracking-widest mt-1">HIT RATIO</span>
              </div>
            </div>

            <div class="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border-p text-center text-xs font-mono">
              <div class="bg-bg-inp/60 p-2 rounded-xl border border-border-p">
                <p class="text-[10px] text-tx-s font-sans">Hits</p>
                <p class="font-bold text-emerald-400 text-sm mt-0.5">{{ cacheStore.stats.hits }}</p>
              </div>
              <div class="bg-bg-inp/60 p-2 rounded-xl border border-border-p">
                <p class="text-[10px] text-tx-s font-sans">Misses</p>
                <p class="font-bold text-rose-400 text-sm mt-0.5">{{ cacheStore.stats.misses }}</p>
              </div>
            </div>
          </div>

          <!-- Chart 2: Latency Benchmark Bar Chart -->
          <div class="lg:col-span-2 glass-panel p-5 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 class="w-4 h-4 text-hust-gold" />
                  <span>So Sánh Độ Trễ Các Tầng Lưu Trữ (Latency Benchmark)</span>
                </h3>
                <p class="text-[10px] text-tx-s mt-0.5">Thời gian truy xuất KV Cache theo mili-giây (ms)</p>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ~97.2% Speedup
              </span>
            </div>

            <div class="h-52 w-full my-2">
              <Bar :data="latencyChartData" :options="latencyChartOptions" />
            </div>

            <div class="grid grid-cols-4 gap-2 text-center text-[10px] font-mono border-t border-border-p pt-3">
              <div><span class="text-rose-400 font-bold">1280ms</span> (Cold LLM)</div>
              <div><span class="text-emerald-400 font-bold">35ms</span> (Host DRAM)</div>
              <div><span class="text-hust-gold font-bold">110ms</span> (NVMe SSD)</div>
              <div><span class="text-accent-violet font-bold">220ms</span> (Redis / S3)</div>
            </div>
          </div>
        </div>

        <!-- Filterable Database History & Cache Table -->
        <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-4 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border"
                :class="activeLogView === 'db' ? 'bg-hust-red text-white border-hust-red shadow-xs' : 'bg-bg-inp border-border-s text-tx-s hover:text-tx-p'"
                @click="activeLogView = 'db'"
              >
                <Database class="w-3.5 h-3.5 text-hust-gold" />
                <span>Lịch Sử Chat PostgreSQL ({{ cacheStore.dbChatHistory.length }})</span>
              </button>

              <button
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border"
                :class="activeLogView === 'client' ? 'bg-hust-red text-white border-hust-red shadow-xs' : 'bg-bg-inp border-border-s text-tx-s hover:text-tx-p'"
                @click="activeLogView = 'client'"
              >
                <Zap class="w-3.5 h-3.5 text-accent-cyan" />
                <span>Bản Ghi LMCache ({{ cacheStore.cacheItems.length }})</span>
              </button>
            </div>

            <div class="flex items-center gap-2">
              <div class="relative flex-1 sm:w-64">
                <input
                  v-model="searchLogFilter"
                  type="text"
                  placeholder="Tìm kiếm prompt..."
                  class="w-full bg-bg-inp border border-border-p text-tx-p text-xs px-3 py-1.5 rounded-xl pl-8 focus:outline-none focus:border-border-s"
                />
                <Search class="w-3.5 h-3.5 text-tx-m absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                v-if="activeLogView === 'client' && cacheStore.cacheItems.length > 0"
                class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                @click="cacheStore.clearAll()"
              >
                Xóa sạch
              </button>
            </div>
          </div>

          <!-- VIEW 1: PostgreSQL Chat History Records -->
          <div v-if="activeLogView === 'db'" class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-border-p text-[10px] text-tx-m uppercase font-bold tracking-wider">
                  <th class="py-2.5 px-3">Prompt</th>
                  <th class="py-2.5 px-3">Cached Tokens</th>
                  <th class="py-2.5 px-3">Hit Ratio</th>
                  <th class="py-2.5 px-3">Latency</th>
                  <th class="py-2.5 px-3">Total Tokens</th>
                  <th class="py-2.5 px-3 text-right">Thời Gian</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-p/50">
                <tr v-if="filteredDbHistory.length === 0">
                  <td colspan="6" class="py-8 text-center text-tx-s italic">
                    Không có bản ghi chat nào trong cơ sở dữ liệu PostgreSQL
                  </td>
                </tr>
                <tr
                  v-for="item in filteredDbHistory"
                  :key="item.id"
                  class="hover:bg-bg-btn-hover/50 transition-colors"
                >
                  <td class="py-3 px-3 max-w-sm">
                    <p class="font-semibold text-tx-p truncate" :title="item.prompt">{{ item.prompt }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[9px] text-hust-gold px-1.5 py-0.2 rounded bg-hust-gold/10 font-mono">
                        {{ item.model }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-3 font-mono font-bold" :class="item.cachedTokens > 0 ? 'text-emerald-400' : 'text-tx-s'">
                    {{ item.cachedTokens }}
                  </td>
                  <td class="py-3 px-3 font-mono font-bold" :class="item.cacheHitRatioPercentage > 0 ? 'text-emerald-400' : 'text-tx-s'">
                    {{ item.cacheHitRatioPercentage.toFixed(1) }}%
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-tx-p">
                    {{ item.executionTimeMs }} ms
                  </td>
                  <td class="py-3 px-3 font-mono text-tx-s">
                    {{ item.totalTokens }}
                    <span class="text-[9px] text-tx-m block">({{ item.promptTokens }} in / {{ item.completionTokens }} out)</span>
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-[10px] text-tx-s whitespace-nowrap">
                    {{ formatDate(item.createdAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- VIEW 2: In-Memory LMCache Items -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-border-p text-[10px] text-tx-m uppercase font-bold tracking-wider">
                  <th class="py-2.5 px-3">Prompt</th>
                  <th class="py-2.5 px-3">Hits</th>
                  <th class="py-2.5 px-3">Tokens</th>
                  <th class="py-2.5 px-3">Original Latency</th>
                  <th class="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-p/50">
                <tr v-if="filteredCacheItems.length === 0">
                  <td colspan="5" class="py-8 text-center text-tx-s italic">
                    Chưa có bản ghi bộ nhớ đệm nào (0 bản ghi)
                  </td>
                </tr>
                <tr
                  v-for="item in filteredCacheItems"
                  :key="item.id"
                  class="hover:bg-bg-btn-hover/50 transition-colors"
                >
                  <td class="py-3 px-3 font-semibold text-tx-p max-w-md truncate">
                    {{ item.prompt }}
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-hust-gold">
                    {{ item.hits }}
                  </td>
                  <td class="py-3 px-3 font-mono text-tx-s">
                    {{ item.tokens }} tokens
                  </td>
                  <td class="py-3 px-3 font-mono text-emerald-400 font-bold">
                    {{ item.latency }}s
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button
                      class="text-tx-s hover:text-rose-400 p-1.5 rounded-lg hover:bg-bg-btn-hover cursor-pointer transition-colors"
                      v-tooltip.top="'Xóa bản ghi'"
                      @click="cacheStore.deleteItem(item.id)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- TAB 2: L2 STORAGE HUB (CẤU HÌNH TẦNG L2 & ĐỐI CHIẾU KIẾN TRÚC) -->
      <!-- ================================================================= -->
      <div v-else-if="activeTab === 'l2hub'" class="space-y-6 animate-fade-in">

        <!-- L2 Storage Active Status Banner -->
        <div class="glass-panel p-5 rounded-2xl border border-border-p bg-gradient-to-r from-bg-card via-bg-inp/40 to-bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-tx-m uppercase tracking-wider flex items-center gap-1.5">
                <Network class="w-4 h-4 text-hust-gold" />
                <span>Trạng Thái Tầng L2:</span>
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1.5 shadow-xs"
                :class="cacheStore.l2Config.status === 'connected'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : cacheStore.l2Config.status === 'testing'
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                  : cacheStore.l2Config.status === 'disconnected'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="cacheStore.l2Config.status === 'connected' ? 'bg-emerald-400 animate-ping' : cacheStore.l2Config.status === 'testing' ? 'bg-accent-cyan animate-spin' : cacheStore.l2Config.status === 'disconnected' ? 'bg-rose-400' : 'bg-amber-400'"
                ></span>
                <span>{{ cacheStore.l2Config.status.toUpperCase() }}</span>
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-0.5 text-xs font-mono">
              <div class="flex items-center gap-1 text-tx-s">
                <span>URI:</span>
                <code class="text-hust-gold bg-bg-app px-2 py-0.5 rounded border border-border-s font-bold text-[11px] truncate max-w-xs sm:max-w-md">
                  {{ cacheStore.l2Config.connectionUrl }}
                </code>
              </div>

              <div v-if="cacheStore.l2Config.pingMs" class="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                <Activity class="w-3.5 h-3.5" />
                <span>RTT: {{ cacheStore.l2Config.pingMs }}ms</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions in Banner -->
          <div class="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              class="border border-border-s bg-bg-inp hover:bg-bg-btn-hover text-tx-p px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              :disabled="isTestingL2"
              @click="handleTestL2Connection"
            >
              <RefreshCw class="w-3.5 h-3.5 text-accent-cyan" :class="{ 'animate-spin': isTestingL2 }" />
              <span>{{ isTestingL2 ? 'Đang kiểm tra...' : 'Kiểm Tra Ping' }}</span>
            </button>

            <button
              class="bg-hust-red hover:bg-hust-red-hover text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              @click="handleSaveL2Config"
            >
              <Save class="w-3.5 h-3.5" />
              <span>Lưu & Kích Hoạt</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- Left Column: Bộ Điều Khiển Tầng L2 (7 Cols) -->
          <div class="lg:col-span-7 space-y-5">

            <!-- 1. Chọn Tầng Lưu Trữ (1-Click Switcher) -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3.5 shadow-xs">
              <div class="flex items-center justify-between border-b border-border-p pb-2.5">
                <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                  <Sliders class="w-4 h-4 text-hust-gold" />
                  <span>1. Chọn Tầng Lưu Trữ L2 (1-Click Presets)</span>
                </h3>
                <span class="text-[10px] text-tx-s font-mono">4 Cấu Trúc Hỗ Trợ</span>
              </div>

              <!-- 4 Architecture Cards Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div
                  v-for="preset in l2Presets"
                  :key="preset.type"
                  class="p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between"
                  :class="cacheStore.l2Config.backendType === preset.type
                    ? 'bg-hust-gold/10 border-hust-gold shadow-xs'
                    : 'bg-bg-inp/40 border-border-s hover:bg-bg-btn-hover/60'"
                  @click="applyL2Preset(preset)"
                >
                  <div class="flex items-center justify-between">
                    <component
                      :is="preset.type === 'dram' ? Cpu : preset.type === 'nvme' ? HardDrive : preset.type === 'redis' ? Cloud : Database"
                      class="w-4 h-4"
                      :class="cacheStore.l2Config.backendType === preset.type ? 'text-hust-gold' : 'text-tx-s'"
                    />
                    <span class="text-[9px] font-mono text-emerald-400 font-bold">{{ preset.latency }}</span>
                  </div>
                  <div class="mt-2 text-left">
                    <p class="font-bold text-xs text-tx-p truncate">{{ preset.name.split(' ')[0] }}</p>
                    <p class="text-[9px] text-tx-s mt-0.5 truncate">{{ preset.tag }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Gán Liên Kết Điểm Cuối L2 & Auth Token -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-4 shadow-xs">
              <div class="flex items-center justify-between border-b border-border-p pb-2.5">
                <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                  <Link2 class="w-4 h-4 text-hust-gold" />
                  <span>2. Gán Đường Dẫn Kết Nối Điểm Cuối (URI Endpoint)</span>
                </h3>
                <span class="text-[10px] text-hust-gold font-bold font-mono">BẮT BUỘC</span>
              </div>

              <!-- URL Input Box with prefix icon -->
              <div class="space-y-1.5 text-xs">
                <label class="font-bold text-tx-p flex items-center justify-between">
                  <span>Địa chỉ URI / Endpoint:</span>
                  <span class="text-[10px] font-mono text-tx-s">redis:// | s3:// | /mnt/nvme</span>
                </label>
                <div class="relative">
                  <input
                    v-model="cacheStore.l2Config.connectionUrl"
                    type="text"
                    placeholder="Nhập đường dẫn kết nối L2 (ví dụ: redis://host:6379/0 hoặc s3://bucket/prefix)..."
                    class="w-full bg-bg-inp border border-border-s text-tx-p font-mono text-xs px-3.5 py-2.5 rounded-xl pl-9 focus:outline-none focus:border-hust-gold shadow-inner"
                  />
                  <Link2 class="w-4 h-4 text-hust-gold absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <!-- Optional Auth Token / Password Input -->
              <div class="space-y-1.5 text-xs pt-1 border-t border-border-p">
                <label class="font-bold text-tx-p flex items-center justify-between">
                  <span>Mật mã / Secret Key / Token (Tùy chọn):</span>
                  <span class="text-[10px] text-tx-s font-normal">Cho Redis AUTH / S3 Access</span>
                </label>
                <div class="relative">
                  <input
                    v-model="cacheStore.l2Config.authToken"
                    :type="showAuthToken ? 'text' : 'password'"
                    placeholder="Nhập token hoặc mật mã kết nối nếu có..."
                    class="w-full bg-bg-inp border border-border-s text-tx-p font-mono text-xs px-3.5 py-2 rounded-xl pr-10 focus:outline-none focus:border-hust-gold shadow-inner"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-tx-s hover:text-tx-p cursor-pointer"
                    @click="showAuthToken = !showAuthToken"
                  >
                    <Eye v-if="!showAuthToken" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. Tinh Chỉnh Tham Số (Advanced Tuning - Compact Grid) -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-4 shadow-xs">
              <div class="flex items-center justify-between border-b border-border-p pb-2.5">
                <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                  <Sliders class="w-4 h-4 text-hust-gold" />
                  <span>3. Tinh Chỉnh Tham Số Hiệu Năng & Hạn Ngạch</span>
                </h3>
                <span class="text-[10px] text-tx-s font-mono">Tối Ưu Hoá KV Cache</span>
              </div>

              <!-- Chunk Size -->
              <div class="flex items-center justify-between text-xs">
                <div>
                  <p class="font-bold text-tx-p">Chunk Size (Tokens / Khối):</p>
                  <p class="text-[10px] text-tx-s">Độ chi tiết khi băm khối KV Cache</p>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    v-for="size in [128, 256, 512]"
                    :key="size"
                    class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer"
                    :class="cacheStore.l2Config.chunkSize === size ? 'bg-hust-red text-white border-hust-red shadow-xs' : 'bg-bg-inp border-border-s text-tx-s hover:text-tx-p'"
                    @click="cacheStore.l2Config.chunkSize = size; cacheStore.saveL2Config()"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <!-- RAM Limit Slider -->
              <div class="space-y-1.5 text-xs border-t border-border-p pt-3">
                <div class="flex justify-between items-center">
                  <p class="font-bold text-tx-p">Giới Hạn Host DRAM (RAM Máy Chủ):</p>
                  <span class="font-mono font-bold text-hust-gold bg-bg-app px-2 py-0.5 rounded border border-border-s">
                    {{ cacheStore.l2Config.localCpuMemoryLimitGb }} GB
                  </span>
                </div>
                <Slider v-model="cacheStore.l2Config.localCpuMemoryLimitGb" :min="4" :max="128" :step="4" @change="cacheStore.saveL2Config()" />
              </div>

              <!-- Disk Limit Slider -->
              <div class="space-y-1.5 text-xs border-t border-border-p pt-3">
                <div class="flex justify-between items-center">
                  <p class="font-bold text-tx-p">Dung Lượng Đĩa NVMe / Lưu Trữ L2:</p>
                  <span class="font-mono font-bold text-accent-cyan bg-bg-app px-2 py-0.5 rounded border border-border-s">
                    {{ cacheStore.l2Config.maxDiskSizeGb }} GB
                  </span>
                </div>
                <Slider v-model="cacheStore.l2Config.maxDiskSizeGb" :min="100" :max="4000" :step="100" @change="cacheStore.saveL2Config()" />
              </div>

              <!-- Eviction Policy & Pin Memory -->
              <div class="grid grid-cols-2 gap-3 border-t border-border-p pt-3 text-xs">
                <div>
                  <p class="font-bold text-tx-p">Thu hồi bộ nhớ (Eviction):</p>
                  <select
                    v-model="cacheStore.l2Config.evictionPolicy"
                    class="w-full mt-1.5 bg-bg-inp border border-border-s text-tx-p text-xs p-2 rounded-xl font-medium focus:outline-none"
                    @change="cacheStore.saveL2Config()"
                  >
                    <option value="LRU">LRU (Gần nhất)</option>
                    <option value="LFU">LFU (Tần suất)</option>
                    <option value="FIFO">FIFO (Tuần tự)</option>
                  </select>
                </div>

                <div>
                  <p class="font-bold text-tx-p">CUDA Pin Memory:</p>
                  <button
                    class="w-full mt-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="cacheStore.l2Config.pinMemory ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-bg-inp text-tx-s border-border-s'"
                    @click="cacheStore.l2Config.pinMemory = !cacheStore.l2Config.pinMemory; cacheStore.saveL2Config()"
                  >
                    <CheckCircle2 v-if="cacheStore.l2Config.pinMemory" class="w-3.5 h-3.5 text-emerald-400" />
                    <span>{{ cacheStore.l2Config.pinMemory ? 'Bật Pin Memory' : 'Tắt Pin Memory' }}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Artifacts, Code & Specs Matrix (5 Cols) -->
          <div class="lg:col-span-5 space-y-5">

            <!-- Artifact 1: Live Generated lmcache.yaml -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 shadow-xs font-mono">
              <div class="flex items-center justify-between border-b border-border-p pb-2.5">
                <div class="flex items-center gap-2">
                  <Code2 class="w-4 h-4 text-hust-gold" />
                  <span class="text-xs font-bold text-tx-p">lmcache.yaml</span>
                </div>
                <button
                  class="bg-bg-inp hover:bg-bg-btn-hover text-tx-s hover:text-tx-p border border-border-s px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  @click="copyL2Yaml"
                >
                  <Check v-if="copiedL2Yaml" class="w-3.5 h-3.5 text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedL2Yaml ? 'Đã sao chép' : 'Sao chép YAML' }}</span>
                </button>
              </div>

              <pre class="p-3 bg-bg-inp/90 rounded-xl border border-border-p text-xs text-hust-gold overflow-x-auto leading-relaxed"><code>{{ liveL2Yaml }}</code></pre>
            </div>

            <!-- Artifact 2: Terminal Launch CLI -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 shadow-xs font-mono">
              <div class="flex items-center justify-between border-b border-border-p pb-2.5">
                <div class="flex items-center gap-2">
                  <Terminal class="w-4 h-4 text-accent-cyan" />
                  <span class="text-xs font-bold text-tx-p">Khởi chạy vLLM CLI</span>
                </div>
                <button
                  class="bg-bg-inp hover:bg-bg-btn-hover text-tx-s hover:text-tx-p border border-border-s px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  @click="copyCliCommand"
                >
                  <Check v-if="copiedCli" class="w-3.5 h-3.5 text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedCli ? 'Đã sao chép' : 'Sao chép lệnh' }}</span>
                </button>
              </div>

              <pre class="p-3 bg-bg-inp/90 rounded-xl border border-border-p text-xs text-accent-cyan overflow-x-auto leading-relaxed"><code>{{ liveCliCommand }}</code></pre>
            </div>

            <!-- Compact Tier Comparison Matrix Specs -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 shadow-xs">
              <div class="flex items-center justify-between border-b border-border-p pb-2.5">
                <h4 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-1.5">
                  <Layers class="w-4 h-4 text-hust-gold" />
                  <span>Bảng Đối Chiếu Các Tầng Bộ Nhớ</span>
                </h4>
                <span class="text-[10px] text-tx-s font-mono">Thông Số Kỹ Thuật</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr class="border-b border-border-p text-[9px] text-tx-m uppercase font-bold tracking-wider">
                      <th class="py-2 px-2.5">Tầng</th>
                      <th class="py-2 px-2.5">Độ Trễ</th>
                      <th class="py-2 px-2.5">Băng Thông</th>
                      <th class="py-2 px-2.5 text-right">Chi Phí</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-p/50 text-[11px]">
                    <tr class="hover:bg-bg-btn-hover/30">
                      <td class="py-2 px-2.5 font-bold text-emerald-400 flex items-center gap-1">
                        <Zap class="w-3.5 h-3.5" /> L1 GPU HBM
                      </td>
                      <td class="py-2 px-2.5 text-emerald-400 font-bold">&lt; 1 ms</td>
                      <td class="py-2 px-2.5 text-tx-s">~2000 GB/s</td>
                      <td class="py-2 px-2.5 text-right text-rose-400 font-bold">$$$$$</td>
                    </tr>
                    <tr class="hover:bg-bg-btn-hover/30">
                      <td class="py-2 px-2.5 font-bold text-accent-cyan flex items-center gap-1">
                        <Cpu class="w-3.5 h-3.5" /> L2 Host DRAM
                      </td>
                      <td class="py-2 px-2.5 text-emerald-400 font-bold">15 - 35 ms</td>
                      <td class="py-2 px-2.5 text-tx-s">~200 GB/s</td>
                      <td class="py-2 px-2.5 text-right text-hust-gold">$$$</td>
                    </tr>
                    <tr class="hover:bg-bg-btn-hover/30">
                      <td class="py-2 px-2.5 font-bold text-hust-gold flex items-center gap-1">
                        <HardDrive class="w-3.5 h-3.5" /> L2 NVMe SSD
                      </td>
                      <td class="py-2 px-2.5 text-hust-gold font-bold">65 - 110 ms</td>
                      <td class="py-2 px-2.5 text-tx-s">~10 GB/s</td>
                      <td class="py-2 px-2.5 text-right text-emerald-400 font-bold">$</td>
                    </tr>
                    <tr class="hover:bg-bg-btn-hover/30">
                      <td class="py-2 px-2.5 font-bold text-accent-violet flex items-center gap-1">
                        <Cloud class="w-3.5 h-3.5" /> L2 Redis/S3
                      </td>
                      <td class="py-2 px-2.5 text-accent-violet font-bold">150 - 250 ms</td>
                      <td class="py-2 px-2.5 text-tx-s">~2 GB/s</td>
                      <td class="py-2 px-2.5 text-right text-accent-cyan">Cloud Pool</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

    </main>
  </div>
</template>

<style scoped>
:deep(.p-slider) {
  height: 6px;
}
</style>
