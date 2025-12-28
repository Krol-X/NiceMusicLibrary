import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RegisterView from '@/pages/RegisterView.vue'

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

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock UI store
vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mountComponent = () => {
    return mount(RegisterView, {
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

  it('renders registration form', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('h1').text()).toContain('Create an account')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findAll('input').length).toBe(4)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('renders all required input fields', () => {
    const wrapper = mountComponent()

    const labels = wrapper.findAll('label')
    expect(labels.some(l => l.text() === 'Username')).toBe(true)
    expect(labels.some(l => l.text() === 'Email')).toBe(true)
    expect(labels.some(l => l.text() === 'Password')).toBe(true)
    expect(labels.some(l => l.text() === 'Confirm Password')).toBe(true)
  })

  it('shows validation error for empty username', async () => {
    const wrapper = mountComponent()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').exists()).toBe(true)
  })

  it('shows validation error for short username', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('ab')
    await inputs[1].setValue('test@example.com')
    await inputs[2].setValue('Password123')
    await inputs[3].setValue('Password123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('at least 3 characters')
  })

  it('shows validation error for invalid email', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('invalid-email')
    await inputs[2].setValue('Password123')
    await inputs[3].setValue('Password123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('valid email')
  })

  it('shows validation error for password mismatch', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('test@example.com')
    await inputs[2].setValue('Password123')
    await inputs[3].setValue('DifferentPassword')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('do not match')
  })

  it('shows validation error for short password', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('test@example.com')
    await inputs[2].setValue('123')
    await inputs[3].setValue('123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('at least 6 characters')
  })

  it('has link to login page', () => {
    const wrapper = mountComponent()

    const loginLink = wrapper.find('a[href="/login"]')
    expect(loginLink.exists()).toBe(true)
  })

  it('displays create account text on the form', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Create Account')
  })
})
