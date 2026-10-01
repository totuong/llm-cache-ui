<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'primevue/usetoast'

// Lucide Icons
import {
  LogIn,
  Phone,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): value is boolean
}>()

const authStore = useAuthStore()
const toast = useToast()

type AuthMode = 'login' | 'signup' | 'forgot' | 'phone'

const mode = ref<AuthMode>('login')

// Form variables
const email = ref('')
const password = ref('')
const name = ref('')
const phone = ref('')
const phoneCode = ref('')
const isOtpSent = ref(false)
const error = ref('')

function handleEmailLogin() {
  error.value = ''
  if (!email.value.trim() || !password.value.trim()) {
    error.value = 'Vui lòng điền đầy đủ email và mật khẩu.'
    return
  }
  if (!/\S+@\S+\.\S+/.test(email.value)) {
    error.value = 'Định dạng email không hợp lệ.'
    return
  }
  
  authStore.loginWithEmail(email.value, name.value)
  toast.add({
    severity: 'success',
    summary: 'Đăng nhập thành công',
    detail: `Chào mừng quay trở lại, ${authStore.profile?.fullName}!`,
    life: 3000
  })
  closeModal()
}

function handleSignUp() {
  error.value = ''
  if (!name.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = 'Vui lòng điền đầy đủ thông tin.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Mật khẩu phải dài ít nhất 6 ký tự.'
    return
  }
  
  authStore.loginWithEmail(email.value, name.value)
  toast.add({
    severity: 'success',
    summary: 'Đăng ký tài khoản thành công',
    detail: `Tài khoản ${email.value} đã được kích hoạt.`,
    life: 3000
  })
  closeModal()
}

function handleGoogleLogin() {
  authStore.loginWithGoogle()
  toast.add({
    severity: 'success',
    summary: 'Đăng nhập Google thành công',
    detail: 'Đã kết nối tài khoản Google.',
    life: 3000
  })
  closeModal()
}

function handleSendOtp() {
  error.value = ''
  if (!phone.value.trim() || !/^\d{10,11}$/.test(phone.value.trim())) {
    error.value = 'Vui lòng nhập số điện thoại hợp lệ (10-11 chữ số).'
    return
  }
  
  isOtpSent.value = true
  toast.add({
    severity: 'info',
    summary: 'Đã gửi mã OTP',
    detail: 'Mã xác thực 4 chữ số (mặc định: 1234) đã được gửi.',
    life: 4000
  })
}

function handleVerifyOtp() {
  error.value = ''
  if (phoneCode.value !== '1234') {
    error.value = 'Mã OTP không chính xác (Thử mã: 1234).'
    return
  }
  
  authStore.loginWithPhone(phone.value)
  toast.add({
    severity: 'success',
    summary: 'Xác thực thành công',
    detail: 'Đăng nhập thành công bằng số điện thoại.',
    life: 3000
  })
  closeModal()
}

function handleForgotPassword() {
  error.value = ''
  if (!email.value.trim() || !/\S+@\S+\.\S+/.test(email.value)) {
    error.value = 'Vui lòng nhập email khôi phục hợp lệ.'
    return
  }
  
  toast.add({
    severity: 'success',
    summary: 'Yêu cầu khôi phục mật khẩu',
    detail: `Hướng dẫn đổi lại mật khẩu đã gửi đến ${email.value}`,
    life: 5000
  })
  mode.value = 'login'
}

function closeModal() {
  emit('update:visible', false)
  email.value = ''
  password.value = ''
  name.value = ''
  phone.value = ''
  phoneCode.value = ''
  isOtpSent.value = false
  error.value = ''
  mode.value = 'login'
}

