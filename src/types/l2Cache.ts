import type { ResponseObject } from './api'

// Cấu trúc Response chuẩn của Backend (tương thích ResponseObject)
export type ApiResponse<T> = ResponseObject<T>

// DTO Cấu hình L2 Cache
export interface L2CacheConfigDTO {
  id?: number
  enabled: boolean
  storageType?: string          // Mặc định: "REDIS"
  host: string                  // Ví dụ: "localhost" hoặc IP Redis
  port: number                  // Mặc định: 6379
  password?: string             // Password người dùng nhập mới
  hasPassword?: boolean         // true nếu DB đã có lưu password
  maskedPassword?: string       // "******"
  chunkSize?: number            // Tokens/chunk (Mặc định: 256)
  maxLocalCpuSizeGb?: number    // Dung lượng L1 CPU (Mặc định: 5.0 GB)
  remoteSerde?: 'naive' | 'cachegen' | string // Kiểu tuần tự hóa
  status?: 'ACTIVE' | 'DISABLED' | 'ERROR' | 'UNCONFIGURED' | string
  lastErrorMessage?: string
  remoteUrl?: string            // Ví dụ: "redis://localhost:6379"
  yamlContent?: string          // Nội dung file lmcache_vllm.yaml sinh ra
  updatedAt?: string
}

// Request & Response kiểm tra kết nối Redis
export interface RedisConnectionTestRequest {
  host: string
  port: number
  password?: string
  timeoutMs?: number
}

export interface RedisConnectionTestResponse {
  connected: boolean
  message: string
  latencyMs: number
  endpoint: string
}
