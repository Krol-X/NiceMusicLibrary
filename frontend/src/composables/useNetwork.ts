import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export function useNetwork() {
  const isOnline = ref(navigator.onLine)
  const router = useRouter()

  function handleOnline() {
    isOnline.value = true
  }

  function handleOffline() {
    isOnline.value = false
    // Only redirect if not already on offline page
    if (router.currentRoute.value.name !== 'offline') {
      router.push({ name: 'offline' })
    }
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial state
    if (!navigator.onLine) {
      handleOffline()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline
  }
}