function switchMode(newMode: AuthMode) {
  mode.value = newMode
  error.value = ''
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="closeModal"
    modal
    :header="
      mode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' :
      mode === 'signup' ? 'ĐĂNG KÝ TÀI KHOẢN' :
      mode === 'forgot' ? 'KHÔI PHỤC MẬT KHẨU' : 'XÁC THỰC SỐ ĐIỆN THOẠI'
    "
    class="w-full max-w-md mx-4"
  >
    <div class="flex flex-col gap-4 my-2 text-left">
      
      <!-- Brand Emblem Indicator -->
      <div class="flex flex-col items-center gap-1.5 text-center mb-1 select-none">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-hust-red to-hust-red-dark flex items-center justify-center text-white font-black text-lg shadow-md border border-hust-red/30">
          H
        </div>
        <h3 class="font-extrabold text-sm text-tx-p tracking-wide mt-1">LLM-HUST Assistant</h3>
        <p class="text-[10px] text-tx-s">Đăng nhập để lưu lịch sử và đồng bộ tham số tối ưu hóa.</p>
      </div>

      <!-- Mode 1: Forgot Password -->
      <div v-if="mode === 'forgot'" class="flex flex-col gap-3.5">
        <div class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-tx-s">Địa chỉ Email</label>
          <InputText
            v-model="email"
            placeholder="nhap.email@hust.edu.vn"
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2 rounded-xl focus:ring-hust-red focus:border-hust-red"
          />
        </div>
        <p v-if="error" class="text-[10px] text-rose-400 font-medium flex items-center gap-1">
          <AlertCircle class="w-3 h-3" />
          {{ error }}
        </p>
        
        <Button
          label="Gửi yêu cầu khôi phục"
          class="bg-hust-red hover:bg-hust-red-hover text-white text-xs py-2.5 rounded-xl border-none shadow transition-colors w-full font-bold mt-2 cursor-pointer"
          @click="handleForgotPassword"
        />
        
        <div class="text-center text-xs text-tx-s mt-2 select-none">
          Quay lại <a href="#" class="text-hust-gold hover:underline font-semibold" @click.prevent="switchMode('login')">Đăng nhập</a>
        </div>
      </div>

      <!-- Mode 2: Phone Login -->
      <div v-else-if="mode === 'phone'" class="flex flex-col gap-3.5">
        <div v-if="!isOtpSent" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5 text-left">
            <label class="text-xs font-semibold text-tx-s">Số điện thoại</label>
            <InputText
              v-model="phone"
              placeholder="Ví dụ: 0987654321"
              class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2 rounded-xl"
            />
          </div>
          <p v-if="error" class="text-[10px] text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {{ error }}
          </p>
          <Button
            label="Gửi mã OTP"
            class="bg-hust-red hover:bg-hust-red-hover text-white text-xs py-2.5 rounded-xl border-none shadow w-full font-bold mt-2 cursor-pointer"
            @click="handleSendOtp"
          />
        </div>

        <div v-else class="flex flex-col gap-3">
          <div class="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-left font-mono">
            Mã OTP đã được gửi đến số <strong class="text-tx-p">{{ phone }}</strong>. Nhập <strong>1234</strong> để kiểm thử.
          </div>
          <div class="flex flex-col gap-1.5 text-left">
            <label class="text-xs font-semibold text-tx-s">Nhập mã xác thực (OTP)</label>
            <InputText
              v-model="phoneCode"
              placeholder="1234"
              class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2 rounded-xl text-center tracking-widest font-bold"
              maxlength="4"
              @keyup.enter="handleVerifyOtp"
            />
          </div>
          <p v-if="error" class="text-[10px] text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {{ error }}
          </p>
          <div class="flex gap-2 mt-2">
            <Button
              label="Quay lại"
              severity="secondary"
              text
              class="flex-1 text-tx-s hover:text-tx-p hover:bg-bg-btn-hover text-xs py-2.5 rounded-xl border border-border-p cursor-pointer"
              @click="isOtpSent = false"
            />
            <Button
              label="Xác thực OTP"
              class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-xl border-none font-bold cursor-pointer"
              @click="handleVerifyOtp"
            />
          </div>
        </div>

        <div class="text-center text-xs text-tx-s mt-2 select-none">
          Hoặc đăng nhập bằng <a href="#" class="text-hust-gold hover:underline font-semibold" @click.prevent="switchMode('login')">Email & Mật khẩu</a>
        </div>
      </div>

      <!-- Mode 3 & 4: Login & Sign Up Forms -->
      <div v-else class="flex flex-col gap-3.5">
        <!-- Google Social Login Button -->
        <button
          class="w-full flex items-center justify-center gap-2.5 rounded-xl border border-border-p hover:border-border-s bg-bg-inp hover:bg-bg-btn-hover py-2.5 text-xs font-bold text-tx-p transition-all cursor-pointer shadow-xs"
          @click="handleGoogleLogin"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 12-4.52z"
            />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <!-- Phone number shortcut link -->
        <button
          class="w-full flex items-center justify-center gap-2 rounded-xl border border-border-p hover:border-border-s bg-bg-inp hover:bg-bg-btn-hover py-2.5 text-xs font-bold text-tx-p transition-all cursor-pointer shadow-xs"
          @click="switchMode('phone')"
        >
          <Phone class="w-4 h-4 text-hust-gold" />
          <span>Đăng nhập bằng Số điện thoại</span>
        </button>

        <div class="flex items-center gap-3 my-1 select-none">
          <span class="h-px bg-border-p flex-1"></span>
          <span class="text-[9px] text-tx-m font-bold uppercase tracking-wider">Hoặc</span>
          <span class="h-px bg-border-p flex-1"></span>
        </div>

        <!-- Full Name field (Sign Up Mode) -->
        <div v-if="mode === 'signup'" class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-tx-s">Tên hiển thị</label>
          <InputText
            v-model="name"
            placeholder="Ví dụ: Nguyễn Văn A"
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2 rounded-xl"
          />
        </div>

        <!-- Email Field -->
        <div class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-tx-s">Địa chỉ Email</label>
          <InputText
            v-model="email"
            placeholder="email@vidu.com"
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs p-2 rounded-xl"
          />
        </div>

        <!-- Password Field -->
        <div class="flex flex-col gap-1.5 text-left">
          <div class="flex justify-between items-center">
            <label class="text-xs font-semibold text-tx-s">Mật khẩu</label>
            <a 
              v-if="mode === 'login'" 
              href="#" 
              class="text-[10px] text-tx-s hover:text-hust-gold transition-colors font-semibold"
              @click.prevent="switchMode('forgot')"
            >
              Quên mật khẩu?
            </a>
          </div>
          <Password
            v-model="password"
            placeholder="••••••••"
            :feedback="mode === 'signup'"
            toggleMask
            class="w-full bg-bg-inp border-border-p text-tx-p text-xs rounded-xl"
            inputClass="w-full bg-bg-inp border-none text-tx-p text-xs p-2 rounded-xl"
          />
        </div>

        <!-- Error feedback -->
        <p v-if="error" class="text-[10px] text-rose-400 font-medium text-left flex items-center gap-1">
          <AlertCircle class="w-3 h-3" />
          {{ error }}
        </p>

        <!-- Submit Button -->
        <Button
          :label="mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'"
          class="bg-hust-red hover:bg-hust-red-hover text-white text-xs py-2.5 rounded-xl border-none shadow transition-colors w-full font-bold mt-1 cursor-pointer"
          @click="mode === 'login' ? handleEmailLogin() : handleSignUp()"
        />

        <!-- Switch Mode Link footer -->
        <div class="text-center text-xs text-tx-s mt-2 select-none">
          <template v-if="mode === 'login'">
            Chưa có tài khoản? <a href="#" class="text-hust-gold hover:underline font-semibold" @click.prevent="switchMode('signup')">Đăng ký ngay</a>
          </template>
          <template v-else>
            Đã có tài khoản? <a href="#" class="text-hust-gold hover:underline font-semibold" @click.prevent="switchMode('login')">Đăng nhập</a>
          </template>
        </div>
      </div>
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
