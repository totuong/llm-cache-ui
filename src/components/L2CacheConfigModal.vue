<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { l2CacheService } from '../services/l2CacheService'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import type { L2CacheConfigDTO, RedisConnectionTestResponse } from '../types/l2Cache'
import confetti from 'canvas-confetti'

// Lucide Icons
import {
  Server,
  Activity,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Code2,
  Copy,
  RefreshCw,
  Power,
  Save,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
} from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'config-updated', config: L2CacheConfigDTO): void
}>()

const cacheStore = useCacheStore()
const langStore = useLangStore()

// State
const loading = ref(false)
const testing = ref(false)
const saving = ref(false)
const testResult = ref<RedisConnectionTestResponse | null>(null)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const showYaml = ref(false)
const showPassword = ref(false)
const copiedYaml = ref(false)

// Form State
const enabled = ref(false)
const host = ref('localhost')
const port = ref(6379)
const password = ref('')
const hasPassword = ref(false)
const chunkSize = ref(256)
const maxCpuSize = ref(5.0)
const remoteSerde = ref<'naive' | 'cachegen'>('naive')
const status = ref('DISABLED')
const yamlContent = ref('')

// Load configuration whenever modal is opened
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadCurrentConfig()
    }
  }
)

async function loadCurrentConfig() {
  loading.value = true
  errorMsg.value = null
  successMsg.value = null
  testResult.value = null

  try {
    const data = await l2CacheService.getConfig()
    enabled.value = Boolean(data.enabled)
    host.value = data.host || 'localhost'
    port.value = data.port || 6379
    hasPassword.value = Boolean(data.hasPassword)
    password.value = '' // Clear user input field; server holds secret
    chunkSize.value = data.chunkSize || 256
    maxCpuSize.value = data.maxLocalCpuSizeGb || 5.0
    remoteSerde.value = (data.remoteSerde as 'naive' | 'cachegen') || 'naive'
    status.value = data.status || (data.enabled ? 'ACTIVE' : 'DISABLED')
    yamlContent.value = data.yamlContent || ''

    // Sync to Pinia store as well
    cacheStore.l2RemoteConfig = data
    if (data.yamlContent) cacheStore.l2YamlContent = data.yamlContent
  } catch (err: any) {
    // If backend is unreachable or not yet configured, fallback to store's values
    errorMsg.value = err.message || 'Không thể tải cấu hình L2 từ máy chủ'
    if (cacheStore.l2RemoteConfig) {
      const c = cacheStore.l2RemoteConfig
      enabled.value = Boolean(c.enabled)
      host.value = c.host || 'localhost'
      port.value = c.port || 6379
      hasPassword.value = Boolean(c.hasPassword)
      chunkSize.value = c.chunkSize || 256
      maxCpuSize.value = c.maxLocalCpuSizeGb || 5.0
      status.value = c.status || 'UNCONFIGURED'
      yamlContent.value = c.yamlContent || ''
    }
  } finally {
    loading.value = false
  }
}

// 1. Kiểm tra kết nối Redis
async function handleTestConnection() {
  testing.value = true
  testResult.value = null
  errorMsg.value = null
  successMsg.value = null

  try {
    const result = await l2CacheService.testConnection({
      host: host.value.trim(),
      port: Number(port.value),
      password: password.value ? password.value : undefined,
    })

    testResult.value = result

    if (result.connected) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      })
    }
  } catch (err: any) {
    testResult.value = {
      connected: false,
      message: err.message || 'Kết nối thất bại',
      latencyMs: 0,
      endpoint: `${host.value}:${port.value}`,
    }
  } finally {
    testing.value = false
  }
}

