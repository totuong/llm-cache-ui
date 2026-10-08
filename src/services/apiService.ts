import type {
  ChatRequest,
  ChatResponse,
  ChatHistory,
  CacheResponseDTO,
  SystemStatusDTO,
  VllmMetricsDTO,
  ResponseObject,
} from '../types/api'

// Base URL configuration (supports VITE_API_BASE_URL or relative '/api/v1' for Vite proxy)
function getApiBaseUrl(): string {
  let envUrl = ((import.meta as any).env?.VITE_API_BASE_URL || '').trim()
  if (!envUrl) return '/api/v1'
  if (!envUrl.endsWith('/api/v1')) {
    envUrl = envUrl.replace(/\/+$/, '') + '/api/v1'
  }
  return envUrl
}

const API_BASE_URL = getApiBaseUrl()

const DEFAULT_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': '69420',
}

/**
 * Fast health check helper to test if Spring Boot backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 800)

    const res = await fetch(`${API_BASE_URL}/system`, {
      method: 'GET',
      headers: { ...DEFAULT_HEADERS },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * 1. Call Synchronous Chat API (/api/v1/chat)
 */
export async function sendChatRequest(
  request: ChatRequest
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: Failed to reach LLM backend`
    try {
      const errorData: ResponseObject<null> = await res.json()
      if (errorData.message) errorMsg = errorData.message
    } catch {}
    throw new Error(errorMsg)
  }

  const result: ResponseObject<ChatResponse> = await res.json()
  if (result.status === 'ERROR') throw new Error(result.message || 'Error executing chat query')
  return result.data
}

/**
 * 2. Call Real-time SSE Streaming Chat API (/api/v1/chat/stream)
 */
export async function streamChatRequest(
  request: ChatRequest,
  onChunk: (chunkText: string, metadata?: Partial<ChatResponse>) => void,
  onComplete?: (finalResponse?: ChatResponse) => void,
  onError?: (err: Error) => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok || !response.body) {
      throw new Error(`SSE stream failed with HTTP status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let lastMetadata: ChatResponse | null = null

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.replace(/^data:/, '').trim()
          if (!jsonStr) continue

          try {
            const parsed: ResponseObject<ChatResponse> = JSON.parse(jsonStr)
            if (parsed.status === 'SUCCESS' && parsed.data) {
              if (parsed.data.response) {
                onChunk(parsed.data.response, parsed.data)
              }
              if (parsed.data.usage || parsed.data.vllmMetrics || parsed.data.executionTimeMs) {
                lastMetadata = parsed.data
              }
            }
          } catch (e) {
            console.warn('Could not parse SSE JSON chunk:', jsonStr)
          }
        }
      }
    }

    if (onComplete) onComplete(lastMetadata || undefined)
  } catch (error: any) {
    if (onError) onError(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * 3. Fetch Chat History from PostgreSQL (/api/v1/chat/history)
 */
export async function fetchChatHistory(
  limit: number = 50
): Promise<ChatHistory[]> {
  const res = await fetch(`${API_BASE_URL}/chat/history?limit=${limit}`, {
    headers: { ...DEFAULT_HEADERS },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch chat history`)
  const result: ResponseObject<ChatHistory[]> = await res.json()
  if (result.status === 'ERROR') throw new Error(result.message)
  return result.data || []
}

/**
 * 4. Fetch vLLM Engine Prometheus Metrics (/api/v1/metrics)
 */
export async function fetchVllmMetrics(): Promise<VllmMetricsDTO> {
  const res = await fetch(`${API_BASE_URL}/metrics`, {
    headers: { ...DEFAULT_HEADERS },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch vLLM metrics`)
  const result: ResponseObject<VllmMetricsDTO> = await res.json()
  if (result.status === 'ERROR') throw new Error(result.message)
  return result.data
}

/**
 * 5. Fetch LMCache Statistics (/api/v1/cache)
 */
export async function fetchCacheStats(): Promise<CacheResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/cache`, {
    headers: { ...DEFAULT_HEADERS },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch LMCache stats`)
  const result: ResponseObject<CacheResponseDTO> = await res.json()
  if (result.status === 'ERROR') throw new Error(result.message)
  return result.data
}

/**
 * 6. Reset LMCache Statistics (/api/v1/cache - DELETE)
 */
export async function resetCacheStats(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/cache`, {
    method: 'DELETE',
    headers: { ...DEFAULT_HEADERS },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reset cache stats`)
}

/**
 * 7. Fetch System Health & Engine Status (/api/v1/system)
 */
export async function fetchSystemStatus(): Promise<SystemStatusDTO> {
  const res = await fetch(`${API_BASE_URL}/system`, {
    headers: { ...DEFAULT_HEADERS },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch system status`)
  const result: ResponseObject<SystemStatusDTO> = await res.json()
  if (result.status === 'ERROR') throw new Error(result.message)
  return result.data
}
