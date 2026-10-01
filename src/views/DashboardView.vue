<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCacheStore } from '../stores/cache'
import { useChatStore } from '../stores/chat'
import { useLangStore } from '../stores/lang'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import InputNumber from 'primevue/inputnumber'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
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
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  Cloud,
  Code2,
  Copy,
  Check,
  HelpCircle,
  Sun,
  Moon,
  Info,
  ExternalLink,
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

const activeTab = ref<'metrics' | 'advisor' | 'matrix'>('metrics')
const searchLogFilter = ref('')
const copiedConfig = ref(false)
const isDarkMode = ref(true)

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

// ----------------------------------------------------
// L2 STORAGE ADVISORY CALCULATOR / QUESTIONNAIRE STATE
// ----------------------------------------------------
const topology = ref<'single' | 'cluster'>('single')
const hostRamGb = ref<number>(64)
const nvmeStorageGb = ref<number>(1000)
const avgContextTokens = ref<number>(16000)
const priorityGoal = ref<'latency' | 'capacity' | 'cluster'>('capacity')

// Dynamic L2 Storage Recommendation Engine
const recommendation = computed(() => {
  if (topology.value === 'cluster' || priorityGoal.value === 'cluster') {
    return {
      type: 'cloud',
      title: 'Remote / Distributed L2 Storage Pool (Redis / S3 / Distributed LMCache)',
      badge: 'Multi-Node Cluster Recommended',
      badgeColor: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
      icon: Cloud,
      latency: '~150 - 250 ms',
      throughputBoost: '3.5x - 5.0x',
      costEfficiency: 'High Scalability',
      description: 'Lựa chọn lý tưởng cho hạ tầng GPU Cluster nhiều node (vLLM Distributed Serving). KV Cache được chia sẻ tập trung qua Redis / S3 / Remote Memory Pool giúp mọi máy chủ trong cụm đều tái sử dụng được Cache.',
      yamlConfig: `chunk_size: 256
local_device: "cuda"
remote_url: "redis://cache-redis-cluster.internal:6379"
remote_serde: "torch"
max_local_cpu_memory: 16.0 # GB
eviction_policy: "LRU"`,
    }
  }

  if (priorityGoal.value === 'latency' && hostRamGb.value >= 64) {
    return {
      type: 'ram',
      title: 'Host DRAM (DRAM L2 Shared Memory)',
      badge: 'Ultra-Low Latency Recommended',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: Cpu,
      latency: '~15 - 35 ms',
      throughputBoost: '6.0x - 10.0x',
      costEfficiency: 'Medium (RAM Cost)',
      description: 'Cấu hình L2 trên bộ nhớ Host DRAM (RAM máy chủ) cho độ trễ truy xuất tức thì (<35ms). Phù hợp nhất khi máy chủ có sẵn dung lượng RAM lớn (>=64GB) và ưu tiên hàng đầu là giảm Time To First Token (TTFT).',
      yamlConfig: `chunk_size: 256
local_device: "cuda"
local_cpu_memory_limit: ${Math.min(hostRamGb.value * 0.75, 128)} # GB DRAM
eviction_policy: "LRU"
pin_memory: true`,
    }
  }

  // Default: Local NVMe SSD
  return {
    type: 'nvme',
    title: 'Local NVMe SSD Disk (NVMe L2 Storage)',
    badge: 'Best Cost/Capacity Balance',
    badgeColor: 'bg-hust-gold/15 text-hust-gold border-hust-gold/30',
    icon: HardDrive,
    latency: '~65 - 110 ms',
    throughputBoost: '4.0x - 7.0x',
    costEfficiency: 'Maximum (Highest Storage/Cost)',
    description: 'Cấu hình tối ưu nhất về chi phí và dung lượng cho máy chủ đơn. Lưu trữ KV Cache trên ổ đĩa NVMe SSD tốc độ cao giúp lưu trữ hàng Terabyte dữ liệu Prompt mà không làm kiệt sức bộ nhớ RAM.',
    yamlConfig: `chunk_size: 256
local_device: "cuda"
local_disk_path: "/mnt/nvme_ssd/lmcache_store"
max_local_disk_size: ${Math.min(nvmeStorageGb.value * 0.8, 2000)} # GB NVMe
eviction_policy: "LRU"`,
  }
})

