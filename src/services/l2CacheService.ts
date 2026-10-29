import type {
  ApiResponse,
  L2CacheConfigDTO,
  RedisConnectionTestRequest,
  RedisConnectionTestResponse,
} from '../types/l2Cache'

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
  'Content-Type': 'application/json',
}

export const l2CacheService = {
  /**
   * 1. Lấy cấu hình L2 hiện tại từ database và file lmcache_vllm.yaml
   */
  async getConfig(): Promise<L2CacheConfigDTO> {
    const res = await fetch(`${API_BASE_URL}/cache/l2`, {
      method: 'GET',
      headers: { ...DEFAULT_HEADERS },
    })

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: Không thể tải cấu hình L2 Cache`
      try {
        const errorJson = await res.json()
        if (errorJson?.message) errorMsg = errorJson.message
      } catch {}
      throw new Error(errorMsg)
    }

    const json: ApiResponse<L2CacheConfigDTO> = await res.json()
    if (json.status !== 'SUCCESS') {
      throw new Error(json.message || 'Lỗi khi tải cấu hình L2')
    }
    return json.data
  },

  /**
   * 2. Kiểm tra kết nối Redis (Test Connection với PING và đo RTT)
   */
  async testConnection(data: RedisConnectionTestRequest): Promise<RedisConnectionTestResponse> {
    const res = await fetch(`${API_BASE_URL}/cache/l2/test`, {
      method: 'POST',
      headers: { ...DEFAULT_HEADERS },
      body: JSON.stringify(data),
    })

    // Khi test kết nối thất bại, Backend có thể trả về HTTP 400 kèm dữ liệu chi tiết
    let json: ApiResponse<RedisConnectionTestResponse> | null = null
    try {
      json = await res.json()
    } catch {
      throw new Error(`HTTP ${res.status}: Lỗi máy chủ khi kiểm tra kết nối Redis`)
    }

    if (!json) {
      throw new Error('Không nhận được phản hồi từ máy chủ')
    }

    // Nếu trả về response DTO trong data, kể cả connected = false
    if (json.data && typeof json.data.connected === 'boolean') {
      return json.data
    }

    if (json.status !== 'SUCCESS') {
      throw new Error(json.message || 'Kiểm tra kết nối thất bại')
    }

    return json.data
  },

  /**
   * 3. Lưu và áp dụng cấu hình L2 (Tự động cập nhật file YAML và reload engine vLLM)
   */
  async saveConfig(config: Partial<L2CacheConfigDTO>): Promise<L2CacheConfigDTO> {
    const res = await fetch(`${API_BASE_URL}/cache/l2`, {
      method: 'POST',
      headers: { ...DEFAULT_HEADERS },
      body: JSON.stringify(config),
    })

    let json: ApiResponse<L2CacheConfigDTO> | null = null
    try {
      json = await res.json()
    } catch {}

    if (!res.ok || json?.status !== 'SUCCESS') {
      const msg = json?.message || `HTTP ${res.status}: Lỗi khi lưu cấu hình L2 Cache`
      throw new Error(msg)
    }

    return json.data
  },

  /**
   * 4. Tắt L2 Cache (chuyển về L1 CPU Cache nội bộ)
   */
  async disableL2(): Promise<L2CacheConfigDTO> {
    const res = await fetch(`${API_BASE_URL}/cache/l2`, {
      method: 'DELETE',
      headers: { ...DEFAULT_HEADERS },
    })

    let json: ApiResponse<L2CacheConfigDTO> | null = null
    try {
      json = await res.json()
    } catch {}

    if (!res.ok || json?.status !== 'SUCCESS') {
      const msg = json?.message || `HTTP ${res.status}: Lỗi khi tắt L2 Cache`
      throw new Error(msg)
    }

    return json.data
  },

  /**
   * 5. Xem trước file lmcache_vllm.yaml sinh ra từ cấu hình
   */
  async getYamlPreview(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/cache/l2/yaml`, {
      method: 'GET',
      headers: { ...DEFAULT_HEADERS },
    })

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: Không thể tải nội dung YAML xem trước`
      try {
        const errorJson = await res.json()
        if (errorJson?.message) errorMsg = errorJson.message
      } catch {}
      throw new Error(errorMsg)
    }

    const json: ApiResponse<string> = await res.json()
    if (json.status !== 'SUCCESS') {
      throw new Error(json.message || 'Lỗi khi tải nội dung YAML')
    }
    return json.data
  },
}
