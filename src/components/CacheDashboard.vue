<script setup lang="ts">
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import InputNumber from 'primevue/inputnumber'
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cacheStore = useCacheStore()
const langStore = useLangStore()

const policyOptions = computed(() => [
  { label: langStore.locale === 'vi' ? 'Truy cập gần nhất (LRU)' : 'Least Recently Used (LRU)', value: 'LRU' },
  { label: langStore.locale === 'vi' ? 'Tần suất thấp nhất (LFU)' : 'Least Frequently Used (LFU)', value: 'LFU' },
  { label: langStore.locale === 'vi' ? 'Vào trước ra trước (FIFO)' : 'First In First Out (FIFO)', value: 'FIFO' },
])

const cacheTypeOptions = computed(() => [
  { label: langStore.locale === 'vi' ? 'Khớp Ngữ Nghĩa (Semantic)' : 'Semantic Matching', value: 'semantic' },
  { label: langStore.locale === 'vi' ? 'Khớp Chính Xác (Exact)' : 'Exact String Match', value: 'exact' },
])

// Animated SVG indicator calculations for the Circular Hit Rate Gauge
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
    ? 'Xóa sạch toàn bộ bản ghi cache và đặt lại chỉ số hiệu suất?'
    : 'Clear all cached records and reset performance stats?'
  if (confirm(confirmMsg)) {
    cacheStore.clearAll()
  }
}
</script>

<template>
  <div class="w-80 md:w-96 bg-bg-card border-l border-border-p flex flex-col h-full select-none text-left">
    
    <!-- Header -->
    <div class="p-4 border-b border-border-p flex items-center justify-between shrink-0">
      <div>
        <h2 class="font-extrabold text-sm text-tx-p flex items-center gap-1.5 uppercase tracking-wider">
          <i class="pi pi-chart-bar text-hust-gold"></i>
          {{ langStore.t('cacheDashboardTitle') }}
        </h2>
        <p class="text-[10px] text-tx-s">{{ langStore.t('cacheDashboardDesc') }}</p>
      </div>
      
      <button
        class="text-tx-s hover:text-tx-p w-8 h-8 flex items-center justify-center cursor-pointer rounded-lg hover:bg-bg-btn-hover transition-colors"
        @click="emit('close')"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- Main Scrollable Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      
      <!-- Section 1: Circular Gauge & KPI Cards -->
      <div class="bg-bg-inp/40 border border-border-p p-4 rounded-xl flex flex-col items-center">
        <!-- Hit Rate SVG circular chart -->
        <div class="relative w-32 h-32 flex items-center justify-center select-none">
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
              :stroke-dasharray="2 * Math.PI * 55"
              :stroke-dashoffset="strokeDashoffset"
            />
          </svg>
          <!-- Central text metrics -->
          <div class="absolute flex flex-col items-center justify-center">
            <span class="text-2xl font-black text-tx-p">{{ cacheStore.hitRate }}%</span>
            <span class="text-[9px] text-tx-s font-bold uppercase tracking-wider">{{ langStore.t('hitRate') }}</span>
          </div>
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
              <span class="text-emerald-400">{{ cacheStore.stats.hits }}</span>
              <span class="text-tx-s font-normal">/</span>
              <span class="text-red-400">{{ cacheStore.stats.misses }}</span>
            </p>
          </div>
          <div class="text-center">
            <p class="text-[9px] text-tx-s font-medium">{{ langStore.t('latencySaved') }}</p>
            <p class="text-xs font-bold text-emerald-400 font-mono">{{ cacheStore.stats.totalTimeSaved }}s</p>
          </div>
        </div>

        <!-- Cost savings -->
        <div class="w-full mt-2.5 bg-bg-app border border-border-p p-2 rounded-lg flex justify-between items-center text-[10px]">
          <span class="text-tx-s">{{ langStore.t('costSaved') }}:</span>
          <span class="font-bold text-emerald-400 font-mono">${{ cacheStore.stats.totalCostSaved.toFixed(4) }} USD</span>
        </div>
      </div>

      <!-- Section 2: Policy Configs -->
      <div class="space-y-3.5">
        <div class="text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center gap-1">
          <i class="pi pi-sliders-h text-hust-gold"></i>
          {{ langStore.t('cacheConfig') }}
        </div>

        <div class="bg-bg-inp/30 border border-border-p p-3.5 rounded-xl space-y-4 text-xs">
          <!-- Cache Enable switch representation -->
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

          <!-- Similarity Threshold Slider (Semantic cache specific) -->
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

      <!-- Section 3: Cached Query Table -->
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
        <div class="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[220px]">
          <div v-if="cacheStore.cacheItems.length === 0" class="text-center text-tx-s text-xs p-8 bg-bg-app border border-dashed border-border-s rounded-xl">
            {{ langStore.t('noCacheData') }}
          </div>

          <div
            v-for="item in cacheStore.cacheItems"
            :key="item.id"
            class="bg-bg-inp/30 border border-border-p p-3 rounded-lg flex flex-col gap-2 relative hover:bg-bg-btn-hover/50 group"
          >
            <!-- Delete floating action -->
            <button
              class="absolute top-2.5 right-2 text-tx-s hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
              @click="handleDeleteCacheItem(item.id)"
              v-tooltip.left="langStore.locale === 'vi' ? 'Thu hồi bản ghi' : 'Evict record'"
            >
              <i class="pi pi-trash text-[10px]"></i>
            </button>

            <!-- Query display -->
            <div class="text-[11px] font-semibold text-tx-p line-clamp-1 pr-6 text-left">
              Q: {{ item.prompt }}
            </div>
            
            <!-- Metadata badges -->
            <div class="flex flex-wrap gap-1.5 items-center select-none text-[9px] text-tx-s">
              <span class="bg-bg-inp border border-border-p px-1.5 py-0.5 rounded text-hust-gold font-bold">
                Hits: {{ item.hits }}
              </span>
              <span class="bg-bg-inp border border-border-p px-1.5 py-0.5 rounded text-tx-s">
                Size: {{ item.tokens }} tokens
              </span>
              <span class="bg-bg-inp border border-border-p px-1.5 py-0.5 rounded text-tx-s">
                Orig. Latency: {{ item.latency }}s
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
