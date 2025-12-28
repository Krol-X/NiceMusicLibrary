<script setup lang="ts">
import { computed } from 'vue'
import type { Song } from '@/types'
import { formatDuration, getCoverUrl } from '@/services/songs'

export interface RecommendationCardProps {
  song: Song
  isPlaying?: boolean
  showReason?: boolean
  reason?: string
}

const props = withDefaults(defineProps<RecommendationCardProps>(), {
  isPlaying: false,
  showReason: false,
  reason: undefined,
})

const emit = defineEmits<{
  click: [song: Song]
  play: [song: Song]
}>()

const duration = computed(() => formatDuration(props.song.duration_seconds))
const coverUrl = computed(() =>
  props.song.cover_art_path ? getCoverUrl(props.song.id) : null
)

function handleClick() {
  emit('click', props.song)
}

function handlePlay(event: MouseEvent) {
  event.stopPropagation()
  emit('play', props.song)
}
</script>

<template>
  <div
    :class="[
      'group relative cursor-pointer rounded-lg p-3 transition-all duration-fast',
      'bg-bg-secondary hover:bg-bg-tertiary hover:shadow-md',
      'w-40 flex-shrink-0',
    ]"
    @click="handleClick"
  >
    <!-- Cover art -->
    <div class="relative mb-3 aspect-square overflow-hidden rounded-md bg-bg-tertiary">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="song.title"
        class="h-full w-full object-cover transition-transform duration-normal group-hover:scale-105"
        loading="lazy"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
      >
        <svg
          class="h-10 w-10 text-text-muted"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
          />
        </svg>
      </div>

      <!-- Play button overlay -->
      <div
        class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-fast group-hover:opacity-100"
      >
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Play"
          @click="handlePlay"
        >
          <svg
            class="h-5 w-5 translate-x-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Playing indicator -->
      <div
        v-if="isPlaying"
        class="absolute bottom-2 right-2 flex items-center gap-0.5 rounded bg-accent-primary px-1.5 py-0.5"
      >
        <span class="inline-block h-2 w-0.5 animate-pulse bg-white" />
        <span class="inline-block h-3 w-0.5 animate-pulse bg-white" style="animation-delay: 150ms" />
        <span class="inline-block h-2 w-0.5 animate-pulse bg-white" style="animation-delay: 300ms" />
      </div>
    </div>

    <!-- Info -->
    <div class="min-w-0">
      <p
        :class="[
          'truncate text-small font-medium',
          isPlaying ? 'text-accent-primary' : 'text-text-primary',
        ]"
        :title="song.title"
      >
        {{ song.title }}
      </p>
      <p
        class="truncate text-caption text-text-secondary"
        :title="song.artist || 'Unknown Artist'"
      >
        {{ song.artist || 'Unknown Artist' }}
      </p>
      <p
        v-if="showReason && reason"
        class="mt-1 truncate text-caption text-text-muted"
        :title="reason"
      >
        {{ reason }}
      </p>
      <p
        v-else
        class="mt-1 text-caption text-text-muted"
      >
        {{ duration }}
      </p>
    </div>
  </div>
</template>
