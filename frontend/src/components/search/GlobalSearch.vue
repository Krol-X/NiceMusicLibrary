<script setup lang="ts">
/**
 * GlobalSearch Component
 *
 * This component should be included in the App.vue or main layout
 * to provide global search functionality via Cmd+K (Mac) / Ctrl+K (Windows).
 *
 * The actual search modal is rendered via Teleport to body.
 */

import SearchModal from './SearchModal.vue'
</script>

<template>
  <SearchModal />
</template>
