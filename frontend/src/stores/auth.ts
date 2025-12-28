import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserMe, LoginCredentials, RegisterCredentials, AuthResponse, AuthTokens } from '@/types'
import { apiService, tokenManager } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && tokenManager.hasTokens())
  const currentUser = computed(() => user.value)

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials)
      tokenManager.setTokens(response.data.tokens)
      user.value = response.data.user
    } catch (e) {
      error.value = (e as { message: string }).message || 'Login failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function register(credentials: RegisterCredentials): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.post<AuthResponse>('/auth/register', credentials)
      tokenManager.setTokens(response.data.tokens)
      user.value = response.data.user
    } catch (e) {
      error.value = (e as { message: string }).message || 'Registration failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout')
    } catch {
      // Ignore logout errors
    } finally {
      tokenManager.clearTokens()
      user.value = null
    }
  }

  async function fetchUser(): Promise<void> {
    if (!tokenManager.hasTokens()) {
      user.value = null
      return
    }

    try {
      const response = await apiService.get<UserMe>('/auth/me')
      user.value = response.data
    } catch {
      tokenManager.clearTokens()
      user.value = null
    }
  }

  async function refreshToken(): Promise<void> {
    const refreshTokenValue = tokenManager.getRefreshToken()
    if (!refreshTokenValue) {
      tokenManager.clearTokens()
      user.value = null
      return
    }

    try {
      const response = await apiService.post<AuthTokens>('/auth/refresh', {
        refresh_token: refreshTokenValue,
      })
      // The refresh endpoint returns only access_token and expires_in
      // We keep the existing refresh token
      tokenManager.setTokens({
        access_token: response.data.access_token,
        refresh_token: refreshTokenValue,
        expires_in: response.data.expires_in,
      })
    } catch {
      tokenManager.clearTokens()
      user.value = null
      throw new Error('Token refresh failed')
    }
  }

  async function initialize(): Promise<void> {
    if (tokenManager.hasTokens()) {
      await fetchUser()
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    currentUser,
    // Actions
    login,
    register,
    logout,
    fetchUser,
    refreshToken,
    initialize,
    clearError,
  }
})
