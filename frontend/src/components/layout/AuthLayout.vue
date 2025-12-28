<script setup lang="ts">
import { ToastContainer } from '@/components/ui'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg-primary">
    <header class="flex items-center justify-center py-8">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary">
          <svg
            class="h-5 w-5 text-white"
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
        <span class="text-h3 font-bold text-text-primary">NiceMusicLibrary</span>
      </div>
    </header>
    <main class="flex flex-1 items-center justify-center px-4 pb-16">
      <slot />
    </main>
    <ToastContainer />
  </div>
</template>
