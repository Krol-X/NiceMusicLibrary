<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Button from '@/components/ui/Button.vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const showPrompt = ref(false)
const isIOS = ref(false)
const isStandalone = ref(false)

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e as BeforeInstallPromptEvent

  // Check if user has dismissed the prompt recently
  const dismissed = localStorage.getItem(DISMISSED_KEY)
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10)
    if (Date.now() - dismissedTime < DISMISSED_DURATION) {
      return
    }
  }

  showPrompt.value = true
}

async function handleInstall() {
  if (!deferredPrompt.value) return

  await deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === 'accepted') {
    showPrompt.value = false
  }

  deferredPrompt.value = null
}

function handleDismiss() {
  showPrompt.value = false
  localStorage.setItem(DISMISSED_KEY, Date.now().toString())
}

function checkIOSInstallability() {
  const ua = window.navigator.userAgent
  isIOS.value = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  checkIOSInstallability()

  // Show iOS prompt if applicable
  if (isIOS.value && !isStandalone.value) {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed || Date.now() - parseInt(dismissed, 10) >= DISMISSED_DURATION) {
      showPrompt.value = true
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="showPrompt && !isStandalone"
        class="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up"
      >
        <div class="rounded-2xl bg-bg-secondary p-4 shadow-lg ring-1 ring-bg-tertiary">
          <div class="flex items-start gap-4">
            <!-- App Icon -->
            <div class="flex-shrink-0">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary">
                <svg
                  class="h-7 w-7 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                  />
                </svg>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-body font-semibold text-text-primary">
                Установите NiceMusic
              </h3>
              <p class="mt-1 text-small text-text-secondary">
                {{ isIOS
                  ? 'Нажмите "Поделиться" и затем "На экран Домой"'
                  : 'Добавьте приложение на главный экран для быстрого доступа'
                }}
              </p>
            </div>

            <!-- Close button -->
            <button
              type="button"
              class="flex-shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-tertiary hover:text-text-secondary transition-colors"
              aria-label="Close"
              @click="handleDismiss"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              class="flex-1"
              @click="handleDismiss"
            >
              Не сейчас
            </Button>
            <Button
              v-if="!isIOS"
              variant="primary"
              size="sm"
              class="flex-1"
              @click="handleInstall"
            >
              <svg
                class="mr-1.5 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Установить
            </Button>
          </div>

          <!-- iOS Instructions -->
          <div
            v-if="isIOS"
            class="mt-4 flex items-center gap-3 rounded-lg bg-bg-tertiary p-3"
          >
            <div class="flex items-center gap-2 text-caption text-text-secondary">
              <span class="font-medium">1.</span>
              <svg class="h-5 w-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Поделиться</span>
            </div>
            <svg class="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <div class="flex items-center gap-2 text-caption text-text-secondary">
              <span class="font-medium">2.</span>
              <svg class="h-5 w-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>На экран Домой</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
