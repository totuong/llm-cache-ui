import type {
  ChatRequest,
  ChatResponse,
  ChatHistory,
  CacheResponseDTO,
  SystemStatusDTO,
  VllmMetricsDTO,
  ResponseObject,
  RegisterRequest,
  LoginRequest,
  AuthData,
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

// 401 Unauthorized callback registration
type UnauthorizedCallback = () => void
let onUnauthorizedHandler: UnauthorizedCallback | null = null

export function setUnauthorizedHandler(handler: UnauthorizedCallback) {
  onUnauthorizedHandler = handler
}

export function getAuthToken(): string | null {
  return localStorage.getItem('accessToken')
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function handle401Unauthorized() {
  localStorage.removeItem('accessToken')
  if (onUnauthorizedHandler) {
    onUnauthorizedHandler()
  }
}

/**
 * Fast health check helper to test if Spring Boot backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

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
 * 1. Register User (/api/v1/auth/register)
 */
export async function registerUser(
  request: RegisterRequest
): Promise<AuthData> {
  const payload: Record<string, string> = {
    username: request.username.trim(),
    password: request.password,
  }
  if (request.email && request.email.trim()) {
    payload.email = request.email.trim()
  }

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let json: ResponseObject<AuthData> | null = null
  try {
    json = await res.json()
  } catch { }

  if (!res.ok || json?.status === 'ERROR') {
    const errorMsg = json?.message || `Đăng ký thất bại (Mã phản hồi: ${res.status})`
    throw new Error(errorMsg)
  }

  return json!.data
}

/**
 * 2. Login User (/api/v1/auth/login)
 */
export async function loginUser(
  request: LoginRequest
): Promise<AuthData> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: request.username.trim(),
      password: request.password,
    }),
  })

  let json: ResponseObject<AuthData> | null = null
  try {
    json = await res.json()
  } catch { }

  if (!res.ok || json?.status === 'ERROR') {
    if (res.status === 401) {
      throw new Error(json?.message || 'Tài khoản hoặc mật khẩu không chính xác')
    }
    const errorMsg = json?.message || `Đăng nhập thất bại (Mã phản hồi: ${res.status})`
    throw new Error(errorMsg)
  }

  return json!.data
}

/**
 * 3. Call Synchronous Chat API (/api/v1/chat) 🔒
 */
export async function sendChatRequest(
  request: ChatRequest
): Promise<ChatResponse> {
  // Always sanitize model name to prevent 404 from vLLM on unknown models
  const modelName = (request.model && request.model.includes('Qwen'))
    ? request.model
    : 'Qwen/Qwen2.5-1.5B-Instruct'

  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: request.prompt,
      model: modelName,
    }),
  })

  if (res.status === 401) {
    handle401Unauthorized()
    throw new Error('Phiên đăng nhập đã hết hạn hoặc chưa xác thực (HTTP 401). Vui lòng đăng nhập lại.')
  }

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: Failed to reach LLM backend`
    try {
      const errorData: ResponseObject<null> = await res.json()
      if (errorData.message) errorMsg = errorData.message
    } catch { }
    throw new Error(errorMsg)
  }

  const result: ResponseObject<ChatResponse> = await res.json()
  if (result.status === 'ERROR') throw new Error(result.message || 'Error executing chat query')
  return result.data
}

/**
 * 4. Call Real-time SSE Streaming Chat API (/api/v1/chat/stream) 🔒
 */
export async function streamChatRequest(
  request: ChatRequest,
  onChunk: (chunkText: string, metadata?: Partial<ChatResponse>) => void,
  onComplete?: (finalResponse?: ChatResponse) => void,
  onError?: (err: Error) => void
) {
  try {
    const modelName = (request.model && request.model.includes('Qwen'))
      ? request.model
      : 'Qwen/Qwen2.5-1.5B-Instruct'

    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: modelName,
      }),
    })

    if (response.status === 401) {
      handle401Unauthorized()
      throw new Error('Phiên đăng nhập đã hết hạn hoặc chưa xác thực (HTTP 401). Vui lòng đăng nhập.')
    }

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
 * 5. Fetch Logged-in User's Personal Chat History (/api/v1/chat/history/me) 🔒
 */
export async function fetchMyChatHistory(): Promise<ChatHistory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/history/me`, {
      headers: { ...getAuthHeaders() },
    })

    if (res.status === 401) {
      handle401Unauthorized()
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    if (res.status === 403) {
      console.warn('[Chat History] Máy chủ trả về HTTP 403 Forbidden cho /api/v1/chat/history/me (Tài khoản hiện tại chưa có quyền USER/ADMIN trên backend).')
      return []
    }

    if (!res.ok) {
      console.warn(`[Chat History] Máy chủ phản hồi mã ${res.status}`)
      return []
    }

    const result: ResponseObject<ChatHistory[]> = await res.json()
    if (result.status === 'ERROR') {
      console.warn('[Chat History] Lỗi từ API:', result.message)
      return []
    }
    return result.data || []
  } catch (err: any) {
    if (err?.message?.includes('401')) throw err
    console.warn('[Chat History] Không thể đồng bộ lịch sử cá nhân:', err?.message || err)
    return []
  }
}

/**
 * 6. Fetch Entire Chat History (Admin / All) (/api/v1/chat/history) 🔒
 */
export async function fetchChatHistory(
  limit: number = 50
): Promise<ChatHistory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/history?limit=${limit}`, {
      headers: { ...getAuthHeaders() },
    })

    if (res.status === 401) {
      handle401Unauthorized()
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    if (res.status === 403) {
      console.warn('[Chat History] Máy chủ trả về HTTP 403 Forbidden cho /api/v1/chat/history (Yêu cầu quyền ADMIN trên backend).')
      return []
    }

    if (!res.ok) return []
    const result: ResponseObject<ChatHistory[]> = await res.json()
    if (result.status === 'ERROR') return []
    return result.data || []
  } catch (err: any) {
    if (err?.message?.includes('401')) throw err
    console.warn('[Chat History] Không thể tải toàn bộ lịch sử:', err?.message || err)
    return []
  }
}

/**
 * 7. Fetch vLLM Engine Prometheus Metrics (/api/v1/metrics)
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
 * 8. Fetch LMCache Statistics (/api/v1/cache)
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
 * 9. Reset LMCache Statistics (/api/v1/cache - DELETE)
 */
export async function resetCacheStats(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/cache`, {
    method: 'DELETE',
    headers: { ...DEFAULT_HEADERS },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reset cache stats`)
}

/**
 * 10. Fetch System Health & Engine Status (/api/v1/system)
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