// 2. Lưu & Áp Dụng Cấu Hình
async function handleSave() {
  saving.value = true
  errorMsg.value = null
  successMsg.value = null

  try {
    const payload: Partial<L2CacheConfigDTO> = {
      enabled: enabled.value,
      storageType: 'REDIS',
      host: host.value.trim(),
      port: Number(port.value),
      password: password.value ? password.value : (hasPassword.value ? '******' : undefined),
      chunkSize: Number(chunkSize.value),
      maxLocalCpuSizeGb: Number(maxCpuSize.value),
      remoteSerde: remoteSerde.value,
    }

    const updated = await l2CacheService.saveConfig(payload)
    successMsg.value = 'Cấu hình L2 Cache đã được áp dụng và đồng bộ vào file lmcache_vllm.yaml!'
    status.value = updated.status || (updated.enabled ? 'ACTIVE' : 'DISABLED')
    hasPassword.value = Boolean(updated.hasPassword)
    password.value = ''
    yamlContent.value = updated.yamlContent || ''

    // Update store state
    cacheStore.l2RemoteConfig = updated
    if (updated.yamlContent) cacheStore.l2YamlContent = updated.yamlContent
    cacheStore.l2Config.connectionUrl = updated.remoteUrl || `redis://${updated.host}:${updated.port}`
    cacheStore.l2Config.status = updated.enabled && updated.status === 'ACTIVE' ? 'connected' : 'unconfigured'

    emit('config-updated', updated)
  } catch (err: any) {
    errorMsg.value = err.message || 'Lỗi khi lưu cấu hình'
  } finally {
    saving.value = false
  }
}

// 3. Tắt L2 Cache
async function handleDisableL2() {
  if (!confirm('Bạn có chắc chắn muốn tắt L2 Remote Cache và chuyển về L1 CPU Cache nội bộ?')) return

  saving.value = true
  errorMsg.value = null
  successMsg.value = null

  try {
    const updated = await l2CacheService.disableL2()
    enabled.value = false
    status.value = 'DISABLED'
    yamlContent.value = updated.yamlContent || ''
    successMsg.value = 'Đã tắt L2 Remote Cache. Hệ thống đã chuyển về L1 CPU Cache.'

    cacheStore.l2RemoteConfig = updated
    cacheStore.l2Config.status = 'unconfigured'
    emit('config-updated', updated)
  } catch (err: any) {
    errorMsg.value = err.message || 'Lỗi khi tắt L2 Cache'
  } finally {
    saving.value = false
  }
}

// 4. Xem trước YAML
async function handleToggleYaml() {
  showYaml.value = !showYaml.value
  if (showYaml.value && !yamlContent.value) {
    try {
      yamlContent.value = await l2CacheService.getYamlPreview()
    } catch (e) {
      console.warn('Could not fetch yaml preview', e)
    }
  }
}

