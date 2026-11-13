import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginUser, registerUser, setUnauthorizedHandler } from '../services/apiService'
import type { RegisterRequest, LoginRequest, AuthData } from '../types/api'

export interface UserProfile {
  fullName: string
  email: string
  username: string
  userId?: number
  authMethod: 'credentials' | 'google' | 'phone' | 'email'
  avatarUrl?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const userId = ref<number | null>(
    localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null
  )
  const username = ref<string | null>(localStorage.getItem('username'))
  const userEmail = ref<string | null>(localStorage.getItem('userEmail'))
  const isAuthModalOpen = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const authError = ref<string | null>(null)

  // Verify token expiry on init
  const tokenExpiresAt = localStorage.getItem('tokenExpiresAt')
  if (tokenExpiresAt && Date.now() > Number(tokenExpiresAt)) {
    clearStorage()
  }

  const isLoggedIn = computed<boolean>(() => !!token.value)

  const profile = computed<UserProfile | null>(() => {
    if (!token.value && !username.value) return null
    const name = username.value || 'User'
    const mail = userEmail.value || (username.value ? `${username.value}@hust.edu.vn` : 'user@hust.edu.vn')
    return {
      fullName: name,
      username: name,
      email: mail,
      userId: userId.value ?? undefined,
      authMethod: 'credentials',
    }
  })

  function saveAuthSession(data: AuthData, emailParam?: string) {
    token.value = data.accessToken
    userId.value = data.userId
    username.value = data.username
    if (emailParam) {
      userEmail.value = emailParam
      localStorage.setItem('userEmail', emailParam)
    }

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('userId', String(data.userId))
    localStorage.setItem('username', data.username)

    if (data.expiresInMs) {
      const expiresAt = Date.now() + data.expiresInMs
      localStorage.setItem('tokenExpiresAt', String(expiresAt))
    }
  }

  function clearStorage() {
    token.value = null
    userId.value = null
    username.value = null
    userEmail.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('tokenExpiresAt')
    localStorage.removeItem('hust_chat_user_session')
  }

  /**
   * 1. Login with username & password via /api/v1/auth/login
   */
  async function login(credentials: LoginRequest): Promise<AuthData> {
    isLoading.value = true
    authError.value = null
    try {
      const res = await loginUser(credentials)
      saveAuthSession(res)
      isAuthModalOpen.value = false
      return res
    } catch (err: any) {
      authError.value = err?.message || 'Đăng nhập không thành công'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 2. Register account via /api/v1/auth/register
   */
  async function register(payload: RegisterRequest): Promise<AuthData> {
    isLoading.value = true
    authError.value = null
    try {
      const res = await registerUser(payload)
      saveAuthSession(res, payload.email)
      isAuthModalOpen.value = false
      return res
    } catch (err: any) {
      authError.value = err?.message || 'Đăng ký không thành công'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 3. Logout user and clear tokens
   */
  function logout() {
    clearStorage()
  }

  /**
   * 4. Auto handle 401 Unauthorized
   */
  function handleUnauthorized() {
    clearStorage()
    authError.value = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
    isAuthModalOpen.value = true
  }

  // Register unauthorized hook with API service
  setUnauthorizedHandler(() => {
    handleUnauthorized()
  })

  // Simulated fallback methods (for UI compatibility)
  function loginWithEmail(email: string, name?: string) {
    const defaultUsername = name?.trim() || email.split('@')[0] || 'user'
    token.value = 'mock_jwt_' + Date.now()
    username.value = defaultUsername
    userEmail.value = email
    userId.value = 1
    localStorage.setItem('accessToken', token.value)
    localStorage.setItem('userId', '1')
    localStorage.setItem('username', defaultUsername)
    localStorage.setItem('userEmail', email)
  }

  function loginWithGoogle() {
    token.value = 'mock_google_jwt_' + Date.now()
    username.value = 'hust.student'
    userEmail.value = 'student@hust.edu.vn'
    userId.value = 2
    localStorage.setItem('accessToken', token.value)
    localStorage.setItem('userId', '2')
    localStorage.setItem('username', 'hust.student')
    localStorage.setItem('userEmail', 'student@hust.edu.vn')
  }

  function loginWithPhone(phone: string) {
    const phoneUser = `user_${phone.substring(phone.length - 4)}`
    token.value = 'mock_phone_jwt_' + Date.now()
    username.value = phoneUser
    userEmail.value = `${phone}@phone.hust.vn`
    userId.value = 3
    localStorage.setItem('accessToken', token.value)
    localStorage.setItem('userId', '3')
    localStorage.setItem('username', phoneUser)
    localStorage.setItem('userEmail', `${phone}@phone.hust.vn`)
  }

  return {
    token,
    userId,
    username,
    userEmail,
    isLoggedIn,
    profile,
    isAuthModalOpen,
    isLoading,
    authError,
    login,
    register,
    logout,
    handleUnauthorized,
    loginWithEmail,
    loginWithGoogle,
    loginWithPhone,
  }
})
