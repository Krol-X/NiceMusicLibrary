<script setup lang="ts">
import { computed } from 'vue'
import type { Song, SearchResponse, ArtistSearchResult, AlbumSearchResult, PlaylistSearchResult } from '@/types'
import SearchResultItem from './SearchResultItem.vue'
import { Loader } from '@/components/ui'

export interface SearchResultsProps {
  results: SearchResponse | null
  isLoading?: boolean
  selectedIndex?: number
}

const props = withDefaults(defineProps<SearchResultsProps>(), {
  isLoading: false,
  selectedIndex: -1,
})

const emit = defineEmits<{
  selectSong: [song: Song]
  playSong: [song: Song]
  selectArtist: [artist: ArtistSearchResult]
  selectAlbum: [album: AlbumSearchResult]
  selectPlaylist: [playlist: PlaylistSearchResult]
}>()

const hasSongs = computed(() => props.results?.songs && props.results.songs.length > 0)
const hasArtists = computed(() => props.results?.artists && props.results.artists.length > 0)
const hasAlbums = computed(() => props.results?.albums && props.results.albums.length > 0)
const hasPlaylists = computed(() => props.results?.playlists && props.results.playlists.length > 0)
const hasResults = computed(() => hasSongs.value || hasArtists.value || hasAlbums.value || hasPlaylists.value)
const isEmpty = computed(() => props.results && !hasResults.value && !props.isLoading)

// Build a flat list of all items for keyboard navigation
const flatItems = computed(() => {
  const items: Array<{
    type: 'song' | 'artist' | 'album' | 'playlist'
    data: Song | ArtistSearchResult | AlbumSearchResult | PlaylistSearchResult
  }> = []

  if (props.results?.songs) {
    for (const song of props.results.songs) {
      items.push({ type: 'song', data: song })
    }
  }
  if (props.results?.artists) {
    for (const artist of props.results.artists) {
      items.push({ type: 'artist', data: artist })
    }
  }
  if (props.results?.albums) {
    for (const album of props.results.albums) {
      items.push({ type: 'album', data: album })
    }
  }
  if (props.results?.playlists) {
    for (const playlist of props.results.playlists) {
      items.push({ type: 'playlist', data: playlist })
    }
  }

  return items
})

// Track which flat index corresponds to which item
function getItemIndex(type: string, index: number): number {
  let offset = 0
  if (type === 'song') return index
  offset += props.results?.songs?.length ?? 0
  if (type === 'artist') return offset + index
  offset += props.results?.artists?.length ?? 0
  if (type === 'album') return offset + index
  offset += props.results?.albums?.length ?? 0
  if (type === 'playlist') return offset + index
  return -1
}

function handleSelectSong(song: Song) {
  emit('selectSong', song)
}

function handlePlaySong(song: Song) {
  emit('playSong', song)
}

function handleSelectArtist(artist: ArtistSearchResult) {
  emit('selectArtist', artist)
}

function handleSelectAlbum(album: AlbumSearchResult) {
  emit('selectAlbum', album)
}

function handleSelectPlaylist(playlist: PlaylistSearchResult) {
  emit('selectPlaylist', playlist)
}

// Expose flatItems and length for parent component navigation
defineExpose({
  flatItems,
  itemCount: computed(() => flatItems.value.length),
})
</script>

<template>
  <div class="max-h-96 overflow-y-auto">
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex h-32 items-center justify-center"
    >
      <Loader size="md" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="isEmpty"
      class="flex h-32 items-center justify-center"
    >
      <p class="text-text-muted">No results found for "{{ results?.query }}"</p>
    </div>

    <!-- Results -->
    <template v-else-if="hasResults">
      <!-- Songs -->
      <section v-if="hasSongs">
        <h3 class="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
          Songs
        </h3>
        <div role="listbox">
          <SearchResultItem
            v-for="(song, index) in results!.songs"
            :key="song.id"
            type="song"
            :song="song"
            :is-selected="selectedIndex === getItemIndex('song', index)"
            @select="handleSelectSong(song)"
            @play="handlePlaySong(song)"
          />
        </div>
      </section>

      <!-- Artists -->
      <section v-if="hasArtists">
        <h3 class="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
          Artists
        </h3>
        <div role="listbox">
          <SearchResultItem
            v-for="(artist, index) in results!.artists"
            :key="artist.name"
            type="artist"
            :artist="artist"
            :is-selected="selectedIndex === getItemIndex('artist', index)"
            @select="handleSelectArtist(artist)"
          />
        </div>
      </section>

      <!-- Albums -->
      <section v-if="hasAlbums">
        <h3 class="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
          Albums
        </h3>
        <div role="listbox">
          <SearchResultItem
            v-for="(album, index) in results!.albums"
            :key="`${album.name}-${album.artist}`"
            type="album"
            :album="album"
            :is-selected="selectedIndex === getItemIndex('album', index)"
            @select="handleSelectAlbum(album)"
          />
        </div>
      </section>

      <!-- Playlists -->
      <section v-if="hasPlaylists">
        <h3 class="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
          Playlists
        </h3>
        <div role="listbox">
          <SearchResultItem
            v-for="(playlist, index) in results!.playlists"
            :key="playlist.id"
            type="playlist"
            :playlist="playlist"
            :is-selected="selectedIndex === getItemIndex('playlist', index)"
            @select="handleSelectPlaylist(playlist)"
          />
        </div>
      </section>
    </template>
  </div>
</template>
