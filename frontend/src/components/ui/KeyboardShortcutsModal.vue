<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Modal from './Modal.vue'

const isOpen = ref(false)

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Навигация',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Открыть поиск' },
      { keys: ['Esc'], description: 'Закрыть модальное окно' },
      { keys: ['?'], description: 'Показать горячие клавиши' },
    ],
  },
  {
    title: 'Воспроизведение',
    shortcuts: [
      { keys: ['Space'], description: 'Воспроизведение / Пауза' },
      { keys: ['N'], description: 'Следующий трек' },
      { keys: ['P'], description: 'Предыдущий трек' },
      { keys: ['S'], description: 'Перемешивание вкл/выкл' },
      { keys: ['R'], description: 'Режим повтора' },
    ],
  },
  {
    title: 'Громкость и позиция',
    shortcuts: [
      { keys: ['↑'], description: 'Увеличить громкость' },
      { keys: ['↓'], description: 'Уменьшить громкость' },
      { keys: ['M'], description: 'Выключить звук' },
      { keys: ['←'], description: 'Перемотка назад 10с' },
      { keys: ['→'], description: 'Перемотка вперед 10с' },
    ],
  },
  {
    title: 'Интерфейс',
    shortcuts: [
      { keys: ['Q'], description: 'Показать/скрыть очередь' },
    ],
  },
]

function handleKeyDown(event: KeyboardEvent) {
  // Ignore if typing in an input
  const target = event.target as HTMLElement
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return
  }

  // Open modal on '?' key (Shift + /)
  if (event.key === '?' || (event.shiftKey && event.key === '/')) {
    event.preventDefault()
    isOpen.value = !isOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function closeModal() {
  isOpen.value = false
}
</script>

<template>
  <Modal
    v-model="isOpen"
    title="Горячие клавиши"
    size="md"
    @close="closeModal"
  >
    <div class="space-y-6">
      <div
        v-for="group in shortcutGroups"
        :key="group.title"
      >
        <h3 class="mb-3 text-small font-semibold uppercase tracking-wider text-text-muted">
          {{ group.title }}
        </h3>
        <div class="space-y-2">
          <div
            v-for="shortcut in group.shortcuts"
            :key="shortcut.description"
            class="flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2"
          >
            <span class="text-body text-text-primary">
              {{ shortcut.description }}
            </span>
            <div class="flex items-center gap-1">
              <kbd
                v-for="key in shortcut.keys"
                :key="key"
                class="inline-flex min-w-[24px] items-center justify-center rounded border border-bg-tertiary bg-bg-primary px-1.5 py-0.5 text-caption font-medium text-text-secondary"
              >
                {{ key }}
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-center">
        <p class="text-caption text-text-muted">
          Нажмите <kbd class="mx-1 rounded border border-bg-tertiary bg-bg-primary px-1.5 py-0.5 text-caption font-medium">?</kbd> чтобы открыть это окно
        </p>
      </div>
    </template>
  </Modal>
</template>
