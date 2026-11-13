<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useToast } from 'primevue/usetoast'

// Lucide Icons
import {
  LogIn,
  UserPlus,
  Lock,
  User,
  Mail,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const authStore = useAuthStore()
const chatStore = useChatStore()
const toast = useToast()

type AuthMode = 'login' | 'signup'
const mode = ref<AuthMode>('login')

// Form inputs
const username = ref('')
const password = ref('')
const email = ref('')
const localError = ref('')

// Compute visibility combined from prop and store state
const isModalVisible = computed({
  get: () => props.visible || authStore.isAuthModalOpen,
  set: (val: boolean) => {
    emit('update:visible', val)
    authStore.isAuthModalOpen = val
  }
})

// Watch store error to show it in modal
watch(() => authStore.authError, (newErr) => {
  if (newErr) localError.value = newErr
})

function switchMode(newMode: AuthMode) {
  mode.value = newMode
  localError.value = ''
  authStore.authError = null
}

function closeModal() {
  isModalVisible.value = false
  username.value = ''
  password.value = ''
  email.value = ''
  localError.value = ''
  authStore.authError = null
  mode.value = 'login'
}

async function handleLogin() {
  localError.value = ''
  authStore.authError = null

  const uname = username.value.trim()
  const pwd = password.value.trim()

  if (!uname || !pwd) {
    localError.value = 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.'
    return
  }

  try {
    const authData = await authStore.login({
      username: uname,
      password: pwd,
    })

    toast.add({
      severity: 'success',
      summary: 'Đăng nhập thành công',
      detail: `Chào mừng ${authData.username} đã quay trở lại!`,
      life: 3000,
    })

    closeModal()

    // Sync cloud chat history for logged-in user
    try {
      await chatStore.syncHistoryFromBackend()
    } catch {
      // Non-blocking sync error
    }
  } catch (err: any) {
    localError.value = err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.'
  }
}

async function handleRegister() {
  localError.value = ''
  authStore.authError = null

  const uname = username.value.trim()
  const pwd = password.value.trim()
  const mail = email.value.trim()

  if (!uname || !pwd) {
    localError.value = 'Vui lòng nhập Tên đăng nhập và Mật khẩu.'
    return
  }

  if (pwd.length < 6) {
    localError.value = 'Mật khẩu phải có tối thiểu 6 ký tự.'
    return
  }

  if (mail && !/\S+@\S+\.\S+/.test(mail)) {
    localError.value = 'Định dạng email không hợp lệ.'
    return
  }

  try {
    const authData = await authStore.register({
      username: uname,
      password: pwd,
      email: mail || undefined,
    })

    toast.add({
      severity: 'success',
      summary: 'Đăng ký thành công',
      detail: `Tài khoản ${authData.username} đã được tạo và kích hoạt.`,
      life: 3000,
    })

    closeModal()

    // Sync cloud chat history for logged-in user
    try {
      await chatStore.syncHistoryFromBackend()
    } catch {
      // Non-blocking sync error
    }
  } catch (err: any) {
    localError.value = err?.message || 'Đăng ký không thành công. Tên đăng nhập có thể đã tồn tại.'
  }
}
</script>

<template>
  <Dialog
    v-model:visible="isModalVisible"
    @hide="closeModal"
    modal
    :header="mode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : 'ĐĂNG KÝ TÀI KHOẢN'"
    class="w-full max-w-md mx-4"
  >
    <div class="flex flex-col gap-4 my-2 text-left">
      <!-- Brand Emblem Indicator -->
      <div class="flex flex-col items-center gap-1.5 text-center mb-1 select-none">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-hust-red to-hust-red-dark flex items-center justify-center text-white font-black text-lg shadow-md border border-hust-red/30">
          H
        </div>
        <h3 class="font-extrabold text-sm text-tx-p tracking-wide mt-1">LLM-HUST Assistant</h3>
        <p class="text-[10px] text-tx-s">
          {{ mode === 'login' 
            ? 'Đăng nhập để lưu lịch sử hội thoại và đồng bộ tham số LMCache.' 
            : 'Tạo tài khoản sinh viên / nghiên cứu để tương tác với mô hình vLLM.' 
          }}
        </p>
      </div>

      <!-- Mode Toggle Pills -->
      <div class="flex bg-bg-inp border border-border-p p-1 rounded-xl select-none">
        <button
          type="button"
          class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          :class="mode === 'login' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="switchMode('login')"
        >
          <LogIn class="w-3.5 h-3.5" />
          <span>Đăng nhập</span>
        </button>
        <button
          type="button"
          class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          :class="mode === 'signup' ? 'bg-hust-red text-white shadow-xs' : 'text-tx-s hover:text-tx-p'"
          @click="switchMode('signup')"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>Đăng ký</span>
        </button>
      </div>

      <!-- Form Inputs -->
      <form class="flex flex-col gap-3.5 mt-1" @submit.prevent="mode === 'login' ? handleLogin() : handleRegister()">
        <!-- Username Field -->
        <div class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-tx-s flex items-center gap-1">
            <User class="w-3.5 h-3.5 text-hust-gold" />
            <span>Tên đăng nhập (Username)</span>
            <span class="text-rose-500">*</span>
          </label>
          <InputText
            v-model="username"
            placeholder="Ví dụ: alice"
            autocomplete="username"
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2.5 rounded-xl focus:border-hust-red"
            :disabled="authStore.isLoading"
          />
        </div>

        <!-- Email Field (Register Only) -->
        <div v-if="mode === 'signup'" class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-tx-s flex items-center gap-1">
            <Mail class="w-3.5 h-3.5 text-hust-gold" />
            <span>Địa chỉ Email</span>
            <span class="text-[10px] text-tx-s font-normal">(Không bắt buộc)</span>
          </label>
          <InputText
            v-model="email"
            type="email"
            placeholder="alice@example.com"
            autocomplete="email"
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2.5 rounded-xl focus:border-hust-red"
            :disabled="authStore.isLoading"
          />
        </div>

        <!-- Password Field -->
        <div class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-tx-s flex items-center gap-1">
            <Lock class="w-3.5 h-3.5 text-hust-gold" />
            <span>Mật khẩu</span>
            <span class="text-rose-500">*</span>
            <span v-if="mode === 'signup'" class="text-[10px] text-tx-s font-normal">(Tối thiểu 6 ký tự)</span>
          </label>
          <Password
            v-model="password"
            placeholder="••••••••"
            :feedback="mode === 'signup'"
            toggleMask
            :disabled="authStore.isLoading"
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs rounded-xl"
            inputClass="w-full bg-bg-inp border-none text-tx-p text-xs p-2.5 rounded-xl"
          />
        </div>

        <!-- Error Feedback Banner -->
        <div
          v-if="localError"
          class="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-left flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
          <span class="font-medium">{{ localError }}</span>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          :label="mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'"
          :loading="authStore.isLoading"
          class="bg-hust-red hover:bg-hust-red-hover text-white text-xs py-2.5 rounded-xl border-none shadow transition-colors w-full font-bold mt-2 cursor-pointer"
        />

        <!-- Switch Footer Link -->
        <div class="text-center text-xs text-tx-s mt-1 select-none">
          <template v-if="mode === 'login'">
            Chưa có tài khoản?
            <a
              href="#"
              class="text-hust-gold hover:underline font-semibold ml-1 cursor-pointer"
              @click.prevent="switchMode('signup')"
            >
              Đăng ký ngay
            </a>
          </template>
          <template v-else>
            Đã có tài khoản?
            <a
              href="#"
              class="text-hust-gold hover:underline font-semibold ml-1 cursor-pointer"
              @click.prevent="switchMode('login')"
            >
              Đăng nhập
            </a>
          </template>
        </div>
      </form>
    </div>
  </Dialog>
</template>

<style scoped>
:deep(.p-password) {
  display: flex;
}
:deep(.p-password-input) {
  width: 100% !important;
}
</style>
