<script setup lang="ts">
import { Circle, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCaseSession } from '../composables/caseSession'
import { cycleMark, emptyMarks, NO, YES, type GridId, type Mark } from '../game/notebook'
import type { Case } from '../game/types'
import { itemText, roomText, suspectName } from '../i18n/caseText'

const MARK_KEYS = ['empty', 'no', 'yes'] as const

const props = defineProps<{ game: Case }>()
const { t } = useI18n()
const { marks } = useCaseSession()
const indexes = Array.from({ length: props.game.size }, (_, i) => i)

const grids = computed(() => [
  { id: 'rooms' as const, title: t('ui.roomsGrid'), columns: indexes.map((i) => roomText(t, props.game, i, 'label')) },
  { id: 'items' as const, title: t('ui.itemsGrid'), columns: indexes.map((i) => itemText(t, props.game, i, 'label')) },
])

function cycle(grid: GridId, row: number, col: number) {
  cycleMark(marks, grid, row, col)
}

function cellLabel(row: number, column: string, mark: Mark) {
  return `${suspectName(props.game, row)}, ${column}: ${t(`ui.marks.${MARK_KEYS[mark]}`)}`
}

function reset() {
  Object.assign(marks, emptyMarks(props.game.size))
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
            <th v-for="label in grid.columns" :key="label" scope="col"><span>{{ label }}</span></th>
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
                <X v-if="marks[grid.id][row][col] === NO" :size="20" :stroke-width="2.5" aria-hidden="true" />
                <Circle
                  v-else-if="marks[grid.id][row][col] === YES"
                  :size="16"
                  fill="currentColor"
                  aria-hidden="true"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="btn btn-wide" @click="reset">{{ t('ui.clearNotebook') }}</button>
  </section>
</template>
