import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRecommendationsStore } from '../../stores/recommendations'
import * as recommendationsService from '../../services/recommendations'
import type {
  Song,
  DiscoverResponse,
  SimilarSongsResponse,
  PersonalMixResponse,
  SearchResponse,
} from '../../types'

// Mock the recommendations service
vi.mock('../../services/recommendations', () => ({
  recommendationsService: {
    getDiscover: vi.fn(),
    getSimilarSongs: vi.fn(),
    getPersonalMix: vi.fn(),
    search: vi.fn(),
  },
}))

const mockSong: Song = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  genre: 'Rock',
  year: 2023,
  duration_seconds: 180,
  file_format: 'mp3',
  play_count: 10,
  last_played_at: null,
  is_favorite: false,
  rating: null,
  cover_art_path: null,
  created_at: '2023-01-01T00:00:00Z',
}

const mockSong2: Song = {
  ...mockSong,
  id: '223e4567-e89b-12d3-a456-426614174001',
  title: 'Another Song',
}

const mockDiscoverResponse: DiscoverResponse = {
  sections: [
    {
      type: 'long_time_no_listen',
      title: 'Давно не слушали',
      items: [mockSong],
    },
    {
      type: 'based_on_favorite',
      title: 'На основе любимого',
      items: [mockSong2],
    },
    {
      type: 'hidden_gems',
      title: 'Скрытые жемчужины',
      items: [],
    },
  ],
}

const mockSimilarSongsResponse: SimilarSongsResponse = {
  source_song: mockSong,
  items: [
    {
      song: mockSong2,
      similarity_score: 0.85,
      reasons: ['Same genre', 'Similar BPM'],
    },
  ],
}

const mockPersonalMixResponse: PersonalMixResponse = {
  songs: [mockSong, mockSong2],
  total_duration_seconds: 360,
  mood: 'energetic',
}

const mockSearchResponse: SearchResponse = {
  query: 'test',
  songs: [mockSong],
  artists: [
    {
      name: 'Test Artist',
      song_count: 5,
      songs: [mockSong],
    },
  ],
  albums: [
    {
      name: 'Test Album',
      artist: 'Test Artist',
      song_count: 10,
      songs: [mockSong],
    },
  ],
  playlists: [],
}

