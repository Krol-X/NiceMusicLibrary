import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { apiService, tokenManager } from '@/services/api'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
  tokenManager: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    hasTokens: vi.fn(),
  },
}))

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  username: 'testuser',
  created_at: '2024-01-01T00:00:00Z',
}

const mockTokens = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
}

const mockAuthResponse = {
  user: mockUser,
  tokens: mockTokens,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with no user', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('starts with loading false', () => {
      const store = useAuthStore()
      expect(store.isLoading).toBe(false)
    })

    it('starts with no error', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when no user', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when user exists and has tokens', () => {
      const store = useAuthStore()
      store.user = mockUser
      vi.mocked(tokenManager.hasTokens).mockReturnValue(true)
      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when user exists but no tokens', () => {
      const store = useAuthStore()
      store.user = mockUser
      vi.mocked(tokenManager.hasTokens).mockReturnValue(false)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('successfully logs in user', async () => {
      vi.mocked(apiService.post).mockResolvedValueOnce({ data: mockAuthResponse })

      const store = useAuthStore()
      await store.login({ email: 'test@example.com', password: 'password123' })

      expect(apiService.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(tokenManager.setTokens).toHaveBeenCalledWith(mockTokens)
      expect(store.user).toEqual(mockUser)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets loading state during login', async () => {
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(apiService.post).mockReturnValueOnce(promise as never)

      const store = useAuthStore()
      const loginPromise = store.login({ email: 'test@example.com', password: 'password123' })

      expect(store.isLoading).toBe(true)

      resolvePromise!({ data: mockAuthResponse })
      await loginPromise

      expect(store.isLoading).toBe(false)
    })

    it('handles login error', async () => {
      const error = { message: 'Invalid credentials' }
      vi.mocked(apiService.post).mockRejectedValueOnce(error)

      const store = useAuthStore()

      await expect(
        store.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toEqual(error)

      expect(store.error).toBe('Invalid credentials')
      expect(store.user).toBeNull()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('successfully registers user', async () => {
      vi.mocked(apiService.post).mockResolvedValueOnce({ data: mockAuthResponse })

      const store = useAuthStore()
      await store.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123',
      })

      expect(apiService.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123',
      })
      expect(tokenManager.setTokens).toHaveBeenCalledWith(mockTokens)
      expect(store.user).toEqual(mockUser)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('handles registration error', async () => {
      const error = { message: 'Email already exists' }
      vi.mocked(apiService.post).mockRejectedValueOnce(error)

      const store = useAuthStore()

      await expect(
        store.register({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
        })
      ).rejects.toEqual(error)

      expect(store.error).toBe('Email already exists')
      expect(store.user).toBeNull()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('clears user and tokens on logout', async () => {
      vi.mocked(apiService.post).mockResolvedValueOnce({ data: {} })

      const store = useAuthStore()
      store.user = mockUser

      await store.logout()

      expect(apiService.post).toHaveBeenCalledWith('/auth/logout')
      expect(tokenManager.clearTokens).toHaveBeenCalled()
      expect(store.user).toBeNull()
    })

    it('clears tokens even if logout API fails', async () => {
      vi.mocked(apiService.post).mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()
      store.user = mockUser

      await store.logout()

      expect(tokenManager.clearTokens).toHaveBeenCalled()
      expect(store.user).toBeNull()
    })
  })

  describe('fetchUser', () => {
    it('fetches user when tokens exist', async () => {
      vi.mocked(tokenManager.hasTokens).mockReturnValue(true)
      vi.mocked(apiService.get).mockResolvedValueOnce({ data: mockUser })

      const store = useAuthStore()
      await store.fetchUser()

      expect(apiService.get).toHaveBeenCalledWith('/auth/me')
      expect(store.user).toEqual(mockUser)
    })

    it('clears user when no tokens', async () => {
      vi.mocked(tokenManager.hasTokens).mockReturnValue(false)

      const store = useAuthStore()
      store.user = mockUser

      await store.fetchUser()

      expect(apiService.get).not.toHaveBeenCalled()
      expect(store.user).toBeNull()
    })

    it('clears tokens on fetch error', async () => {
      vi.mocked(tokenManager.hasTokens).mockReturnValue(true)
      vi.mocked(apiService.get).mockRejectedValueOnce(new Error('Unauthorized'))

      const store = useAuthStore()
      await store.fetchUser()

      expect(tokenManager.clearTokens).toHaveBeenCalled()
      expect(store.user).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      vi.mocked(tokenManager.getRefreshToken).mockReturnValue('old-refresh-token')
      vi.mocked(apiService.post).mockResolvedValueOnce({
        data: { access_token: 'new-access-token', expires_in: 3600 },
      })

      const store = useAuthStore()
      await store.refreshToken()

      expect(apiService.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'old-refresh-token',
      })
      expect(tokenManager.setTokens).toHaveBeenCalledWith({
        access_token: 'new-access-token',
        refresh_token: 'old-refresh-token',
        expires_in: 3600,
      })
    })

    it('clears tokens when no refresh token', async () => {
      vi.mocked(tokenManager.getRefreshToken).mockReturnValue(null)

      const store = useAuthStore()
      store.user = mockUser

      await store.refreshToken()

      expect(apiService.post).not.toHaveBeenCalled()
      expect(tokenManager.clearTokens).toHaveBeenCalled()
      expect(store.user).toBeNull()
    })

    it('clears tokens on refresh error', async () => {
      vi.mocked(tokenManager.getRefreshToken).mockReturnValue('old-refresh-token')
      vi.mocked(apiService.post).mockRejectedValueOnce(new Error('Token expired'))

      const store = useAuthStore()
      store.user = mockUser

      await expect(store.refreshToken()).rejects.toThrow('Token refresh failed')

      expect(tokenManager.clearTokens).toHaveBeenCalled()
      expect(store.user).toBeNull()
    })
  })

  describe('initialize', () => {
    it('fetches user when tokens exist', async () => {
      vi.mocked(tokenManager.hasTokens).mockReturnValue(true)
      vi.mocked(apiService.get).mockResolvedValueOnce({ data: mockUser })

      const store = useAuthStore()
      await store.initialize()

      expect(apiService.get).toHaveBeenCalledWith('/auth/me')
      expect(store.user).toEqual(mockUser)
    })

    it('does nothing when no tokens', async () => {
      vi.mocked(tokenManager.hasTokens).mockReturnValue(false)

      const store = useAuthStore()
      await store.initialize()

      expect(apiService.get).not.toHaveBeenCalled()
      expect(store.user).toBeNull()
    })
  })

  describe('clearError', () => {
    it('clears the error', () => {
      const store = useAuthStore()
      store.error = 'Some error'
      store.clearError()
      expect(store.error).toBeNull()
    })
  })
})
