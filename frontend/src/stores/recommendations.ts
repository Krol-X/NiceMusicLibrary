/**
 * Recommendations Store (Pinia)
 *
 * Manages the recommendations state including:
 * - Discovery sections (home page)
 * - Similar songs for a track
 * - Personal mix generation
 * - Global search results
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Song,
  DiscoverSection,
  SimilarSongItem,
  SearchResponse,
  MoodType,
  SearchType,
} from '@/types'
import { recommendationsService, type MixParams } from '@/services/recommendations'

export const useRecommendationsStore = defineStore('recommendations', () => {
  // State - Discovery
  const discoverSections = ref<DiscoverSection[]>([])
  const isLoadingDiscover = ref(false)
  const discoverError = ref<string | null>(null)

  // State - Similar songs (keyed by songId)
  const similarSongsMap = ref<Record<string, SimilarSongItem[]>>({})
  const loadingSimilarFor = ref<string | null>(null)
  const similarError = ref<string | null>(null)

  // State - Personal mix
  const personalMixSongs = ref<Song[]>([])
  const personalMixDuration = ref(0)
  const personalMixMood = ref<MoodType | null>(null)
  const isLoadingMix = ref(false)
  const mixError = ref<string | null>(null)

  // State - Search
  const searchQuery = ref('')
  const searchResults = ref<SearchResponse | null>(null)
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)

  // Getters
  const hasDiscoverSections = computed(() => discoverSections.value.length > 0)

  const longTimeNoListen = computed(() =>
    discoverSections.value.find((s) => s.type === 'long_time_no_listen')?.items ?? []
  )

  const basedOnFavorite = computed(() =>
    discoverSections.value.find((s) => s.type === 'based_on_favorite')?.items ?? []
  )

  const hiddenGems = computed(() =>
    discoverSections.value.find((s) => s.type === 'hidden_gems')?.items ?? []
  )

  const isLoading = computed(() =>
    isLoadingDiscover.value ||
    loadingSimilarFor.value !== null ||
    isLoadingMix.value ||
    isSearching.value
  )

  // Actions

  /**
   * Fetch discovery recommendations for the home page
   */
  async function fetchDiscover(limit: number = 10): Promise<void> {
    isLoadingDiscover.value = true
    discoverError.value = null

    try {
      const response = await recommendationsService.getDiscover(limit)
      discoverSections.value = response.sections
    } catch (e) {
      discoverError.value = (e as { message: string }).message || 'Failed to load recommendations'
      throw e
    } finally {
      isLoadingDiscover.value = false
    }
  }

  /**
   * Fetch similar songs for a specific song
   */
  async function fetchSimilar(songId: string, limit: number = 10): Promise<SimilarSongItem[]> {
    // Return cached if available
    if (similarSongsMap.value[songId]) {
      return similarSongsMap.value[songId]
    }

    loadingSimilarFor.value = songId
    similarError.value = null

    try {
      const response = await recommendationsService.getSimilarSongs(songId, limit)
      similarSongsMap.value[songId] = response.items
      return response.items
    } catch (e) {
      similarError.value = (e as { message: string }).message || 'Failed to load similar songs'
      throw e
    } finally {
      loadingSimilarFor.value = null
    }
  }

  /**
   * Get cached similar songs for a song
   */
  function getSimilarSongs(songId: string): SimilarSongItem[] {
    return similarSongsMap.value[songId] ?? []
  }

  /**
   * Check if similar songs are loading for a specific song
   */
  function isLoadingSimilar(songId: string): boolean {
    return loadingSimilarFor.value === songId
  }

  /**
   * Generate a personal mix
   */
  async function generateMix(params: MixParams = {}): Promise<Song[]> {
    isLoadingMix.value = true
    mixError.value = null

    try {
      const response = await recommendationsService.getPersonalMix(params)
      personalMixSongs.value = response.songs
      personalMixDuration.value = response.total_duration_seconds
      personalMixMood.value = response.mood
      return response.songs
    } catch (e) {
      mixError.value = (e as { message: string }).message || 'Failed to generate mix'
      throw e
    } finally {
      isLoadingMix.value = false
    }
  }

  /**
   * Perform global search
   */
  async function search(
    query: string,
    type: SearchType = 'all',
    limit: number = 10
  ): Promise<SearchResponse> {
    if (!query.trim()) {
      searchResults.value = null
      searchQuery.value = ''
      return { query: '', songs: [], artists: [], albums: [], playlists: [] }
    }

    searchQuery.value = query
    isSearching.value = true
    searchError.value = null

    try {
      const response = await recommendationsService.search(query, type, limit)
      searchResults.value = response
      return response
    } catch (e) {
      searchError.value = (e as { message: string }).message || 'Search failed'
      throw e
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Clear search results
   */
  function clearSearch(): void {
    searchQuery.value = ''
    searchResults.value = null
    searchError.value = null
  }

  /**
   * Clear personal mix
   */
  function clearMix(): void {
    personalMixSongs.value = []
    personalMixDuration.value = 0
    personalMixMood.value = null
  }

  /**
   * Clear cached similar songs for a specific song
   */
  function clearSimilarCache(songId?: string): void {
    if (songId) {
      delete similarSongsMap.value[songId]
    } else {
      similarSongsMap.value = {}
    }
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    discoverError.value = null
    similarError.value = null
    mixError.value = null
    searchError.value = null
  }

  /**
   * Reset store to initial state
   */
  function reset(): void {
    discoverSections.value = []
    similarSongsMap.value = {}
    personalMixSongs.value = []
    personalMixDuration.value = 0
    personalMixMood.value = null
    searchQuery.value = ''
    searchResults.value = null
    clearErrors()
  }

  return {
    // State - Discovery
    discoverSections,
    isLoadingDiscover,
    discoverError,

    // State - Similar songs
    similarSongsMap,
    loadingSimilarFor,
    similarError,

    // State - Personal mix
    personalMixSongs,
    personalMixDuration,
    personalMixMood,
    isLoadingMix,
    mixError,

    // State - Search
    searchQuery,
    searchResults,
    isSearching,
    searchError,

    // Getters
    hasDiscoverSections,
    longTimeNoListen,
    basedOnFavorite,
    hiddenGems,
    isLoading,

    // Actions
    fetchDiscover,
    fetchSimilar,
    getSimilarSongs,
    isLoadingSimilar,
    generateMix,
    search,
    clearSearch,
    clearMix,
    clearSimilarCache,
    clearErrors,
    reset,
  }
})
