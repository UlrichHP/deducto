<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Case } from '../game/types'
import { itemText, roomText, suspectName } from '../i18n/caseText'

/** 0 = empty, 1 = no, 2 = yes */
type Mark = 0 | 1 | 2
type GridId = 'rooms' | 'items'

const SYMBOLS = ['', '✕', '●'] as const
const MARK_KEYS = ['empty', 'no', 'yes'] as const

const props = defineProps<{ game: Case }>()
const { t } = useI18n()
const size = props.game.size
const indexes = Array.from({ length: size }, (_, i) => i)

const grids = computed(() => [
  { id: 'rooms' as const, title: t('ui.roomsGrid'), columns: indexes.map((i) => roomText(t, props.game, i, 'label')) },
  { id: 'items' as const, title: t('ui.itemsGrid'), columns: indexes.map((i) => itemText(t, props.game, i, 'label')) },
])

const empty = (): Mark[][] => Array.from({ length: size }, () => Array<Mark>(size).fill(0))
const marks = reactive<Record<GridId, Mark[][]>>({ rooms: empty(), items: empty() })

/** Cycles a cell empty → ✕ → ●. A ● crosses out the rest of its row and column. */
function cycle(grid: GridId, row: number, col: number) {
  const g = marks[grid]
  const next = ((g[row][col] + 1) % 3) as Mark
  g[row][col] = next
  if (next !== 2) return
  for (let k = 0; k < size; k++) {
    if (k !== col && g[row][k] === 0) g[row][k] = 1
    if (k !== row && g[k][col] === 0) g[k][col] = 1
  }
}

function cellLabel(row: number, column: string, mark: Mark) {
  return `${suspectName(props.game, row)}, ${column}: ${t(`ui.marks.${MARK_KEYS[mark]}`)}`
}

function reset() {
  marks.rooms = empty()
  marks.items = empty()
}
</script>

<template>
  <section class="notebook">
    <p class="hint">{{ t('ui.notebookHint') }}</p>

    <div v-for="grid in grids" :key="grid.id">
      <h2 class="section-title">{{ grid.title }}</h2>
      <table class="grid">
        <thead>
          <tr>
            <th class="corner" />
            <th v-for="label in grid.columns" :key="label" scope="col">{{ label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in indexes" :key="row">
            <th scope="row">{{ suspectName(game, row) }}</th>
            <td v-for="(label, col) in grid.columns" :key="label">
              <button
                class="cell"
                data-sfx="pen"
                :data-mark="marks[grid.id][row][col]"
                :aria-label="cellLabel(row, label, marks[grid.id][row][col])"
                @click="cycle(grid.id, row, col)"
              >
                {{ SYMBOLS[marks[grid.id][row][col]] }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="btn btn-wide" @click="reset">{{ t('ui.clearNotebook') }}</button>
  </section>
</template>
