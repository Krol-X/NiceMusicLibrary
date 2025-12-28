<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from '@/components/ui/Button.vue'

const isOnline = ref(navigator.onLine)

function handleRetry() {
  window.location.reload()
}

onMounted(() => {
  window.addEventListener('online', () => {
    isOnline.value = true
    window.location.reload()
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
    <div class="text-center max-w-md">
      <!-- Offline icon -->
      <div class="mb-6 flex justify-center">
        <div class="rounded-full bg-bg-secondary p-6">
          <svg
            class="h-16 w-16 text-text-secondary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="mb-3 text-h1 text-text-primary">
        Вы офлайн
      </h1>

      <!-- Description -->
      <p class="mb-6 text-body text-text-secondary">
        Похоже, что вы потеряли подключение к интернету.
        Проверьте ваше соединение и попробуйте снова.
      </p>

      <!-- Music icon to keep the theme -->
      <div class="mb-8 flex justify-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-xl bg-accent-primary/10">
          <svg
            class="h-10 w-10 text-accent-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
            />
          </svg>
        </div>
      </div>

      <!-- What you can do section -->
      <div class="mb-8 text-left rounded-xl bg-bg-secondary p-4">
        <h3 class="mb-3 text-h3 text-text-primary">
          Что можно сделать:
        </h3>
        <ul class="space-y-2 text-small text-text-secondary">
          <li class="flex items-start gap-2">
            <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span>Слушать кэшированные треки</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span>Просматривать сохраненные плейлисты</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>Изменения синхронизируются при восстановлении связи</span>
          </li>
        </ul>
      </div>

      <!-- Retry button -->
      <Button
        variant="primary"
        size="lg"
        class="w-full"
        @click="handleRetry"
      >
        <svg
          class="mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Попробовать снова
      </Button>

      <!-- Status indicator -->
      <div class="mt-6 flex items-center justify-center gap-2 text-caption">
        <span
          :class="[
            'h-2 w-2 rounded-full',
            isOnline ? 'bg-accent-success' : 'bg-accent-error'
          ]"
        />
        <span class="text-text-muted">
          {{ isOnline ? 'Подключение восстановлено' : 'Нет подключения' }}
        </span>
      </div>
    </div>
  </div>
</template>
