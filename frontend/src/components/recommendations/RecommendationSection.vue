<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Song } from '@/types'
import RecommendationCard from './RecommendationCard.vue'
import { Loader } from '@/components/ui'

export interface RecommendationSectionProps {
  title: string
  songs: Song[]
  isLoading?: boolean
  showReason?: boolean
  reasons?: Record<string, string>
  currentSongId?: string | null
}

const props = withDefaults(defineProps<RecommendationSectionProps>(), {
  isLoading: false,
  showReason: false,
  reasons: () => ({}),
  currentSongId: null,
})

const emit = defineEmits<{
  playSong: [song: Song]
  clickSong: [song: Song]
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

const isEmpty = computed(() => props.songs.length === 0 && !props.isLoading)

function updateScrollButtons() {
  if (!scrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 10
}

function scrollLeft() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
}

function scrollRight() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
}

function handlePlay(song: Song) {
  emit('playSong', song)
}

function handleClick(song: Song) {
  emit('clickSong', song)
}
</script>

<template>
  <section class="mb-6">
    <!-- Section header -->
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-h3 text-text-primary">{{ title }}</h2>
      <div
        v-if="songs.length > 4"
        class="flex gap-1"
      >
        <button
          type="button"
          :disabled="!canScrollLeft"
          class="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Scroll left"
          @click="scrollLeft"
        >
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <button
          type="button"
          :disabled="!canScrollRight"
          class="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Scroll right"
          @click="scrollRight"
        >
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex h-48 items-center justify-center"
    >
      <Loader size="lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="isEmpty"
      class="flex h-48 items-center justify-center rounded-lg border border-dashed border-bg-tertiary"
    >
      <p class="text-text-muted">No songs in this section</p>
    </div>

    <!-- Songs scroll container -->
    <div
      v-else
      ref="scrollContainer"
      class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-bg-tertiary"
      @scroll="updateScrollButtons"
    >
      <RecommendationCard
        v-for="song in songs"
        :key="song.id"
        :song="song"
        :is-playing="currentSongId === song.id"
        :show-reason="showReason"
        :reason="reasons[song.id]"
        @play="handlePlay"
        @click="handleClick"
      />
    </div>
  </section>
</template>
