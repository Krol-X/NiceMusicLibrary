import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import App from '../App.vue'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock useRoute
const mockRoute = ref({
  meta: {},
  path: '/',
  name: 'home',
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  RouterView: { template: '<div class="router-view"></div>' },
}))

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.value = { meta: {}, path: '/', name: 'home' }
  })

  it('renders properly', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: true,
          AppLayout: true,
          AuthLayout: true,
          GlobalSearch: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('uses AppLayout component for non-auth routes', () => {
    mockRoute.value = { meta: {}, path: '/', name: 'home' }
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: true,
          AppLayout: {
            template: '<div class="app-layout"><slot /></div>',
          },
          AuthLayout: {
            template: '<div class="auth-layout"><slot /></div>',
          },
          GlobalSearch: true,
        },
      },
    })
    expect(wrapper.find('.app-layout').exists()).toBe(true)
    expect(wrapper.find('.auth-layout').exists()).toBe(false)
  })

  it('uses AuthLayout component for auth routes', () => {
    mockRoute.value = { meta: { layout: 'auth' }, path: '/login', name: 'login' }
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: true,
          AppLayout: {
            template: '<div class="app-layout"><slot /></div>',
          },
          AuthLayout: {
            template: '<div class="auth-layout"><slot /></div>',
          },
          GlobalSearch: true,
        },
      },
    })
    expect(wrapper.find('.auth-layout').exists()).toBe(true)
    expect(wrapper.find('.app-layout').exists()).toBe(false)
  })
})