function copyYamlConfig() {
  navigator.clipboard.writeText(recommendation.value.yamlConfig)
  copiedConfig.value = true
  toast.add({
    severity: 'success',
    summary: 'Đã sao chép cấu hình LMCache',
    detail: 'Mẫu file lmcache.yaml đã được lưu vào Clipboard.',
    life: 2500,
  })
  setTimeout(() => {
    copiedConfig.value = false
  }, 2500)
}

function handleRefresh() {
  cacheStore.refreshBackendMetrics(true)
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
  })
}

// Filtered Cache Items for table search
const filteredCacheItems = computed(() => {
  if (!searchLogFilter.value.trim()) return cacheStore.cacheItems
  const query = searchLogFilter.value.toLowerCase()
  return cacheStore.cacheItems.filter(item => item.prompt.toLowerCase().includes(query))
})

// Chart 1: Doughnut Chart
const doughnutChartData = computed(() => {
  const hits = cacheStore.stats.hits || 0
  const misses = cacheStore.stats.misses || 0
  return {
    labels: ['Cache Hits', 'Cache Misses'],
    datasets: [
      {
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
        data: [hits === 0 && misses === 0 ? 1 : hits, misses],
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
            <h1 class="font-extrabold text-xs tracking-wide text-tx-p flex items-center gap-2">
              LMCache & vLLM Analytics Dashboard
              <span class="text-[9px] text-hust-gold px-2 py-0.5 rounded-full bg-hust-gold/10 border border-hust-gold/20 font-bold font-mono">
                THESIS RELEASE
              </span>
            </h1>
            <p class="text-[10px] text-tx-s">Hệ Thống Tối Ưu Hóa Bộ Nhớ Đệm KV Cache</p>
          </div>
        </div>
      </div>

      <!-- Center: Tab Switcher -->
      <div class="hidden lg:flex items-center gap-1 bg-bg-inp/80 p-1 rounded-2xl border border-border-p">
        <button
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'metrics' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeTab = 'metrics'"
        >
          <BarChart3 class="w-3.5 h-3.5" />
          <span>Cache Metrics & Graphs</span>
        </button>

        <button
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'advisor' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeTab = 'advisor'"
        >
          <Sparkles class="w-3.5 h-3.5 text-hust-gold" />
          <span>L2 Storage Advisor</span>
        </button>

        <button
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'matrix' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="activeTab = 'matrix'"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>L2 Comparison Matrix</span>
        </button>
      </div>

      <!-- Right: Backend Health Status & Actions -->
      <div class="flex items-center gap-3">
        <!-- Live Status Pill -->
        <div 
          class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border shadow-xs"
          :class="chatStore.isBackendLive 
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'"
        >
          <span class="w-2 h-2 rounded-full" :class="chatStore.isBackendLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'"></span>
          <span>{{ chatStore.isBackendLive ? 'BACKEND LIVE' : 'MOCK MODE' }}</span>
        </div>

        <!-- Dark/Light Theme Toggle -->
        <button
          class="text-tx-s hover:text-tx-p p-2 rounded-xl hover:bg-bg-btn-hover border border-border-s transition-colors cursor-pointer"
          @click="toggleTheme"
        >
          <Sun v-if="isDarkMode" class="w-4 h-4 text-hust-gold" />
          <Moon v-else class="w-4 h-4 text-accent-violet" />
        </button>

        <button
          class="bg-hust-red hover:bg-hust-red-hover text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          @click="handleRefresh"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Refresh Metrics</span>
        </button>
      </div>
    </header>

    <!-- Mobile Sub-navigation Tabs -->
    <div class="lg:hidden flex items-center justify-center gap-1 bg-bg-head p-2 border-b border-border-p">
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
        :class="activeTab === 'metrics' ? 'bg-hust-red text-white' : 'text-tx-s'"
        @click="activeTab = 'metrics'"
      >
        Metrics
      </button>
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
        :class="activeTab === 'advisor' ? 'bg-hust-red text-white' : 'text-tx-s'"
        @click="activeTab = 'advisor'"
      >
        L2 Advisor
      </button>
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
        :class="activeTab === 'matrix' ? 'bg-hust-red text-white' : 'text-tx-s'"
        @click="activeTab = 'matrix'"
      >
        L2 Matrix
      </button>
    </div>

    <!-- Main View Content Area -->
    <main class="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      <!-- ================================================================= -->
      <!-- TAB 1: METRICS & PERFORMANCE DASHBOARD -->
      <!-- ================================================================= -->
      <div v-if="activeTab === 'metrics'" class="space-y-6 animate-fade-in">
        
        <!-- 4 Top KPI Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- KPI 1: Prefix Cache Hit Ratio -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-tx-m uppercase tracking-wider">Hit Ratio</span>
              <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Gauge class="w-4 h-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-3xl font-black text-tx-p font-mono tracking-tight">{{ cacheStore.hitRate }}%</div>
              <p class="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                <TrendingUp class="w-3 h-3" />
                Prefix KV Cache hit efficiency
              </p>
            </div>
          </div>

          <!-- KPI 2: Total Time / Latency Saved -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-tx-m uppercase tracking-wider">Time Saved</span>
              <div class="p-2 rounded-xl bg-hust-gold/10 text-hust-gold border border-hust-gold/20">
                <Clock class="w-4 h-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-3xl font-black text-tx-p font-mono tracking-tight">{{ cacheStore.stats.totalTimeSaved }}s</div>
              <p class="text-[10px] text-hust-gold mt-1 font-semibold">~97.2% average speedup</p>
            </div>
          </div>

          <!-- KPI 3: Cached Tokens Saved -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-tx-m uppercase tracking-wider">Tokens Saved</span>
              <div class="p-2 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                <Coins class="w-4 h-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-3xl font-black text-tx-p font-mono tracking-tight">
                {{ (cacheStore.backendStats?.promptTokensLocalCacheHit || cacheStore.stats.totalTokensSaved).toLocaleString() }}
              </div>
              <p class="text-[10px] text-accent-cyan mt-1 font-semibold">Zero prefill re-computation</p>
            </div>
          </div>

          <!-- KPI 4: KV Cache GPU Usage -->
          <div class="glass-panel p-4 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-tx-m uppercase tracking-wider">KV GPU Usage</span>
              <div class="p-2 rounded-xl bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                <Cpu class="w-4 h-4" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-3xl font-black text-tx-p font-mono tracking-tight">
                {{ (cacheStore.backendStats?.kvCacheUsagePerc || cacheStore.vllmMetrics?.kvCacheUsagePerc || 45.2).toFixed(1) }}%
              </div>
              <p class="text-[10px] text-accent-violet mt-1 font-semibold">vLLM GPU PagedAttention Pool</p>
            </div>
          </div>
        </div>

        <!-- 2 Main Chart Visualizations -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Chart 1: Hit Rate Distribution Doughnut -->
          <div class="glass-panel p-5 rounded-2xl border border-border-p flex flex-col items-center shadow-xs">
            <div class="w-full flex items-center justify-between mb-4">
              <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                <Gauge class="w-4 h-4 text-emerald-400" />
                Cache Hit vs Miss Breakdown
              </h3>
              <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {{ cacheStore.stats.hits }} Hits / {{ cacheStore.stats.misses }} Misses
              </span>
            </div>

            <div class="relative w-44 h-44 flex items-center justify-center my-2 select-none">
              <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
              <div class="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                <span class="text-3xl font-black text-tx-p font-mono leading-none">{{ cacheStore.hitRate }}%</span>
                <span class="text-[9px] text-hust-gold font-extrabold uppercase tracking-widest mt-1">HIT RATIO</span>
              </div>
            </div>

            <div class="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border-p text-center text-xs">
              <div class="bg-bg-inp/60 p-2 rounded-xl border border-border-p">
                <p class="text-[10px] text-tx-s">Cache Hits</p>
                <p class="font-bold text-emerald-400 text-sm font-mono mt-0.5">{{ cacheStore.stats.hits }}</p>
              </div>
              <div class="bg-bg-inp/60 p-2 rounded-xl border border-border-p">
                <p class="text-[10px] text-tx-s">Cache Misses</p>
                <p class="font-bold text-rose-400 text-sm font-mono mt-0.5">{{ cacheStore.stats.misses }}</p>
              </div>
            </div>
          </div>

          <!-- Chart 2: Latency Benchmark Bar Chart -->
          <div class="lg:col-span-2 glass-panel p-5 rounded-2xl border border-border-p flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 class="w-4 h-4 text-hust-gold" />
                  Latency Comparison Benchmark (Cold vs L1 vs L2 Layers)
                </h3>
                <p class="text-[10px] text-tx-s mt-0.5">Thời gian xử lý câu hỏi trung bình theo mili-giây (ms)</p>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ~97.2% Speedup
              </span>
            </div>

            <div class="h-56 w-full my-2">
              <Bar :data="latencyChartData" :options="latencyChartOptions" />
            </div>

            <div class="grid grid-cols-4 gap-2 text-center text-[10px] font-mono border-t border-border-p pt-3">
              <div><span class="text-rose-400 font-bold">1280ms</span> (Cold GPU)</div>
              <div><span class="text-emerald-400 font-bold">35ms</span> (Host DRAM)</div>
              <div><span class="text-hust-gold font-bold">110ms</span> (NVMe SSD)</div>
              <div><span class="text-accent-violet font-bold">220ms</span> (Redis/Cloud)</div>
            </div>
          </div>
        </div>

        <!-- Filterable Cache Prompt Table -->
        <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-4 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2">
                <Database class="w-4 h-4 text-hust-gold" />
                Bản Ghi Bộ Nhớ Đệm LMCache ({{ cacheStore.cacheItems.length }})
              </h3>
              <p class="text-[10px] text-tx-s mt-0.5">Danh sách các prompt được lưu trữ trong cache</p>
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
                v-if="cacheStore.cacheItems.length > 0"
                class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                @click="cacheStore.clearAll()"
              >
                Xóa sạch
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
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
                    Không tìm thấy bản ghi cache nào
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
      <!-- TAB 2: LMCACHE L2 STORAGE ADVISORY TOOL (AI CONFIG RECOMMENDER) -->
      <!-- ================================================================= -->
      <div v-else-if="activeTab === 'advisor'" class="space-y-6 animate-fade-in">
        
        <!-- Advisor Banner -->
        <div class="glass-panel p-6 rounded-2xl border border-border-p bg-gradient-to-r from-hust-red/10 via-bg-card to-hust-gold/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1">
            <h2 class="text-lg font-black text-tx-p flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-hust-gold" />
              Công Cụ Tư Vấn Cấu Hình Cấp Lưu Trữ L2 (LMCache L2 Storage Advisor)
            </h2>
            <p class="text-xs text-tx-s max-w-2xl leading-relaxed">
              Dựa vào quy mô hạ tầng máy chủ GPU, dung lượng RAM, nhu cầu Prompt Context và ngân sách của bạn, công cụ sẽ đưa ra **đề xuất cấu hình tầng lưu trữ L2 tối ưu nhất** (Host DRAM vs Local NVMe SSD vs Remote Cloud Pool).
            </p>
          </div>
          <a
            href="https://lmcache.ai"
            target="_blank"
            class="bg-bg-inp hover:bg-bg-btn-hover text-tx-p border border-border-s px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap self-start md:self-auto"
          >
            <span>Tài liệu LMCache.ai</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Questionnaire Form (5 Columns) -->
          <div class="lg:col-span-5 glass-panel p-5 rounded-2xl border border-border-p space-y-5 shadow-xs">
            <h3 class="text-xs font-extrabold text-tx-p uppercase tracking-wider flex items-center gap-2 border-b border-border-p pb-3">
              <Sliders class="w-4 h-4 text-hust-gold" />
              1. Nhập Thông Số Hạ Tầng Server
            </h3>

            <!-- Question 1: Topology -->
            <div class="space-y-1.5 text-xs">
              <label class="font-bold text-tx-p flex items-center gap-1">Q1. Kiến trúc hạ tầng GPU:</label>
              <select
                v-model="topology"
                class="w-full bg-bg-inp border border-border-s text-tx-p text-xs p-2.5 rounded-xl font-medium focus:outline-none"
              >
                <option value="single">Một máy chủ đơn (Single GPU Server Node)</option>
                <option value="cluster">Cụm nhiều máy chủ GPU (Multi-Node GPU Cluster Pool)</option>
              </select>
            </div>

            <!-- Question 2: Host RAM -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <label class="font-bold text-tx-p">Q2. Dung lượng Host RAM (DRAM):</label>
                <span class="font-mono font-bold text-hust-gold bg-bg-app px-2 py-0.5 rounded border border-border-s">
                  {{ hostRamGb }} GB
                </span>
              </div>
              <Slider v-model="hostRamGb" :min="16" :max="512" :step="16" />
            </div>

            <!-- Question 3: NVMe Storage -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <label class="font-bold text-tx-p">Q3. Dung lượng ổ cứng NVMe SSD:</label>
                <span class="font-mono font-bold text-accent-cyan bg-bg-app px-2 py-0.5 rounded border border-border-s">
                  {{ nvmeStorageGb }} GB
                </span>
              </div>
              <Slider v-model="nvmeStorageGb" :min="250" :max="4000" :step="250" />
            </div>

            <!-- Question 4: Context Tokens -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <label class="font-bold text-tx-p">Q4. Chiều dài Prompt / Context trung bình:</label>
                <span class="font-mono font-bold text-emerald-400 bg-bg-app px-2 py-0.5 rounded border border-border-s">
                  {{ (avgContextTokens / 1000).toFixed(0) }}k Tokens
                </span>
              </div>
              <Slider v-model="avgContextTokens" :min="2000" :max="64000" :step="2000" />
            </div>

            <!-- Question 5: Goal -->
            <div class="space-y-1.5 text-xs">
              <label class="font-bold text-tx-p flex items-center gap-1">Q5. Mục tiêu ưu tiên hàng đầu:</label>
              <select
                v-model="priorityGoal"
                class="w-full bg-bg-inp border border-border-s text-tx-p text-xs p-2.5 rounded-xl font-medium focus:outline-none"
              >
                <option value="latency">Tối ưu độ trễ siêu thấp (Ultra-Low Latency - <35ms)</option>
                <option value="capacity">Cân bằng chi phí & Dung lượng lưu trữ lớn</option>
                <option value="cluster">Chia sẻ Cache giữa nhiều GPU instances</option>
              </select>
            </div>
          </div>

          <!-- Right: AI Advisory Output & Code Generator (7 Columns) -->
          <div class="lg:col-span-7 space-y-6">
            
            <!-- Recommendation Output Card -->
            <div class="glass-panel p-6 rounded-2xl border border-border-p space-y-4 shadow-xs relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-tx-m uppercase tracking-wider">Đề xuất cấu hình L2</span>
                <span class="px-3 py-1 rounded-full text-[10px] font-extrabold border shadow-xs" :class="recommendation.badgeColor">
                  {{ recommendation.badge }}
                </span>
              </div>

              <div class="flex items-start gap-4 mt-2">
                <div class="p-3.5 rounded-2xl bg-hust-gold/10 text-hust-gold border border-hust-gold/30 shrink-0">
                  <component :is="recommendation.icon" class="w-8 h-8" />
                </div>
                <div>
                  <h3 class="text-base font-black text-tx-p tracking-tight">{{ recommendation.title }}</h3>
                  <p class="text-xs text-tx-s mt-1 leading-relaxed">{{ recommendation.description }}</p>
                </div>
              </div>

              <!-- Estimated ROI Impact metrics -->
              <div class="grid grid-cols-3 gap-3 pt-3 border-t border-border-p text-center text-xs">
                <div class="bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                  <p class="text-[9px] text-tx-s">Độ trễ dự kiến L2</p>
                  <p class="font-mono font-bold text-emerald-400 text-sm mt-0.5">{{ recommendation.latency }}</p>
                </div>
                <div class="bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                  <p class="text-[9px] text-tx-s">Throughput Boost</p>
                  <p class="font-mono font-bold text-hust-gold text-sm mt-0.5">{{ recommendation.throughputBoost }}</p>
                </div>
                <div class="bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                  <p class="text-[9px] text-tx-s">Hiệu quả Chi phí</p>
                  <p class="font-mono font-bold text-accent-cyan text-sm mt-0.5">{{ recommendation.costEfficiency }}</p>
                </div>
              </div>
            </div>

            <!-- Auto-Generated Configuration Snippet (lmcache.yaml) -->
            <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 shadow-xs font-mono">
              <div class="flex items-center justify-between border-b border-border-p pb-3">
                <div class="flex items-center gap-2">
                  <Code2 class="w-4 h-4 text-hust-gold" />
                  <span class="text-xs font-bold text-tx-p">File Cấu Hình Mẫu: lmcache.yaml</span>
                </div>
                <button
                  class="bg-bg-inp hover:bg-bg-btn-hover text-tx-s hover:text-tx-p border border-border-s px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  @click="copyYamlConfig"
                >
                  <Check v-if="copiedConfig" class="w-3.5 h-3.5 text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedConfig ? 'Đã sao chép' : 'Sao chép YAML' }}</span>
                </button>
              </div>

              <pre class="p-3 bg-bg-inp/90 rounded-xl border border-border-p text-xs text-hust-gold overflow-x-auto leading-relaxed"><code>{{ recommendation.yamlConfig }}</code></pre>
            </div>

          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- TAB 3: L2 ARCHITECTURE COMPARISON MATRIX TABLE -->
      <!-- ================================================================= -->
      <div v-else-if="activeTab === 'matrix'" class="space-y-6 animate-fade-in">
        
        <div class="glass-panel p-6 rounded-2xl border border-border-p space-y-4 shadow-xs">
          <div>
            <h2 class="text-base font-black text-tx-p flex items-center gap-2">
              <Layers class="w-5 h-5 text-hust-gold" />
              Bảng So Sánh Các Cấp Bộ Nhớ Lưu Trữ L1 & L2 Trong Kiến Trúc LMCache
            </h2>
            <p class="text-xs text-tx-s mt-1">So sánh chi tiết thông số giữa L1 GPU Memory, L2 Host RAM, L2 NVMe SSD và Remote Storage Pool</p>
          </div>

          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr class="border-b border-border-p text-[10px] text-tx-m uppercase font-bold tracking-wider">
                  <th class="py-3 px-4">Tầng Bộ Nhớ (Storage Tier)</th>
                  <th class="py-3 px-4">Độ Trễ Truy Xuất (Latency)</th>
                  <th class="py-3 px-4">Băng Thông (Bandwidth)</th>
                  <th class="py-3 px-4">Dung Lượng Tối Đa</th>
                  <th class="py-3 px-4">Chi Phí / GB</th>
                  <th class="py-3 px-4">Chia Sẻ Cluster</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-p/50">
                <tr class="hover:bg-bg-btn-hover/40 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-tx-p flex items-center gap-2">
                    <Zap class="w-4 h-4 text-emerald-400" />
                    L1 GPU HBM (KV Cache Pool)
                  </td>
                  <td class="py-3.5 px-4 text-emerald-400 font-bold">&lt; 1 ms</td>
                  <td class="py-3.5 px-4 text-tx-p">1,500 - 3,000 GB/s</td>
                  <td class="py-3.5 px-4 text-tx-s">16 - 80 GB / GPU</td>
                  <td class="py-3.5 px-4 text-rose-400 font-bold">Rất Cao ($$$$$)</td>
                  <td class="py-3.5 px-4 text-rose-400">Không (Nội bộ GPU)</td>
                </tr>

                <tr class="hover:bg-bg-btn-hover/40 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-tx-p flex items-center gap-2">
                    <Cpu class="w-4 h-4 text-accent-cyan" />
                    L2 Host DRAM (Host RAM)
                  </td>
                  <td class="py-3.5 px-4 text-emerald-400 font-bold">15 - 35 ms</td>
                  <td class="py-3.5 px-4 text-tx-p">100 - 300 GB/s</td>
                  <td class="py-3.5 px-4 text-tx-s">128 - 1,024 GB</td>
                  <td class="py-3.5 px-4 text-hust-gold">Trung bình ($$$)</td>
                  <td class="py-3.5 px-4 text-amber-400">Nội bộ Server Node</td>
                </tr>

                <tr class="hover:bg-bg-btn-hover/40 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-tx-p flex items-center gap-2">
                    <HardDrive class="w-4 h-4 text-hust-gold" />
                    L2 Local NVMe SSD Disk
                  </td>
                  <td class="py-3.5 px-4 text-hust-gold font-bold">65 - 110 ms</td>
                  <td class="py-3.5 px-4 text-tx-p">5 - 14 GB/s</td>
                  <td class="py-3.5 px-4 text-tx-s">1,000 - 8,000 GB</td>
                  <td class="py-3.5 px-4 text-emerald-400 font-bold">Rất Rẻ ($)</td>
                  <td class="py-3.5 px-4 text-amber-400">Nội bộ Server Node</td>
                </tr>

                <tr class="hover:bg-bg-btn-hover/40 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-tx-p flex items-center gap-2">
                    <Cloud class="w-4 h-4 text-accent-violet" />
                    L2 Remote Pool (Redis / S3)
                  </td>
                  <td class="py-3.5 px-4 text-accent-violet font-bold">150 - 250 ms</td>
                  <td class="py-3.5 px-4 text-tx-p">1 - 10 GB/s (Network)</td>
                  <td class="py-3.5 px-4 text-tx-s">Vô hạn (Unlimited)</td>
                  <td class="py-3.5 px-4 text-accent-cyan">Tùy biến Cloud</td>
                  <td class="py-3.5 px-4 text-emerald-400 font-bold">Có (Toàn Cụm Cluster)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

<style scoped>
:deep(.p-select) {
  border-radius: 10px;
}
:deep(.p-select-label) {
  padding: 4px 8px !important;
}
</style>
