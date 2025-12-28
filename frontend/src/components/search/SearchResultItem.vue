<script setup lang="ts">
import { computed } from 'vue'
import type { Song, ArtistSearchResult, AlbumSearchResult, PlaylistSearchResult } from '@/types'
import { formatDuration, getCoverUrl } from '@/services/songs'

export type ResultType = 'song' | 'artist' | 'album' | 'playlist'

export interface SearchResultItemProps {
  type: ResultType
  song?: Song
  artist?: ArtistSearchResult
  album?: AlbumSearchResult
  playlist?: PlaylistSearchResult
  isSelected?: boolean
}

const props = withDefaults(defineProps<SearchResultItemProps>(), {
  song: undefined,
  artist: undefined,
  album: undefined,
  playlist: undefined,
  isSelected: false,
})

const emit = defineEmits<{
  select: []
  play: []
}>()

const title = computed(() => {
  if (props.type === 'song' && props.song) return props.song.title
  if (props.type === 'artist' && props.artist) return props.artist.name
  if (props.type === 'album' && props.album) return props.album.name
  if (props.type === 'playlist' && props.playlist) return props.playlist.name
  return ''
})

const subtitle = computed(() => {
  if (props.type === 'song' && props.song) return props.song.artist || 'Unknown Artist'
  if (props.type === 'artist' && props.artist) return `${props.artist.song_count} songs`
  if (props.type === 'album' && props.album)
    return props.album.artist
      ? `${props.album.artist} · ${props.album.song_count} songs`
      : `${props.album.song_count} songs`
  if (props.type === 'playlist' && props.playlist) return `${props.playlist.song_count} songs`
  return ''
})

const duration = computed(() => {
  if (props.type === 'song' && props.song) return formatDuration(props.song.duration_seconds)
  return ''
})

const coverUrl = computed(() => {
  if (props.type === 'song' && props.song?.cover_art_path) {
    return getCoverUrl(props.song.id)
  }
  return null
})

const iconPath = computed(() => {
  switch (props.type) {
    case 'song':
      return 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z'
    case 'artist':
      return 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
    case 'album':
      return 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z'
    case 'playlist':
      return 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
    default:
      return ''
  }
})

function handleClick() {
  emit('select')
}

function handlePlay(event: MouseEvent) {
  event.stopPropagation()
  emit('play')
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-colors',
      isSelected ? 'bg-accent-primary/10' : 'hover:bg-bg-secondary',
    ]"
    role="option"
    :aria-selected="isSelected"
    @click="handleClick"
  >
    <!-- Cover/Icon -->
    <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-bg-tertiary overflow-hidden">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="title"
        class="h-full w-full object-cover"
      >
      <svg
        v-else
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
          :d="iconPath"
        />
      </svg>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="truncate text-small font-medium text-text-primary">{{ title }}</p>
      <p class="truncate text-caption text-text-secondary">{{ subtitle }}</p>
    </div>

    <!-- Duration (for songs) -->
    <span
      v-if="duration"
      class="text-caption text-text-muted"
    >
      {{ duration }}
    </span>

    <!-- Play button (for songs) -->
    <button
      v-if="type === 'song'"
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-white opacity-0 transition-opacity group-hover:opacity-100"
      :class="{ '!opacity-100': isSelected }"
      aria-label="Play"
      @click="handlePlay"
    >
      <svg
        class="h-4 w-4 translate-x-0.5"
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

    <!-- Arrow (for navigation items) -->
    <svg
      v-else
      class="h-4 w-4 text-text-muted"
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
  </div>
</template>
