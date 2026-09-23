import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchCacheStats,
  fetchVllmMetrics,
  fetchSystemStatus,
  resetCacheStats,
} from '../services/apiService'
import type { CacheResponseDTO, VllmMetricsDTO, SystemStatusDTO } from '../types/api'

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

export const useCacheStore = defineStore('cache', () => {
  // Local Settings
  const enabled = ref<boolean>(true)
  const ttl = ref<number>(3600) // TTL in seconds
  const similarityThreshold = ref<number>(0.75) // For semantic caching
  const evictionPolicy = ref<EvictionPolicy>('LRU')
  const cacheType = ref<CacheType>('semantic')
  const maxCacheSize = ref<number>(15)

  // Live Backend Data Objects
  const backendStats = ref<CacheResponseDTO | null>(null)
  const vllmMetrics = ref<VllmMetricsDTO | null>(null)
  const systemStatus = ref<SystemStatusDTO | null>(null)
  const isFetchingBackend = ref<boolean>(false)

  // Local Cache database (Mock fallback / client-side tracking)
  const cacheItems = ref<CacheItem[]>([
    {
      id: 'c1',
      prompt: 'Giải thích kỹ thuật Prefix Caching trong LMCache và vLLM?',
      response: 'Prefix Caching là kỹ thuật lưu lại trạng thái KV Cache của các đoạn prompt trùng lặp trên bộ nhớ GPU/RAM, giúp giảm thời gian tính toán prompt (Time To First Token - TTFT) và tiết kiệm tài nguyên GPU.',
      hits: 12,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      tokens: 145,
      latency: 0.32,
    },
    {
      id: 'c2',
      prompt: 'Học phần đồ án tốt nghiệp ngành CNTT Bách Khoa có bao nhiêu tín chỉ?',
      response: 'Đồ án tốt nghiệp ngành Công nghệ thông tin tại Trường Công nghệ thông tin và Truyền thông (SoICT) - Đại học Bách khoa Hà Nội thường có khối lượng là 6 hoặc 10 tín chỉ (tùy thuộc vào chương trình đào tạo chuẩn hay chương trình Elitech/đặc thù).',
      hits: 4,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      tokens: 92,
      latency: 2.4,
    },
    {
      id: 'c3',
      prompt: 'Explain semantic caching for Large Language Models',
      response: 'Semantic caching is a technique that stores prompt-response pairs and evaluates incoming queries based on semantic similarity (using vector embeddings) rather than exact string matching.',
      hits: 9,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      tokens: 78,
      latency: 3.1,
    }
  ])

  // Performance statistics
  const stats = ref({
    totalRequests: 24,
    hits: 19,
    misses: 5,
    totalTimeSaved: 42.8, // in seconds
    totalTokensSaved: 3450,
    totalCostSaved: 0.069, // USD
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
      cacheItems.value = parsed.cacheItems || cacheItems.value
      stats.value = parsed.stats || stats.value
    } catch (e) {
      console.error('Failed to parse cache settings', e)
    }
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
   * Throttled to max 1 call per 5 seconds unless forced.
   */
  async function refreshBackendMetrics(force: boolean = false) {
    const now = Date.now()
    if (!force && now - lastFetchTime < 5000) return
    lastFetchTime = now
    
    isFetchingBackend.value = true
    try {
      const [cStats, vMetrics, sysStatus] = await Promise.allSettled([
        fetchCacheStats(),
        fetchVllmMetrics(),
        fetchSystemStatus(),
      ])

      if (cStats.status === 'fulfilled') backendStats.value = cStats.value
      if (vMetrics.status === 'fulfilled') vllmMetrics.value = vMetrics.value
      if (sysStatus.status === 'fulfilled') systemStatus.value = sysStatus.value

      // If backend stats available, sync hitRate & totals
      if (backendStats.value) {
        if (backendStats.value.prefixCacheQueriesTotal) {
          stats.value.totalRequests = backendStats.value.prefixCacheQueriesTotal
          stats.value.hits = backendStats.value.prefixCacheHitsTotal
          stats.value.misses = backendStats.value.prefixCacheQueriesTotal - backendStats.value.prefixCacheHitsTotal
        }
        if (backendStats.value.totalCachedTokensSaved) {
          stats.value.totalTokensSaved = backendStats.value.totalCachedTokensSaved
          stats.value.totalCostSaved = parseFloat((backendStats.value.totalCachedTokensSaved * 0.00002).toFixed(5))
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
    if (backendStats.value && backendStats.value.prefixCacheHitRatio !== undefined) {
      return Math.round(backendStats.value.prefixCacheHitRatio)
    }
    if (stats.value.totalRequests === 0) return 0
    return Math.round((stats.value.hits / stats.value.totalRequests) * 100)
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
    backendStats,
    vllmMetrics,
    systemStatus,
    isFetchingBackend,
    refreshBackendMetrics,
    queryCache,
    insertCache,
    deleteItem,
    clearAll,
    calculateSimilarity,
  }
})
