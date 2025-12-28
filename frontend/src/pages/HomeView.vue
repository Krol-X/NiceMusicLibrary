<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRecommendationsStore } from '@/stores/recommendations'
import { usePlayerStore } from '@/stores/player'
import { useLibraryStore } from '@/stores/library'
import { useStatsStore } from '@/stores/stats'
import { Loader } from '@/components/ui'
import { RecommendationSection, PersonalMixCard } from '@/components/recommendations'
import type { Song } from '@/types'

const authStore = useAuthStore()
const recommendationsStore = useRecommendationsStore()
const playerStore = usePlayerStore()
const libraryStore = useLibraryStore()
const statsStore = useStatsStore()

const { isAuthenticated, currentUser } = storeToRefs(authStore)
const { discoverSections, isLoadingDiscover, discoverError } = storeToRefs(recommendationsStore)
const { currentTrack, isPlaying } = storeToRefs(playerStore)
const { total: trackCount } = storeToRefs(libraryStore)
const { overview } = storeToRefs(statsStore)

const healthStatus = ref<string>('checking...')
const isHealthLoading = ref(true)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const currentSongId = computed(() =>
  isPlaying.value && currentTrack.value ? currentTrack.value.id : null
)

const totalHours = computed(() => {
  if (!overview.value) return '--'
  return Math.round(overview.value.total_duration_seconds / 3600)
})

// Get individual section data
const longTimeNoListen = computed(() =>
  discoverSections.value.find((s) => s.type === 'long_time_no_listen')
)

const basedOnFavorite = computed(() =>
  discoverSections.value.find((s) => s.type === 'based_on_favorite')
)

const hiddenGems = computed(() =>
  discoverSections.value.find((s) => s.type === 'hidden_gems')
)

onMounted(async () => {
  // Health check
  try {
    const response = await fetch('/api/v1/health')
    const data = await response.json()
    healthStatus.value = data.status
  } catch {
    healthStatus.value = 'unavailable'
  } finally {
    isHealthLoading.value = false
  }

  // Fetch data if authenticated
  if (isAuthenticated.value) {
    // Load recommendations
    recommendationsStore.fetchDiscover().catch(() => {
      // Error is stored in the store, no need to handle here
    })

    // Load library stats (track count)
    if (trackCount.value === 0) {
      libraryStore.fetchSongs(true).catch(() => {})
    }

    // Load listening stats
    if (!overview.value) {
      statsStore.fetchOverview().catch(() => {})
    }
  }
})

function handlePlaySong(song: Song) {
  playerStore.play(song)
}

function handleClickSong(song: Song) {
  // For now, just play the song
  playerStore.play(song)
}
</script>

<template>
  <div class="animate-fade-in">
    <!-- Hero Section -->
    <div class="mb-8">
      <h1 class="text-h1 text-text-primary mb-2">
        <template v-if="isAuthenticated">
          {{ greeting }}, {{ currentUser?.username || 'User' }}!
        </template>
        <template v-else>
          Welcome to NiceMusicLibrary
        </template>
      </h1>
      <p class="text-text-secondary">
        <template v-if="isAuthenticated">
          What would you like to listen to today?
        </template>
        <template v-else>
          Your personal music library with mood chains
        </template>
      </p>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10">
            <svg
              class="h-5 w-5 text-accent-primary"
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
          <div>
            <p class="text-caption text-text-muted">Tracks</p>
            <p class="text-h3 text-text-primary">{{ trackCount || '--' }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-secondary/10">
            <svg
              class="h-5 w-5 text-accent-secondary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
          </div>
          <div>
            <p class="text-caption text-text-muted">Playlists</p>
            <p class="text-h3 text-text-primary">--</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-success/10">
            <svg
              class="h-5 w-5 text-accent-success"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-caption text-text-muted">Hours Listened</p>
            <p class="text-h3 text-text-primary">{{ totalHours }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal Mix Card (for authenticated users) -->
    <div
      v-if="isAuthenticated"
      class="mb-8"
    >
      <PersonalMixCard />
    </div>

    <!-- Recommendations Sections (for authenticated users) -->
    <template v-if="isAuthenticated">
      <!-- Loading state -->
      <div
        v-if="isLoadingDiscover && discoverSections.length === 0"
        class="flex h-48 items-center justify-center"
      >
        <Loader size="lg" />
      </div>

      <!-- Error state -->
      <div
        v-else-if="discoverError && discoverSections.length === 0"
        class="mb-8 rounded-lg border border-dashed border-accent-error/30 p-8 text-center"
      >
        <p class="text-text-muted">{{ discoverError }}</p>
      </div>

      <!-- Recommendations sections -->
      <template v-else>
        <!-- Long Time No Listen -->
        <RecommendationSection
          v-if="longTimeNoListen && longTimeNoListen.items.length > 0"
          :title="longTimeNoListen.title"
          :songs="longTimeNoListen.items"
          :current-song-id="currentSongId"
          @play-song="handlePlaySong"
          @click-song="handleClickSong"
        />

        <!-- Based on Favorite -->
        <RecommendationSection
          v-if="basedOnFavorite && basedOnFavorite.items.length > 0"
          :title="basedOnFavorite.title"
          :songs="basedOnFavorite.items"
          :current-song-id="currentSongId"
          @play-song="handlePlaySong"
          @click-song="handleClickSong"
        />

        <!-- Hidden Gems -->
        <RecommendationSection
          v-if="hiddenGems && hiddenGems.items.length > 0"
          :title="hiddenGems.title"
          :songs="hiddenGems.items"
          :current-song-id="currentSongId"
          @play-song="handlePlaySong"
          @click-song="handleClickSong"
        />
      </template>
    </template>

    <!-- API Status (moved to bottom) -->
    <div class="card max-w-md mt-8">
      <h2 class="text-h3 text-text-primary mb-4">System Status</h2>
      <div class="flex items-center gap-3">
        <Loader
          v-if="isHealthLoading"
          size="sm"
        />
        <template v-else>
          <div
            :class="[
              'h-3 w-3 rounded-full',
              healthStatus === 'healthy' ? 'bg-accent-success' : 'bg-accent-error',
            ]"
          />
          <span class="text-small text-text-secondary">
            API:
            <span
              :class="[
                'font-medium',
                healthStatus === 'healthy' ? 'text-accent-success' : 'text-accent-error',
              ]"
            >
              {{ healthStatus }}
            </span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
