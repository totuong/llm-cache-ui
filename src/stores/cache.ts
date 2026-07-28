import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  // Settings
  const enabled = ref<boolean>(true)
  const ttl = ref<number>(3600) // TTL in seconds
  const similarityThreshold = ref<number>(0.75) // For semantic caching
  const evictionPolicy = ref<EvictionPolicy>('LRU')
  const cacheType = ref<CacheType>('semantic')
  const maxCacheSize = ref<number>(15)

  // Cache database
  const cacheItems = ref<CacheItem[]>([
    {
      id: 'c1',
      prompt: 'Học phần đồ án tốt nghiệp ngành CNTT Bách Khoa có bao nhiêu tín chỉ?',
      response: 'Đồ án tốt nghiệp ngành Công nghệ thông tin tại Trường Công nghệ thông tin và Truyền thông (SoICT) - Đại học Bách khoa Hà Nội thường có khối lượng là 6 hoặc 10 tín chỉ (tùy thuộc vào chương trình đào tạo chuẩn hay chương trình Elitech/đặc thù). Bạn nên kiểm tra lại khung chương trình đào tạo cụ thể của khóa mình trên hệ thống SIS.',
      hits: 4,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      tokens: 92,
      latency: 2.4,
    },
    {
      id: 'c2',
      prompt: 'Explain semantic caching for Large Language Models',
      response: 'Semantic caching is a technique that stores prompt-response pairs and evaluates incoming queries based on semantic similarity (using vector embeddings) rather than exact string matching. If a new prompt is semantically close to an existing one, the cache returns the stored response, saving API costs and reducing response latency from seconds to milliseconds.',
      hits: 9,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      tokens: 78,
      latency: 3.1,
    },
    {
      id: 'c3',
      prompt: 'Công thức tính điểm trung bình học kỳ CPA tại HUST là gì?',
      response: 'Điểm CPA (Cumulative Point Average) tại HUST được tính bằng tổng tích số giữa điểm số của mỗi học phần (quy đổi sang thang 4: A+=4, A=4, B+=3.5, B=3, C+=2.5, C=2, D+=1.5, D=1, F=0) với số tín chỉ tương ứng, rồi chia cho tổng số tín chỉ tích lũy. Công thức: CPA = Σ(Điểm học phần * Số tín chỉ) / Σ(Số tín chỉ).',
      hits: 2,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      tokens: 110,
      latency: 1.8,
    }
  ])

  // Performance statistics
  const stats = ref({
    totalRequests: 15,
    hits: 15 - 3, // Initial mock hits
    misses: 3,
    totalTimeSaved: 23.4, // in seconds
    totalTokensSaved: 1120,
    totalCostSaved: 0.0224, // USD
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
      cacheItems.value = parsed.cacheItems || []
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

  // Tries to retrieve a prompt response from the cache
  // Returns hit details if found, or null if miss
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
      // Semantic Cache Matching
      for (const item of cacheItems.value) {
        const sim = calculateSimilarity(prompt, item.prompt)
        if (sim > highestSim) {
          highestSim = sim
          bestMatch = item
        }
      }
      
      // Ensure the similarity meets the threshold
      if (highestSim < similarityThreshold.value) {
        bestMatch = null
      }
    }

    if (bestMatch) {
      // Cache Hit!
      bestMatch.hits++
      bestMatch.lastAccessed = new Date().toISOString()
      
      // Update statistics
      stats.value.totalRequests++
      stats.value.hits++
      
      // Simulate savings
      const timeSaved = parseFloat((bestMatch.latency - 0.05).toFixed(2)) // cached responses are fast (~0.05s)
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

    // Cache Miss
    return null
  }

  // Insert a newly fetched item into cache
  function insertCache(prompt: string, response: string, tokens: number, latency: number) {
    if (!enabled.value) return

    // Evict items if size limit reached
    if (cacheItems.value.length >= maxCacheSize.value) {
      evictItem()
    }

    const newItem: CacheItem = {
      id: 'item_' + Math.random().toString(36).substr(2, 9),
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

  // Evicts an item based on the eviction policy
  function evictItem() {
    if (cacheItems.value.length === 0) return

    let evictIndex = 0

    if (evictionPolicy.value === 'FIFO') {
      // First In First Out - the oldest is at index 0 (assuming sequential push)
      evictIndex = 0
    } else if (evictionPolicy.value === 'LFU') {
      // Least Frequently Used
      let minHits = Infinity
      for (let i = 0; i < cacheItems.value.length; i++) {
        const item = cacheItems.value[i]
        if (item && item.hits < minHits) {
          minHits = item.hits
          evictIndex = i
        }
      }
    } else {
      // LRU: Least Recently Used
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

  function clearAll() {
    cacheItems.value = []
    stats.value = {
      totalRequests: 0,
      hits: 0,
      misses: 0,
      totalTimeSaved: 0,
      totalTokensSaved: 0,
      totalCostSaved: 0,
    }
    saveCache()
  }

  const hitRate = computed(() => {
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
    queryCache,
    insertCache,
    deleteItem,
    clearAll,
    calculateSimilarity,
  }
})
