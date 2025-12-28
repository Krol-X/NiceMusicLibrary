import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import LoginView from '@/pages/LoginView.vue'

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

// Mock router
const mockPush = vi.fn()
const mockRoute = ref({
  query: {},
})

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => mockRoute.value,
}))

// Mock UI store
vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.value = { query: {} }
  })

  const mountComponent = () => {
    return mount(LoginView, {
      global: {
        stubs: {
          Button: {
            template: '<button :type="type" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
            props: ['type', 'variant', 'loading', 'disabled', 'fullWidth'],
          },
          Input: {
            template: `
              <div>
                <label v-if="label">{{ label }}</label>
                <input
                  :type="type"
                  :value="modelValue"
                  :disabled="disabled"
                  :placeholder="placeholder"
                  @input="$emit('update:modelValue', $event.target.value)"
                />
                <span v-if="error" class="error">{{ error }}</span>
              </div>
            `,
            props: ['modelValue', 'type', 'label', 'placeholder', 'error', 'disabled'],
            emits: ['update:modelValue'],
          },
          RouterLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
  }

  it('renders login form', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('h1').text()).toContain('Welcome back')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findAll('input').length).toBe(2)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('renders email and password input fields', () => {
    const wrapper = mountComponent()

    const labels = wrapper.findAll('label')
    expect(labels.some(l => l.text() === 'Email')).toBe(true)
    expect(labels.some(l => l.text() === 'Password')).toBe(true)
  })

  it('shows validation error for empty email', async () => {
    const wrapper = mountComponent()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').exists()).toBe(true)
  })

  it('shows validation error for invalid email format', async () => {
    const wrapper = mountComponent()

    const emailInput = wrapper.findAll('input')[0]
    await emailInput.setValue('invalid-email')

    const passwordInput = wrapper.findAll('input')[1]
    await passwordInput.setValue('password123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('valid email')
  })

  it('shows validation error for short password', async () => {
    const wrapper = mountComponent()

    const emailInput = wrapper.findAll('input')[0]
    await emailInput.setValue('test@example.com')

    const passwordInput = wrapper.findAll('input')[1]
    await passwordInput.setValue('123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('at least 6 characters')
  })

  it('has link to registration page', () => {
    const wrapper = mountComponent()

    const registerLink = wrapper.find('a[href="/register"]')
    expect(registerLink.exists()).toBe(true)
  })

  it('displays sign in text on the form', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Sign In')
  })
})