describe('recommendationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('has correct default values', () => {
      const store = useRecommendationsStore()

      expect(store.discoverSections).toEqual([])
      expect(store.isLoadingDiscover).toBe(false)
      expect(store.discoverError).toBe(null)
      expect(store.similarSongsMap).toEqual({})
      expect(store.loadingSimilarFor).toBe(null)
      expect(store.personalMixSongs).toEqual([])
      expect(store.personalMixDuration).toBe(0)
      expect(store.personalMixMood).toBe(null)
      expect(store.searchQuery).toBe('')
      expect(store.searchResults).toBe(null)
      expect(store.isSearching).toBe(false)
    })
  })

  describe('getters', () => {
    it('hasDiscoverSections returns false when empty', () => {
      const store = useRecommendationsStore()
      expect(store.hasDiscoverSections).toBe(false)
    })

    it('hasDiscoverSections returns true when sections exist', () => {
      const store = useRecommendationsStore()
      store.discoverSections = mockDiscoverResponse.sections
      expect(store.hasDiscoverSections).toBe(true)
    })

    it('longTimeNoListen returns correct section items', () => {
      const store = useRecommendationsStore()
      store.discoverSections = mockDiscoverResponse.sections

      expect(store.longTimeNoListen).toEqual([mockSong])
    })

    it('basedOnFavorite returns correct section items', () => {
      const store = useRecommendationsStore()
      store.discoverSections = mockDiscoverResponse.sections

      expect(store.basedOnFavorite).toEqual([mockSong2])
    })

    it('hiddenGems returns empty array when section is empty', () => {
      const store = useRecommendationsStore()
      store.discoverSections = mockDiscoverResponse.sections

      expect(store.hiddenGems).toEqual([])
    })

    it('isLoading returns true when any loading state is active', () => {
      const store = useRecommendationsStore()

      expect(store.isLoading).toBe(false)

      store.isLoadingDiscover = true
      expect(store.isLoading).toBe(true)

      store.isLoadingDiscover = false
      store.loadingSimilarFor = 'some-id'
      expect(store.isLoading).toBe(true)

      store.loadingSimilarFor = null
      store.isLoadingMix = true
      expect(store.isLoading).toBe(true)

      store.isLoadingMix = false
      store.isSearching = true
      expect(store.isLoading).toBe(true)
    })
  })

  describe('fetchDiscover', () => {
    it('fetches discover recommendations and updates state', async () => {
      const store = useRecommendationsStore()
      vi.mocked(
        recommendationsService.recommendationsService.getDiscover
      ).mockResolvedValue(mockDiscoverResponse)

      await store.fetchDiscover()

      expect(
        recommendationsService.recommendationsService.getDiscover
      ).toHaveBeenCalledWith(10)
      expect(store.discoverSections).toEqual(mockDiscoverResponse.sections)
      expect(store.isLoadingDiscover).toBe(false)
    })

    it('sets isLoadingDiscover during fetch', async () => {
      const store = useRecommendationsStore()
      let loadingDuringFetch = false

      vi.mocked(
        recommendationsService.recommendationsService.getDiscover
      ).mockImplementation(async () => {
        loadingDuringFetch = store.isLoadingDiscover
        return mockDiscoverResponse
      })

      await store.fetchDiscover()

      expect(loadingDuringFetch).toBe(true)
    })

    it('handles fetch error', async () => {
      const store = useRecommendationsStore()
      vi.mocked(
        recommendationsService.recommendationsService.getDiscover
      ).mockRejectedValue(new Error('Network error'))

      await expect(store.fetchDiscover()).rejects.toThrow('Network error')
      expect(store.discoverError).toBe('Network error')
      expect(store.isLoadingDiscover).toBe(false)
    })
  })

  describe('fetchSimilar', () => {
    it('fetches similar songs and caches result', async () => {
      const store = useRecommendationsStore()
      vi.mocked(
        recommendationsService.recommendationsService.getSimilarSongs
      ).mockResolvedValue(mockSimilarSongsResponse)

      const result = await store.fetchSimilar(mockSong.id)

      expect(
        recommendationsService.recommendationsService.getSimilarSongs
      ).toHaveBeenCalledWith(mockSong.id, 10)
      expect(result).toEqual(mockSimilarSongsResponse.items)
      expect(store.similarSongsMap[mockSong.id]).toEqual(
        mockSimilarSongsResponse.items
      )
    })

    it('returns cached result without fetching', async () => {
      const store = useRecommendationsStore()
      store.similarSongsMap[mockSong.id] = mockSimilarSongsResponse.items

      const result = await store.fetchSimilar(mockSong.id)

      expect(
        recommendationsService.recommendationsService.getSimilarSongs
      ).not.toHaveBeenCalled()
      expect(result).toEqual(mockSimilarSongsResponse.items)
    })

    it('sets loadingSimilarFor during fetch', async () => {
      const store = useRecommendationsStore()
      let loadingSongId: string | null = null

      vi.mocked(
        recommendationsService.recommendationsService.getSimilarSongs
      ).mockImplementation(async () => {
        loadingSongId = store.loadingSimilarFor
        return mockSimilarSongsResponse
      })

      await store.fetchSimilar(mockSong.id)

      expect(loadingSongId).toBe(mockSong.id)
      expect(store.loadingSimilarFor).toBe(null)
    })
  })

  describe('getSimilarSongs', () => {
    it('returns cached similar songs', () => {
      const store = useRecommendationsStore()
      store.similarSongsMap[mockSong.id] = mockSimilarSongsResponse.items

      expect(store.getSimilarSongs(mockSong.id)).toEqual(
        mockSimilarSongsResponse.items
      )
    })

    it('returns empty array when no cache', () => {
      const store = useRecommendationsStore()

      expect(store.getSimilarSongs(mockSong.id)).toEqual([])
    })
  })

  describe('isLoadingSimilar', () => {
    it('returns true when loading for specific song', () => {
      const store = useRecommendationsStore()
      store.loadingSimilarFor = mockSong.id

      expect(store.isLoadingSimilar(mockSong.id)).toBe(true)
      expect(store.isLoadingSimilar('other-id')).toBe(false)
    })
  })

  describe('generateMix', () => {
    it('generates personal mix and updates state', async () => {
      const store = useRecommendationsStore()
      vi.mocked(
        recommendationsService.recommendationsService.getPersonalMix
      ).mockResolvedValue(mockPersonalMixResponse)

      const result = await store.generateMix({ mood: 'energetic', duration_minutes: 60 })

      expect(
        recommendationsService.recommendationsService.getPersonalMix
      ).toHaveBeenCalledWith({ mood: 'energetic', duration_minutes: 60 })
      expect(result).toEqual(mockPersonalMixResponse.songs)
      expect(store.personalMixSongs).toEqual(mockPersonalMixResponse.songs)
      expect(store.personalMixDuration).toBe(360)
      expect(store.personalMixMood).toBe('energetic')
    })

    it('sets isLoadingMix during generation', async () => {
      const store = useRecommendationsStore()
      let loadingDuringGen = false

      vi.mocked(
        recommendationsService.recommendationsService.getPersonalMix
      ).mockImplementation(async () => {
        loadingDuringGen = store.isLoadingMix
        return mockPersonalMixResponse
      })

      await store.generateMix()

      expect(loadingDuringGen).toBe(true)
      expect(store.isLoadingMix).toBe(false)
    })

    it('handles generation error', async () => {
      const store = useRecommendationsStore()
      vi.mocked(
        recommendationsService.recommendationsService.getPersonalMix
      ).mockRejectedValue(new Error('Generation failed'))

      await expect(store.generateMix()).rejects.toThrow('Generation failed')
      expect(store.mixError).toBe('Generation failed')
    })
  })

  describe('search', () => {
    it('performs search and updates state', async () => {
      const store = useRecommendationsStore()
      vi.mocked(
        recommendationsService.recommendationsService.search
      ).mockResolvedValue(mockSearchResponse)

      const result = await store.search('test')

      expect(recommendationsService.recommendationsService.search).toHaveBeenCalledWith(
        'test',
        'all',
        10
      )
      expect(result).toEqual(mockSearchResponse)
      expect(store.searchQuery).toBe('test')
      expect(store.searchResults).toEqual(mockSearchResponse)
    })

    it('returns empty results for empty query', async () => {
      const store = useRecommendationsStore()

      const result = await store.search('   ')

      expect(recommendationsService.recommendationsService.search).not.toHaveBeenCalled()
      expect(result).toEqual({
        query: '',
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
      })
    })

    it('sets isSearching during search', async () => {
      const store = useRecommendationsStore()
      let searchingDuringSearch = false

      vi.mocked(
        recommendationsService.recommendationsService.search
      ).mockImplementation(async () => {
        searchingDuringSearch = store.isSearching
        return mockSearchResponse
      })

      await store.search('test')

      expect(searchingDuringSearch).toBe(true)
      expect(store.isSearching).toBe(false)
    })

    it('handles search error', async () => {
      const store = useRecommendationsStore()
      vi.mocked(recommendationsService.recommendationsService.search).mockRejectedValue(
        new Error('Search failed')
      )

      await expect(store.search('test')).rejects.toThrow('Search failed')
      expect(store.searchError).toBe('Search failed')
    })
  })

  describe('clearSearch', () => {
    it('clears search state', () => {
      const store = useRecommendationsStore()
      store.searchQuery = 'test'
      store.searchResults = mockSearchResponse
      store.searchError = 'error'

      store.clearSearch()

      expect(store.searchQuery).toBe('')
      expect(store.searchResults).toBe(null)
      expect(store.searchError).toBe(null)
    })
  })

  describe('clearMix', () => {
    it('clears personal mix state', () => {
      const store = useRecommendationsStore()
      store.personalMixSongs = [mockSong]
      store.personalMixDuration = 180
      store.personalMixMood = 'calm'

      store.clearMix()

      expect(store.personalMixSongs).toEqual([])
      expect(store.personalMixDuration).toBe(0)
      expect(store.personalMixMood).toBe(null)
    })
  })

  describe('clearSimilarCache', () => {
    it('clears specific song cache', () => {
      const store = useRecommendationsStore()
      store.similarSongsMap[mockSong.id] = mockSimilarSongsResponse.items
      store.similarSongsMap[mockSong2.id] = mockSimilarSongsResponse.items

      store.clearSimilarCache(mockSong.id)

      expect(store.similarSongsMap[mockSong.id]).toBeUndefined()
      expect(store.similarSongsMap[mockSong2.id]).toEqual(
        mockSimilarSongsResponse.items
      )
    })

    it('clears all cache when no songId provided', () => {
      const store = useRecommendationsStore()
      store.similarSongsMap[mockSong.id] = mockSimilarSongsResponse.items
      store.similarSongsMap[mockSong2.id] = mockSimilarSongsResponse.items

      store.clearSimilarCache()

      expect(store.similarSongsMap).toEqual({})
    })
  })

  describe('clearErrors', () => {
    it('clears all error states', () => {
      const store = useRecommendationsStore()
      store.discoverError = 'discover error'
      store.similarError = 'similar error'
      store.mixError = 'mix error'
      store.searchError = 'search error'

      store.clearErrors()

      expect(store.discoverError).toBe(null)
      expect(store.similarError).toBe(null)
      expect(store.mixError).toBe(null)
      expect(store.searchError).toBe(null)
    })
  })

  describe('reset', () => {
    it('resets store to initial state', () => {
      const store = useRecommendationsStore()
      store.discoverSections = mockDiscoverResponse.sections
      store.similarSongsMap[mockSong.id] = mockSimilarSongsResponse.items
      store.personalMixSongs = [mockSong]
      store.searchQuery = 'test'
      store.discoverError = 'error'

      store.reset()

      expect(store.discoverSections).toEqual([])
      expect(store.similarSongsMap).toEqual({})
      expect(store.personalMixSongs).toEqual([])
      expect(store.searchQuery).toBe('')
      expect(store.discoverError).toBe(null)
    })
  })
})
