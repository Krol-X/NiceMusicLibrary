/**
 * Recommendations Service
 *
 * API client for recommendations, similar songs, and global search endpoints.
 */

import { apiService } from './api'
import type {
  DiscoverResponse,
  SimilarSongsResponse,
  PersonalMixResponse,
  SearchResponse,
  MoodType,
  SearchType,
} from '@/types'

export interface MixParams {
  mood?: MoodType
  duration_minutes?: number
}

export const recommendationsService = {
  /**
   * Get discovery recommendations (home page sections)
   */
  async getDiscover(limit: number = 10): Promise<DiscoverResponse> {
    const response = await apiService.get<DiscoverResponse>('/recommendations/discover', {
      limit,
    })
    return response.data
  },

  /**
   * Get songs similar to a specific song
   */
  async getSimilarSongs(songId: string, limit: number = 10): Promise<SimilarSongsResponse> {
    const response = await apiService.get<SimilarSongsResponse>(
      `/recommendations/similar/${songId}`,
      { limit }
    )
    return response.data
  },

  /**
   * Generate a personal mix
   */
  async getPersonalMix(params: MixParams = {}): Promise<PersonalMixResponse> {
    const response = await apiService.get<PersonalMixResponse>('/recommendations/mix', {
      mood: params.mood,
      duration_minutes: params.duration_minutes ?? 60,
    })
    return response.data
  },

  /**
   * Global search across songs, artists, albums, and playlists
   */
  async search(
    query: string,
    type: SearchType = 'all',
    limit: number = 10
  ): Promise<SearchResponse> {
    const response = await apiService.get<SearchResponse>('/search', {
      q: query,
      type,
      limit,
    })
    return response.data
  },
}
