<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { AppLayout, AuthLayout } from '@/components/layout'
import { GlobalSearch } from '@/components/search'
import { PWAInstallPrompt } from '@/components/pwa'
import { KeyboardShortcutsModal } from '@/components/ui'
import { useKeyboard, useNetwork } from '@/composables'

// Initialize global keyboard shortcuts
useKeyboard()

// Initialize network status monitoring
useNetwork()

const route = useRoute()

const isAuthLayout = computed(() => route.meta?.layout === 'auth')
</script>

<template>
  <component :is="isAuthLayout ? AuthLayout : AppLayout">
    <RouterView />
  </component>
  <!-- Global search modal (rendered via Teleport) -->
  <GlobalSearch />
  <!-- PWA install prompt -->
  <PWAInstallPrompt />
  <!-- Keyboard shortcuts help modal -->
  <KeyboardShortcutsModal />
</template>
