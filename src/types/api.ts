// Standard Response Protocol from Spring Boot Backend
export interface ResponseObject<T> {
  status: 'SUCCESS' | 'ERROR'
  message: string
  data: T
  timestamp: string
}

// Token usage & LMCache metrics per chat turn
export interface UsageInfo {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number
  cacheHitRatioPercentage: number
}

// vLLM Prometheus metrics DTO
export interface VllmMetricsDTO {
  prefixCacheQueriesTotal: number
  prefixCacheHitsTotal: number
  prefixCacheHitRatio: number
  promptTokensLocalCompute: number
  promptTokensLocalCacheHit: number
  kvCacheUsagePerc: number
  numRequestsRunning: number
  numRequestsWaiting: number
  promptTokensTotal: number
  generationTokensTotal: number
  e2eLatencyAvgSeconds: number
  timeToFirstTokenAvgSeconds: number
}

// Synchronous and Streaming Chat Response Payload
export interface ChatResponse {
  response: string
  model?: string
  executionTimeMs?: number
  usage?: UsageInfo
  vllmMetrics?: VllmMetricsDTO
}

// Chat Request Payload
export interface ChatRequest {
  prompt: string
  model?: string
}

// Chat History Record stored in PostgreSQL
export interface ChatHistory {
  id: number
  prompt: string
  response: string
  model: string
  executionTimeMs: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number
  cacheHitRatioPercentage: number
  createdAt: string
}

// LMCache Performance Statistics DTO
export interface CacheResponseDTO {
  prefixCacheQueriesTotal: number
  prefixCacheHitsTotal: number
  prefixCacheHitRatio: number
  promptTokensLocalCompute: number
  promptTokensLocalCacheHit: number
  totalCachedTokensSaved: number
  kvCacheUsagePerc: number
  cacheStatus: string
}

// System Health & Engine Connection DTO
export interface SystemStatusDTO {
  applicationName: string
  version: string
  status: 'UP' | 'DOWN' | 'UNKNOWN'
  llmModelName: string
  llmModelUrl: string
  databaseStatus: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED'
  totalChatsProcessed: number
  uptimeSeconds: number
  freeMemoryMb: number
  totalMemoryMb: number
}
