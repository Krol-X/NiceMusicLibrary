<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useRecommendationsStore } from '@/stores/recommendations'
import { usePlayerStore } from '@/stores/player'
import { useUiStore } from '@/stores/ui'
import type { Song, ArtistSearchResult, AlbumSearchResult, PlaylistSearchResult } from '@/types'
import SearchResults from './SearchResults.vue'

const router = useRouter()
const recommendationsStore = useRecommendationsStore()
const playerStore = usePlayerStore()
const uiStore = useUiStore()

const { searchResults, isSearching, searchError } = storeToRefs(recommendationsStore)
const { isSearchOpen } = storeToRefs(uiStore)

const searchInput = ref<HTMLInputElement | null>(null)
const searchResultsRef = ref<InstanceType<typeof SearchResults> | null>(null)
const query = ref('')
const selectedIndex = ref(-1)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const itemCount = computed(() => {
  if (!searchResults.value) return 0
  return (
    (searchResults.value.songs?.length ?? 0) +
    (searchResults.value.artists?.length ?? 0) +
    (searchResults.value.albums?.length ?? 0) +
    (searchResults.value.playlists?.length ?? 0)
  )
})

// Watch for modal open/close
watch(isSearchOpen, async (open) => {
  if (open) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    query.value = ''
    selectedIndex.value = -1
    recommendationsStore.clearSearch()
  }
})

// Debounced search
watch(query, (newQuery) => {
  selectedIndex.value = -1

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!newQuery.trim()) {
    recommendationsStore.clearSearch()
    return
  }

  debounceTimer = setTimeout(async () => {
    await recommendationsStore.search(newQuery.trim())
  }, 300)
})

function close() {
  uiStore.toggleSearch()
}

function handleOverlayClick() {
  close()
}

function handleKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowDown':
      event.preventDefault()
      if (itemCount.value > 0) {
        selectedIndex.value = (selectedIndex.value + 1) % itemCount.value
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (itemCount.value > 0) {
        selectedIndex.value = selectedIndex.value <= 0 ? itemCount.value - 1 : selectedIndex.value - 1
      }
      break
    case 'Enter':
      event.preventDefault()
      handleEnter()
      break
  }
}

function handleEnter() {
  if (selectedIndex.value < 0 || !searchResults.value) return

  const flatItems = getFlatItems()
  const item = flatItems[selectedIndex.value]
  if (!item) return

  switch (item.type) {
    case 'song':
      handleSelectSong(item.data as Song)
      break
    case 'artist':
      handleSelectArtist(item.data as ArtistSearchResult)
      break
    case 'album':
      handleSelectAlbum(item.data as AlbumSearchResult)
      break
    case 'playlist':
      handleSelectPlaylist(item.data as PlaylistSearchResult)
      break
  }
}

function getFlatItems() {
  const items: Array<{
    type: 'song' | 'artist' | 'album' | 'playlist'
    data: Song | ArtistSearchResult | AlbumSearchResult | PlaylistSearchResult
  }> = []

  if (searchResults.value?.songs) {
    for (const song of searchResults.value.songs) {
      items.push({ type: 'song', data: song })
    }
  }
  if (searchResults.value?.artists) {
    for (const artist of searchResults.value.artists) {
      items.push({ type: 'artist', data: artist })
    }
  }
  if (searchResults.value?.albums) {
    for (const album of searchResults.value.albums) {
      items.push({ type: 'album', data: album })
    }
  }
  if (searchResults.value?.playlists) {
    for (const playlist of searchResults.value.playlists) {
      items.push({ type: 'playlist', data: playlist })
    }
  }

  return items
}

function handleSelectSong(song: Song) {
  playerStore.play(song)
  close()
}

function handlePlaySong(song: Song) {
  playerStore.play(song)
  close()
}

function handleSelectArtist(artist: ArtistSearchResult) {
  // Navigate to library with artist filter
  router.push({ name: 'library', query: { artist: artist.name } })
  close()
}

function handleSelectAlbum(album: AlbumSearchResult) {
  // Navigate to library with album filter
  router.push({ name: 'library', query: { album: album.name } })
  close()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSelectPlaylist(playlist: PlaylistSearchResult) {
  // For now, just close - playlists page not yet implemented
  close()
}

// Global keyboard listener for Cmd+K
function handleGlobalKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    uiStore.toggleSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-fast"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-fast"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSearchOpen"
        class="fixed inset-0 z-50 flex items-start justify-center pt-20"
        @keydown="handleKeyDown"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleOverlayClick"
        />

        <!-- Search Modal -->
        <Transition
          enter-active-class="transition-all duration-fast"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-fast"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isSearchOpen"
            class="relative w-full max-w-xl rounded-xl bg-bg-primary shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <!-- Search input -->
            <div class="flex items-center border-b border-bg-tertiary px-4">
              <svg
                class="h-5 w-5 text-text-muted"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                ref="searchInput"
                v-model="query"
                type="text"
                class="flex-1 bg-transparent px-3 py-4 text-text-primary placeholder-text-muted focus:outline-none"
                placeholder="Search songs, artists, albums..."
                aria-label="Search"
              >
              <button
                type="button"
                class="rounded p-1 text-text-muted hover:bg-bg-secondary hover:text-text-primary transition-colors"
                aria-label="Close search"
                @click="close"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Results -->
            <SearchResults
              v-if="query.trim()"
              ref="searchResultsRef"
              :results="searchResults"
              :is-loading="isSearching"
              :selected-index="selectedIndex"
              @select-song="handleSelectSong"
              @play-song="handlePlaySong"
              @select-artist="handleSelectArtist"
              @select-album="handleSelectAlbum"
              @select-playlist="handleSelectPlaylist"
            />

            <!-- Error state -->
            <div
              v-if="searchError && query.trim()"
              class="p-4 text-center text-accent-error"
            >
              {{ searchError }}
            </div>

            <!-- Keyboard hints -->
            <div class="flex items-center justify-between border-t border-bg-tertiary px-4 py-2 text-caption text-text-muted">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <kbd class="rounded border border-bg-tertiary bg-bg-secondary px-1.5 py-0.5">↑</kbd>
                  <kbd class="rounded border border-bg-tertiary bg-bg-secondary px-1.5 py-0.5">↓</kbd>
                  to navigate
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="rounded border border-bg-tertiary bg-bg-secondary px-1.5 py-0.5">Enter</kbd>
                  to select
                </span>
              </div>
              <span class="flex items-center gap-1">
                <kbd class="rounded border border-bg-tertiary bg-bg-secondary px-1.5 py-0.5">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
