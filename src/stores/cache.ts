import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchCacheStats,
  fetchVllmMetrics,
  fetchSystemStatus,
  fetchChatHistory,
  resetCacheStats,
} from '../services/apiService'
import type { CacheResponseDTO, VllmMetricsDTO, SystemStatusDTO, ChatHistory } from '../types/api'
import type {
  L2CacheConfigDTO,
  RedisConnectionTestRequest,
  RedisConnectionTestResponse,
} from '../types/l2Cache'
import { l2CacheService } from '../services/l2CacheService'
import { getKvCachePercent } from '../utils/formatters'

export interface CacheItem {
  id: string
  prompt: string
  response: string
  hits: number
  lastAccessed: string
  tokens: number
  latency: number // original miss latency (s)
}

export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO'
export type CacheType = 'exact' | 'semantic'
export type L2BackendType = 'redis' | 's3' | 'lmcache_remote' | 'nvme' | 'dram'

export interface L2StorageConfig {
  backendType: L2BackendType
  connectionUrl: string
  authToken: string
  chunkSize: number
  localCpuMemoryLimitGb: number
  maxDiskSizeGb: number
  evictionPolicy: EvictionPolicy
  pinMemory: boolean
  status: 'connected' | 'disconnected' | 'testing' | 'unconfigured' | 'active' | 'disabled' | 'error'
  pingMs?: number
  lastTestedAt?: string
}