function copyYaml() {
  if (!yamlContent.value) return
  navigator.clipboard.writeText(yamlContent.value)
  copiedYaml.value = true
  setTimeout(() => (copiedYaml.value = false), 2000)
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    modal
    :closable="true"
    :header="'⚙️ Cấu Hình LMCache L2 Remote Cache'"
    class="w-full max-w-2xl mx-4"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4 py-1 text-left text-tx-p">
      <!-- Subtitle description -->
      <p class="text-xs text-tx-s -mt-2">
        Lưu trữ KV Cache phân tán trên Redis để chia sẻ cache giữa các lượt chat & cụm máy chủ vLLM.
      </p>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center gap-2 py-10 text-tx-s text-xs font-mono">
        <RefreshCw class="w-4 h-4 animate-spin text-hust-gold" />
        <span>Đang tải cấu hình hiện tại từ máy chủ...</span>
      </div>

      <div v-else class="space-y-4">
        <!-- Alert Messages -->
        <div
          v-if="errorMsg"
          class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div class="flex-1">{{ errorMsg }}</div>
        </div>

        <div
          v-if="successMsg"
          class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div class="flex-1">{{ successMsg }}</div>
        </div>

        <!-- Trạng thái L2 hiện tại -->
        <div class="flex items-center justify-between bg-bg-inp/60 border border-border-s p-3 rounded-xl">
          <div class="flex items-center gap-2 text-xs">
            <Server class="w-4 h-4 text-hust-gold" />
            <span class="font-bold text-tx-p">Trạng thái Tầng L2:</span>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-xs"
            :class="status === 'ACTIVE'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : status === 'ERROR'
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : status === 'ERROR' ? 'bg-rose-400' : 'bg-zinc-400'"
            ></span>
            <span>{{ status }}</span>
          </span>
        </div>

        <!-- Switch Toggle Bật/Tắt L2 -->
        <div class="flex items-center justify-between p-3.5 bg-gradient-to-r from-bg-inp/80 via-bg-inp/40 to-bg-inp/80 border border-border-s rounded-xl">
          <div class="space-y-0.5">
            <label class="text-xs font-bold text-tx-p flex items-center gap-2">
              <span>Kích hoạt L2 Remote Cache (Redis Backend)</span>
              <span v-if="enabled" class="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">BẬT</span>
              <span v-else class="text-[10px] text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded-full font-mono font-bold">TẮT</span>
            </label>
            <p class="text-[11px] text-tx-s">
              Khi bật, KV Cache sẽ tự động offload xuống Redis khi bộ nhớ L1 RAM/GPU đầy
            </p>
          </div>

          <!-- Native Clean Switch -->
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              v-model="enabled"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width after:w-5 after:transition-all peer-checked:bg-hust-red"></div>
          </label>
        </div>

        <!-- Form Fields Container -->
        <div class="space-y-3.5 transition-opacity" :class="{ 'opacity-50 pointer-events-none': !enabled }">
          <!-- Row 1: Host & Port -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2 space-y-1">
              <label class="text-xs font-bold text-tx-p">
                Redis Host / IP: <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="host"
                type="text"
                :required="enabled"
                placeholder="localhost hoặc 192.168.1.100"
                class="w-full bg-bg-inp border border-border-s text-tx-p font-mono text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-hust-gold shadow-inner"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-tx-p">
                Port: <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="port"
                type="number"
                :required="enabled"
                placeholder="6379"
                class="w-full bg-bg-inp border border-border-s text-tx-p font-mono text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-hust-gold shadow-inner"
              />
            </div>
          </div>

          <!-- Row 2: Redis Password with Mask / Status -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <label class="font-bold text-tx-p flex items-center gap-1.5">
                <span>Redis Password:</span>
                <span v-if="hasPassword" class="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  (Đã có mật khẩu được lưu)
                </span>
              </label>
              <span class="text-[10px] text-tx-s">Tùy chọn (cho Redis có AUTH)</span>
            </div>

            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="hasPassword ? 'Để trống nếu giữ nguyên mật khẩu cũ' : 'Không có mật khẩu (tùy chọn)'"
                class="w-full bg-bg-inp border border-border-s text-tx-p font-mono text-xs px-3 py-2 rounded-xl pr-9 focus:outline-none focus:border-hust-gold shadow-inner"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-tx-s hover:text-tx-p cursor-pointer"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Row 3: Chunk Size & Max Local CPU Size -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-tx-p">Chunk Size (Tokens / Khối):</label>
              <div class="flex gap-1.5">
                <button
                  v-for="size in [128, 256, 512]"
                  :key="size"
                  type="button"
                  class="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer"
                  :class="chunkSize === size ? 'bg-hust-red text-white border-hust-red shadow-xs' : 'bg-bg-inp border-border-s text-tx-s hover:text-tx-p'"
                  @click="chunkSize = size"
                >
                  {{ size }}
                </button>
              </div>
              <p class="text-[10px] text-tx-s">Kích thước block chia nhỏ KV cache (mặc định 256)</p>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-tx-p">L1 CPU RAM Size (GB):</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="maxCpuSize"
                  type="number"
                  step="0.5"
                  min="1"
                  max="128"
                  class="w-24 bg-bg-inp border border-border-s text-tx-p font-mono text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-hust-gold"
                />
                <span class="text-xs font-mono text-hust-gold font-bold">GB</span>
              </div>
              <p class="text-[10px] text-tx-s">Dung lượng RAM tối đa cho L1 Cache trước khi đẩy xuống L2</p>
            </div>
          </div>

          <!-- Row 4: Serialization Format (remote_serde) -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-tx-p">Định dạng tuần tự hóa (remote_serde):</label>
            <select
              v-model="remoteSerde"
              class="w-full bg-bg-inp border border-border-s text-tx-p text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-hust-gold cursor-pointer"
            >
              <option value="naive">naive (Mặc định - Tốc độ cao, không nén)</option>
              <option value="cachegen">cachegen (Nén KV cache - Tiết kiệm băng thông mạng)</option>
            </select>
          </div>

          <!-- Section: Test Connection Button & Live Badge -->
          <div class="p-3 bg-bg-inp/40 border border-border-s rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              class="border border-border-s bg-bg-inp hover:bg-bg-btn-hover text-tx-p px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              :disabled="testing || !host"
              @click="handleTestConnection"
            >
              <RefreshCw class="w-3.5 h-3.5 text-accent-cyan" :class="{ 'animate-spin': testing }" />
              <span>{{ testing ? 'Đang kiểm tra kết nối...' : '🔍 Kiểm tra kết nối Redis' }}</span>
            </button>

            <!-- Test Result Pill -->
            <div v-if="testResult" class="flex items-center">
              <div
                class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-2"
                :class="testResult.connected
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'"
              >
                <CheckCircle2 v-if="testResult.connected" class="w-4 h-4 shrink-0 text-emerald-400" />
                <XCircle v-else class="w-4 h-4 shrink-0 text-rose-400" />
                <span>{{ testResult.connected ? 'Kết nối thành công!' : testResult.message }}</span>
                <span v-if="testResult.connected" class="bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                  Ping: {{ testResult.latencyMs }}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Collapsible YAML Preview -->
        <div class="border border-border-s rounded-xl overflow-hidden bg-bg-inp/30">
          <div class="flex items-center justify-between p-3">
            <button
              type="button"
              class="text-xs font-bold text-accent-cyan hover:underline flex items-center gap-1.5 cursor-pointer"
              @click="handleToggleYaml"
            >
              <Code2 class="w-3.5 h-3.5" />
              <span>{{ showYaml ? '▼ Ẩn cấu hình lmcache_vllm.yaml' : '▶ Xem trước file lmcache_vllm.yaml' }}</span>
            </button>

            <button
              v-if="showYaml"
              type="button"
              class="text-tx-s hover:text-tx-p text-xs flex items-center gap-1 font-mono cursor-pointer"
              @click="copyYaml"
            >
              <Check v-if="copiedYaml" class="w-3.5 h-3.5 text-emerald-400" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copiedYaml ? 'Đã chép' : 'Sao chép' }}</span>
            </button>
          </div>

          <div v-if="showYaml" class="p-3 pt-0">
            <pre class="bg-black/60 p-3 rounded-lg text-[11px] font-mono text-hust-gold overflow-x-auto max-h-48 leading-relaxed border border-border-p"><code>{{ yamlContent || '# Chưa có cấu hình YAML từ server' }}</code></pre>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-border-p">
          <div>
            <button
              v-if="enabled"
              type="button"
              class="w-full sm:w-auto text-rose-400 hover:text-white border border-rose-500/30 bg-rose-500/10 hover:bg-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :disabled="saving"
              @click="handleDisableL2"
            >
              <Power class="w-3.5 h-3.5" />
              <span>Tắt L2 Cache</span>
            </button>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-border-s bg-bg-inp hover:bg-bg-btn-hover text-tx-s hover:text-tx-p text-xs font-bold transition-all cursor-pointer"
              @click="handleClose"
            >
              Đóng
            </button>

            <button
              type="button"
              class="px-5 py-2 rounded-xl bg-hust-red hover:bg-hust-red-hover text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              :disabled="saving"
              @click="handleSave"
            >
              <Save class="w-3.5 h-3.5" :class="{ 'animate-spin': saving }" />
              <span>{{ saving ? 'Đang lưu & nạp vào vLLM...' : '💾 Lưu & Kích Hoạt' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
