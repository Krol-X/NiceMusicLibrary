<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  rounded: 'md',
  animate: true,
})

const roundedClasses: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}
</script>

<template>
  <div
    :class="[
      'bg-bg-tertiary',
      roundedClasses[rounded],
      animate && 'animate-pulse'
    ]"
    :style="{ width, height }"
  />
</template>