export const useCacheStore = defineStore('cache', () => {
  // Local Settings
  const enabled = ref<boolean>(true)
  const ttl = ref<number>(3600) // TTL in seconds
  const similarityThreshold = ref<number>(0.75) // For semantic caching
  const evictionPolicy = ref<EvictionPolicy>('LRU')
  const cacheType = ref<CacheType>('semantic')
  const maxCacheSize = ref<number>(15)

  // L2 Storage Tier Interactive Configuration
  const l2Config = ref<L2StorageConfig>({
    backendType: 'redis',
    connectionUrl: 'redis://cache-redis-cluster.internal:6379/0',
    authToken: '',
    chunkSize: 256,
    localCpuMemoryLimitGb: 5.0,
    maxDiskSizeGb: 500,
    evictionPolicy: 'LRU',
    pinMemory: true,
    status: 'unconfigured',
  })

  // L2 Remote Cache Real-time State (Redis Backend API)
  const l2RemoteConfig = ref<L2CacheConfigDTO | null>(null)
  const isL2Loading = ref<boolean>(false)
  const isL2Testing = ref<boolean>(false)
  const isL2Saving = ref<boolean>(false)
  const l2TestResult = ref<RedisConnectionTestResponse | null>(null)
  const l2YamlContent = ref<string>('')
  const l2Error = ref<string | null>(null)

  // Live Backend Data Objects
  const backendStats = ref<CacheResponseDTO | null>(null)
  const vllmMetrics = ref<VllmMetricsDTO | null>(null)
  const systemStatus = ref<SystemStatusDTO | null>(null)
  const dbChatHistory = ref<ChatHistory[]>([])
  const isBackendLive = ref<boolean>(false)
  const isFetchingBackend = ref<boolean>(false)

  // Local Cache database (Tracks locally cached prompts)
  const cacheItems = ref<CacheItem[]>([])

  // Performance statistics (Always 0 by default, updated strictly from API)
  const stats = ref({
    totalRequests: 0,
    hits: 0,
    misses: 0,
    totalTimeSaved: 0, // in seconds
    totalTokensSaved: 0,
    totalCostSaved: 0, // USD
  })

  // Load from local storage if available
  const storedCache = localStorage.getItem('hust_llm_cache')
  if (storedCache) {
    try {
      const parsed = JSON.parse(storedCache)
      enabled.value = parsed.enabled !== undefined ? parsed.enabled : true
      ttl.value = parsed.ttl || 3600
      similarityThreshold.value = parsed.similarityThreshold || 0.75
      evictionPolicy.value = parsed.evictionPolicy || 'LRU'
      cacheType.value = parsed.cacheType || 'semantic'
      cacheItems.value = Array.isArray(parsed.cacheItems) ? parsed.cacheItems : []
      // Purge legacy mock numbers (24 requests, 42.8s, 3450 tokens) from localStorage
      if (
        parsed.stats &&
        (parsed.stats.totalRequests === 24 ||
          parsed.stats.totalTimeSaved === 42.8 ||
          parsed.stats.totalTokensSaved === 3450)
      ) {
        localStorage.removeItem('hust_llm_cache')
      } else if (parsed.stats) {
        stats.value = parsed.stats
      }
    } catch (e) {
      console.error('Failed to parse cache settings', e)
    }
  }

  // Load L2 configuration from localStorage
  const storedL2 = localStorage.getItem('hust_l2_config')
  if (storedL2) {
    try {
      const parsed = JSON.parse(storedL2)
      if (parsed && typeof parsed === 'object') {
        l2Config.value = { ...l2Config.value, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to parse l2 config', e)
    }
  }

  function saveL2ConfigLocal() {
    localStorage.setItem('hust_l2_config', JSON.stringify(l2Config.value))
  }

  // 1. Lấy cấu hình L2 hiện tại từ Backend API
  async function fetchL2Config(): Promise<L2CacheConfigDTO | null> {
    isL2Loading.value = true
    l2Error.value = null
    try {
      const data = await l2CacheService.getConfig()
      l2RemoteConfig.value = data
      if (data.yamlContent) {
        l2YamlContent.value = data.yamlContent
      }
      l2Config.value.backendType = 'redis'
      l2Config.value.connectionUrl = data.remoteUrl || `redis://${data.host}:${data.port}`
      l2Config.value.chunkSize = data.chunkSize || 256
      l2Config.value.localCpuMemoryLimitGb = data.maxLocalCpuSizeGb || 5.0
      if (data.enabled && data.status === 'ACTIVE') {
        l2Config.value.status = 'connected'
      } else if (data.status === 'ERROR') {
        l2Config.value.status = 'disconnected'
      } else {
        l2Config.value.status = 'unconfigured'
      }
      saveL2ConfigLocal()
      return data
    } catch (err: any) {
      l2Error.value = err.message || 'Không thể tải cấu hình L2'
      return null
    } finally {
      isL2Loading.value = false
    }
  }

  // 2. Kiểm tra kết nối Redis thật qua Backend API (đo Ping RTT)
  async function testL2Connection(req?: RedisConnectionTestRequest): Promise<{ success: boolean; latencyMs: number; message: string }> {
    isL2Testing.value = true
    l2Config.value.status = 'testing'
    l2Error.value = null
    try {
      const host = req?.host || l2RemoteConfig.value?.host || 'localhost'
      const port = Number(req?.port || l2RemoteConfig.value?.port || 6379)
      const password = req?.password !== undefined ? req.password : (l2RemoteConfig.value?.password || undefined)

      const result = await l2CacheService.testConnection({
        host,
        port,
        password,
      })
      l2TestResult.value = result

      if (result.connected) {
        l2Config.value.status = 'connected'
        l2Config.value.pingMs = result.latencyMs
        l2Config.value.lastTestedAt = new Date().toISOString()
        saveL2ConfigLocal()
        return {
          success: true,
          latencyMs: result.latencyMs,
          message: result.message || `Kết nối thành công tới Redis (${result.endpoint}). RTT: ${result.latencyMs}ms`,
        }
      } else {
        l2Config.value.status = 'disconnected'
        l2Config.value.pingMs = undefined
        saveL2ConfigLocal()
        return {
          success: false,
          latencyMs: result.latencyMs || 0,
          message: result.message || 'Kết nối Redis thất bại',
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Lỗi khi kiểm tra kết nối Redis'
      l2Config.value.status = 'disconnected'
      l2Config.value.pingMs = undefined
      saveL2ConfigLocal()
      return {
        success: false,
        latencyMs: 0,
        message: errorMsg,
      }
    } finally {
      isL2Testing.value = false
    }
  }

  // 3. Lưu và áp dụng cấu hình L2 (Ghi đè lmcache_vllm.yaml & Reload engine)
  async function saveL2Config(payload?: Partial<L2CacheConfigDTO>): Promise<L2CacheConfigDTO> {
    isL2Saving.value = true
    l2Error.value = null
    try {
      const current = l2RemoteConfig.value
      const body: Partial<L2CacheConfigDTO> = payload || {
        enabled: current?.enabled ?? true,
        storageType: 'REDIS',
        host: current?.host || 'localhost',
        port: Number(current?.port || 6379),
        password: current?.password,
        chunkSize: Number(current?.chunkSize || l2Config.value.chunkSize || 256),
        maxLocalCpuSizeGb: Number(current?.maxLocalCpuSizeGb || l2Config.value.localCpuMemoryLimitGb || 5.0),
        remoteSerde: (current?.remoteSerde as any) || 'naive',
      }

      const updated = await l2CacheService.saveConfig(body)
      l2RemoteConfig.value = updated
      if (updated.yamlContent) {
        l2YamlContent.value = updated.yamlContent
      }
      l2Config.value.connectionUrl = updated.remoteUrl || `redis://${updated.host}:${updated.port}`
      l2Config.value.chunkSize = updated.chunkSize || 256
      l2Config.value.localCpuMemoryLimitGb = updated.maxLocalCpuSizeGb || 5.0
      l2Config.value.status = updated.enabled && updated.status === 'ACTIVE' ? 'connected' : 'unconfigured'
      saveL2ConfigLocal()
      return updated
    } catch (err: any) {
      l2Error.value = err.message || 'Lỗi khi lưu cấu hình L2'
      throw err
    } finally {
      isL2Saving.value = false
    }
  }

  // 4. Tắt L2 Cache (chuyển về L1 CPU)
  async function disableL2Config(): Promise<L2CacheConfigDTO> {
    isL2Saving.value = true
    l2Error.value = null
    try {
      const updated = await l2CacheService.disableL2()
      l2RemoteConfig.value = updated
      if (updated.yamlContent) {
        l2YamlContent.value = updated.yamlContent
      }
      l2Config.value.status = 'unconfigured'
      saveL2ConfigLocal()
      return updated
    } catch (err: any) {
      l2Error.value = err.message || 'Lỗi khi tắt L2 Cache'
      throw err
    } finally {
      isL2Saving.value = false
    }
  }

  // 5. Xem trước file lmcache_vllm.yaml
  async function fetchL2Yaml(): Promise<string> {
    try {
      const yaml = await l2CacheService.getYamlPreview()
      l2YamlContent.value = yaml
      return yaml
    } catch (err: any) {
      return l2YamlContent.value
    }
  }

  function resetL2Config() {
    l2Config.value = {
      backendType: 'redis',
      connectionUrl: 'redis://localhost:6379',
      authToken: '',
      chunkSize: 256,
      localCpuMemoryLimitGb: 5.0,
      maxDiskSizeGb: 500,
      evictionPolicy: 'LRU',
      pinMemory: true,
      status: 'unconfigured',
      pingMs: undefined,
      lastTestedAt: undefined,
    }
    saveL2ConfigLocal()
  }

  function saveCache() {
    localStorage.setItem(
      'hust_llm_cache',
      JSON.stringify({
        enabled: enabled.value,
        ttl: ttl.value,
        similarityThreshold: similarityThreshold.value,
        evictionPolicy: evictionPolicy.value,
        cacheType: cacheType.value,
        cacheItems: cacheItems.value,
        stats: stats.value,
      })
    )
  }

  let lastFetchTime = 0

  /**
   * Refresh metrics from Spring Boot Backend (/api/v1/cache, /api/v1/metrics, /api/v1/system)
   * Throttled to max 1 call per 4 seconds unless forced.
   */
  async function refreshBackendMetrics(force: boolean = false) {
    const now = Date.now()
    if (!force && now - lastFetchTime < 4000) return
    lastFetchTime = now

    isFetchingBackend.value = true
    try {
      const [cStats, vMetrics, sysStatus, historyRes, l2Res] = await Promise.allSettled([
        fetchCacheStats(),
        fetchVllmMetrics(),
        fetchSystemStatus(),
        fetchChatHistory(50),
        fetchL2Config(),
      ])

      const isLive = sysStatus.status === 'fulfilled' || cStats.status === 'fulfilled' || l2Res.status === 'fulfilled'
      isBackendLive.value = isLive

      if (cStats.status === 'fulfilled') backendStats.value = cStats.value
      if (vMetrics.status === 'fulfilled') vllmMetrics.value = vMetrics.value
      if (sysStatus.status === 'fulfilled') systemStatus.value = sysStatus.value
      if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value)) {
        dbChatHistory.value = historyRes.value
      }

      // If backend stats available, sync hitRate & totals directly from API (including 0)
      if (backendStats.value) {
        if (backendStats.value.prefixCacheQueriesTotal !== undefined && backendStats.value.prefixCacheQueriesTotal !== null) {
          stats.value.totalRequests = backendStats.value.prefixCacheQueriesTotal
          stats.value.hits = backendStats.value.prefixCacheHitsTotal ?? 0
          stats.value.misses = Math.max(0, backendStats.value.prefixCacheQueriesTotal - stats.value.hits)
        }

        const savedTokens = backendStats.value.totalCachedTokensSaved ?? backendStats.value.promptTokensLocalCacheHit ?? 0
        stats.value.totalTokensSaved = savedTokens
        stats.value.totalCostSaved = parseFloat((savedTokens * 0.00002).toFixed(5))

        // Time saved: If 0 hits, then time saved is strictly 0s (no mock numbers)
        if (stats.value.hits === 0) {
          stats.value.totalTimeSaved = 0
        } else {
          const avgColdPrefill = (vllmMetrics.value?.e2eLatencyAvgSeconds && vllmMetrics.value.e2eLatencyAvgSeconds > 0)
            ? Math.max(0.15, vllmMetrics.value.e2eLatencyAvgSeconds - (vllmMetrics.value.timeToFirstTokenAvgSeconds || 0.05))
            : 0.85
          stats.value.totalTimeSaved = parseFloat((stats.value.hits * avgColdPrefill).toFixed(2))
        }
      }
    } catch (err) {
      console.warn('Could not refresh backend metrics:', err)
    } finally {
      isFetchingBackend.value = false
    }
  }

  /**
   * Reset cache on backend & clear client cache
   */
  async function clearAll() {
    try {
      await resetCacheStats()
    } catch (err) {
      console.warn('Backend reset call failed (proceeding locally):', err)
    }
    cacheItems.value = []
    stats.value = {
      totalRequests: 0,
      hits: 0,
      misses: 0,
      totalTimeSaved: 0,
      totalTokensSaved: 0,
      totalCostSaved: 0,
    }
    backendStats.value = null
    vllmMetrics.value = null
    saveCache()
  }

  // Jaccard similarity word overlap metric to mock semantic similarity
  function calculateSimilarity(s1: string, s2: string): number {
    const clean = (text: string) =>
      text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2)

    const w1 = new Set(clean(s1))
    const w2 = new Set(clean(s2))

    if (w1.size === 0 && w2.size === 0) return 1.0

    const intersect = new Set([...w1].filter(x => w2.has(x)))
    const union = new Set([...w1, ...w2])

    return parseFloat((intersect.size / union.size).toFixed(3))
  }

  function queryCache(prompt: string): { hit: boolean; response: string; similarity: number; latency: number } | null {
    if (!enabled.value) return null

    let bestMatch: CacheItem | null = null
    let highestSim = 0

    if (cacheType.value === 'exact') {
      const match = cacheItems.value.find(
        item => item.prompt.trim().toLowerCase() === prompt.trim().toLowerCase()
      )
      if (match) {
        bestMatch = match
        highestSim = 1.0
      }
    } else {
      for (const item of cacheItems.value) {
        const sim = calculateSimilarity(prompt, item.prompt)
        if (sim > highestSim) {
          highestSim = sim
          bestMatch = item
        }
      }

      if (highestSim < similarityThreshold.value) {
        bestMatch = null
      }
    }

    if (bestMatch) {
      bestMatch.hits++
      bestMatch.lastAccessed = new Date().toISOString()

      stats.value.totalRequests++
      stats.value.hits++

      const timeSaved = parseFloat((bestMatch.latency - 0.05).toFixed(2))
      stats.value.totalTimeSaved = parseFloat((stats.value.totalTimeSaved + timeSaved).toFixed(2))
      stats.value.totalTokensSaved += bestMatch.tokens
      stats.value.totalCostSaved = parseFloat((stats.value.totalCostSaved + (bestMatch.tokens * 0.00002)).toFixed(5))

      saveCache()
      return {
        hit: true,
        response: bestMatch.response,
        similarity: highestSim,
        latency: 0.05,
      }
    }

    return null
  }

  function insertCache(prompt: string, response: string, tokens: number, latency: number) {
    if (!enabled.value) return

    if (cacheItems.value.length >= maxCacheSize.value) {
      evictItem()
    }

    const newItem: CacheItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      prompt,
      response,
      hits: 0,
      lastAccessed: new Date().toISOString(),
      tokens,
      latency: parseFloat(latency.toFixed(2)),
    }

    cacheItems.value.push(newItem)
    stats.value.totalRequests++
    stats.value.misses++
    saveCache()
  }

  function evictItem() {
    if (cacheItems.value.length === 0) return

    let evictIndex = 0

    if (evictionPolicy.value === 'FIFO') {
      evictIndex = 0
    } else if (evictionPolicy.value === 'LFU') {
      let minHits = Infinity
      for (let i = 0; i < cacheItems.value.length; i++) {
        const item = cacheItems.value[i]
        if (item && item.hits < minHits) {
          minHits = item.hits
          evictIndex = i
        }
      }
    } else {
      let oldestTime = Infinity
      for (let i = 0; i < cacheItems.value.length; i++) {
        const item = cacheItems.value[i]
        if (item) {
          const time = new Date(item.lastAccessed).getTime()
          if (time < oldestTime) {
            oldestTime = time
            evictIndex = i
          }
        }
      }
    }

    cacheItems.value.splice(evictIndex, 1)
  }

  function deleteItem(id: string) {
    cacheItems.value = cacheItems.value.filter(item => item.id !== id)
    saveCache()
  }

  const hitRate = computed(() => {
    // Prefer backend stats hit ratio if present
    if (backendStats.value && backendStats.value.prefixCacheHitRatio !== undefined && backendStats.value.prefixCacheHitRatio !== null) {
      const val = backendStats.value.prefixCacheHitRatio
      return Math.round(val <= 1 && val > 0 ? val * 100 : val)
    }
    if (stats.value.totalRequests === 0) return 0
    return Math.round((stats.value.hits / stats.value.totalRequests) * 100)
  })

  const kvCacheUsagePercentage = computed(() => {
    const raw = backendStats.value?.kvCacheUsagePerc ?? vllmMetrics.value?.kvCacheUsagePerc ?? 0
    return getKvCachePercent(raw)
  })

  return {
    enabled,
    ttl,
    similarityThreshold,
    evictionPolicy,
    cacheType,
    maxCacheSize,
    cacheItems,
    stats,
    hitRate,
    kvCacheUsagePercentage,
    backendStats,
    vllmMetrics,
    systemStatus,
    dbChatHistory,
    isBackendLive,
    isFetchingBackend,
    refreshBackendMetrics,
    queryCache,
    insertCache,
    deleteItem,
    clearAll,
    calculateSimilarity,
    l2Config,
    l2RemoteConfig,
    isL2Loading,
    isL2Testing,
    isL2Saving,
    l2TestResult,
    l2YamlContent,
    l2Error,
    fetchL2Config,
    saveL2Config,
    testL2Connection,
    disableL2Config,
    fetchL2Yaml,
    resetL2Config,
  }
})
