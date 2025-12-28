<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { AppLayout, AuthLayout } from '@/components/layout'
import { GlobalSearch } from '@/components/search'
import { useKeyboard } from '@/composables'

// Initialize global keyboard shortcuts
useKeyboard()

const route = useRoute()

const isAuthLayout = computed(() => route.meta?.layout === 'auth')
</script>

<template>
  <component :is="isAuthLayout ? AuthLayout : AppLayout">
    <RouterView />
  </component>
  <!-- Global search modal (rendered via Teleport) -->
  <GlobalSearch />
</template>
