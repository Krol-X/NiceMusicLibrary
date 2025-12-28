<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecommendationsStore } from '@/stores/recommendations'
import type { Song } from '@/types'
import RecommendationCard from './RecommendationCard.vue'
import { Loader } from '@/components/ui'

export interface SimilarSongsProps {
  songId: string
  currentSongId?: string | null
}

const props = withDefaults(defineProps<SimilarSongsProps>(), {
  currentSongId: null,
})

const emit = defineEmits<{
  playSong: [song: Song]
  clickSong: [song: Song]
}>()

const recommendationsStore = useRecommendationsStore()
const { similarError } = storeToRefs(recommendationsStore)

const isLoading = computed(() => recommendationsStore.isLoadingSimilar(props.songId))
const similarItems = computed(() => recommendationsStore.getSimilarSongs(props.songId))
const isEmpty = computed(() => similarItems.value.length === 0 && !isLoading.value)

// Create a map of song ID to reason for display
const reasonsMap = computed(() => {
  const map: Record<string, string> = {}
  for (const item of similarItems.value) {
    if (item.reasons.length > 0) {
      map[item.song.id] = item.reasons[0]
    }
  }
  return map
})

const songs = computed(() => similarItems.value.map((item) => item.song))

onMounted(async () => {
  if (similarItems.value.length === 0) {
    await recommendationsStore.fetchSimilar(props.songId)
  }
})

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
    <div class="mb-3 flex items-center gap-2">
      <svg
        class="h-5 w-5 text-text-secondary"
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
      <h2 class="text-h3 text-text-primary">Similar Songs</h2>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex h-32 items-center justify-center"
    >
      <Loader size="md" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="similarError"
      class="flex h-32 items-center justify-center rounded-lg border border-dashed border-accent-error/30"
    >
      <p class="text-text-muted">{{ similarError }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="isEmpty"
      class="flex h-32 items-center justify-center rounded-lg border border-dashed border-bg-tertiary"
    >
      <p class="text-text-muted">No similar songs found</p>
    </div>

    <!-- Songs grid -->
    <div
      v-else
      class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-bg-tertiary"
    >
      <RecommendationCard
        v-for="song in songs"
        :key="song.id"
        :song="song"
        :is-playing="currentSongId === song.id"
        show-reason
        :reason="reasonsMap[song.id]"
        @play="handlePlay"
        @click="handleClick"
      />
    </div>
  </section>
</template>
