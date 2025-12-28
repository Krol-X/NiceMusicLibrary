<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecommendationsStore } from '@/stores/recommendations'
import { usePlayerStore } from '@/stores/player'
import type { Song, MoodType } from '@/types'
import { Loader, Button, Modal } from '@/components/ui'
import { formatDuration } from '@/services/songs'

const recommendationsStore = useRecommendationsStore()
const playerStore = usePlayerStore()

const { personalMixSongs, personalMixDuration, personalMixMood, isLoadingMix, mixError } =
  storeToRefs(recommendationsStore)

const isSettingsOpen = ref(false)
const selectedMood = ref<MoodType | undefined>(undefined)
const selectedDuration = ref(60)

const hasActiveMix = computed(() => personalMixSongs.value.length > 0)
const formattedDuration = computed(() => formatDuration(personalMixDuration.value))
const songCount = computed(() => personalMixSongs.value.length)

const moodLabel = computed(() => {
  if (!personalMixMood.value) return 'Any mood'
  const labels: Record<MoodType, string> = {
    energetic: 'Energetic',
    calm: 'Calm',
    focus: 'Focus',
  }
  return labels[personalMixMood.value]
})

async function generateMix() {
  isSettingsOpen.value = false
  await recommendationsStore.generateMix({
    mood: selectedMood.value,
    duration_minutes: selectedDuration.value,
  })
}

function playMix() {
  if (personalMixSongs.value.length > 0) {
    playerStore.setQueue(personalMixSongs.value as Song[])
    playerStore.play()
  }
}

function openSettings() {
  // Initialize with current settings if available
  selectedMood.value = personalMixMood.value ?? undefined
  selectedDuration.value = Math.round(personalMixDuration.value / 60) || 60
  isSettingsOpen.value = true
}

function setMood(mood: MoodType | undefined) {
  selectedMood.value = mood
}
</script>

<template>
  <div class="card">
    <div class="flex items-start gap-4">
      <!-- Mix icon -->
      <div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
        <svg
          class="h-8 w-8 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="text-h3 text-text-primary mb-1">Personal Mix</h3>

        <template v-if="isLoadingMix">
          <div class="flex items-center gap-2">
            <Loader size="sm" />
            <span class="text-small text-text-secondary">Generating your mix...</span>
          </div>
        </template>

        <template v-else-if="mixError">
          <p class="text-small text-accent-error">{{ mixError }}</p>
        </template>

        <template v-else-if="hasActiveMix">
          <p class="text-small text-text-secondary mb-2">
            {{ songCount }} songs · {{ formattedDuration }} · {{ moodLabel }}
          </p>
          <div class="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              @click="playMix"
            >
              <svg
                class="h-4 w-4 mr-1"
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
              Play Mix
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="openSettings"
            >
              New Mix
            </Button>
          </div>
        </template>

        <template v-else>
          <p class="text-small text-text-secondary mb-2">
            Generate a personalized mix based on your taste
          </p>
          <Button
            variant="primary"
            size="sm"
            @click="openSettings"
          >
            Create Mix
          </Button>
        </template>
      </div>
    </div>

    <!-- Settings Modal -->
    <Modal
      v-model="isSettingsOpen"
      title="Mix Settings"
      size="sm"
    >
      <div class="space-y-4">
        <!-- Mood selection -->
        <div>
          <label class="block text-small font-medium text-text-primary mb-2">Mood</label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              :class="[
                'rounded-full px-4 py-2 text-small font-medium transition-colors',
                selectedMood === undefined
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
              ]"
              @click="setMood(undefined)"
            >
              Any
            </button>
            <button
              type="button"
              :class="[
                'rounded-full px-4 py-2 text-small font-medium transition-colors',
                selectedMood === 'energetic'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
              ]"
              @click="setMood('energetic')"
            >
              Energetic
            </button>
            <button
              type="button"
              :class="[
                'rounded-full px-4 py-2 text-small font-medium transition-colors',
                selectedMood === 'calm'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
              ]"
              @click="setMood('calm')"
            >
              Calm
            </button>
            <button
              type="button"
              :class="[
                'rounded-full px-4 py-2 text-small font-medium transition-colors',
                selectedMood === 'focus'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
              ]"
              @click="setMood('focus')"
            >
              Focus
            </button>
          </div>
        </div>

        <!-- Duration slider -->
        <div>
          <label class="block text-small font-medium text-text-primary mb-2">
            Duration: {{ selectedDuration }} minutes
          </label>
          <input
            v-model.number="selectedDuration"
            type="range"
            min="15"
            max="180"
            step="15"
            class="w-full accent-accent-primary"
          >
          <div class="flex justify-between text-caption text-text-muted mt-1">
            <span>15 min</span>
            <span>3 hours</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          variant="secondary"
          @click="isSettingsOpen = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="generateMix"
        >
          Generate Mix
        </Button>
      </template>
    </Modal>
  </div>
</template>
