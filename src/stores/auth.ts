import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserProfile {
  fullName: string
  email: string
  phone?: string
  authMethod: 'email' | 'google' | 'phone'
  avatarUrl?: string
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean>(false)
  const profile = ref<UserProfile | null>(null)

  // Try to load initial session from localStorage
  const storedAuth = localStorage.getItem('hust_chat_user_session')
  if (storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth)
      isLoggedIn.value = parsed.isLoggedIn
      profile.value = parsed.profile
    } catch (e) {
      console.error('Failed to parse stored auth session', e)
    }
  }

  function loginWithEmail(email: string, name?: string) {
    profile.value = {
      fullName: name?.trim() || email.split('@')[0] || 'User',
      email: email.trim().toLowerCase(),
      authMethod: 'email',
    }
    isLoggedIn.value = true
    saveSession()
  }

  function loginWithGoogle() {
    profile.value = {
      fullName: 'HUST Guest (Google)',
      email: 'guest.hust@gmail.com',
      authMethod: 'google',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    }
    isLoggedIn.value = true
    saveSession()
  }

  function loginWithPhone(phone: string) {
    profile.value = {
      fullName: `User ${phone.substring(phone.length - 4)}`,
      email: `${phone.trim()}@phone.hust.vn`,
      phone: phone.trim(),
      authMethod: 'phone',
    }
    isLoggedIn.value = true
    saveSession()
  }

  function logout() {
    isLoggedIn.value = false
    profile.value = null
    localStorage.removeItem('hust_chat_user_session')
  }

  function saveSession() {
    localStorage.setItem(
      'hust_chat_user_session',
      JSON.stringify({
        isLoggedIn: isLoggedIn.value,
        profile: profile.value,
      })
    )
  }

  return {
    isLoggedIn,
    profile,
    loginWithEmail,
    loginWithGoogle,
    loginWithPhone,
    logout,
  }
})
