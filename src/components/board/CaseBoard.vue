<script setup lang="ts">
/**
 * Case board: rooms are fixed columns; the player drags suspect and item
 * cards under them (or taps a card, then a slot). Purely a thinking aid:
 * it never says whether a placement is right.
 */
import { RotateCcw } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { playSound } from '../../audio'
import { useCaseSession } from '../../composables/caseSession'
import { clearSlot, emptyBoard, placeCard, trayCards, type CardKind } from '../../game/board'
import { boardConflicts, excludedColumns } from '../../game/notebook'
import { SUSPECT_NAMES } from '../../game/data'
import type { Case } from '../../game/types'
import { itemText, roomText } from '../../i18n/caseText'
import { BOARD_POINTS } from '../../progress/score'
import BoardCard from './BoardCard.vue'
import RoomHeader from './RoomHeader.vue'
import { ITEM_ICONS, ROOM_ICONS } from './icons'

const KINDS: readonly CardKind[] = ['suspect', 'item']
/** Pointer travel (px) before a press becomes a drag rather than a tap. */
const DRAG_THRESHOLD = 6

const props = defineProps<{ game: Case }>()
const { t } = useI18n()

const { board, marks } = useCaseSession()
const trays = computed(() => ({ suspect: trayCards(board.value, 'suspect'), item: trayCards(board.value, 'item') }))

const columns = computed(() =>
  props.game.rooms.map((id, index) => ({
    index,
    id,
    label: roomText(t, props.game, index, 'label'),
    icon: ROOM_ICONS[id],
    crime: index === props.game.crimeRoom,
  })),
)

function cardProps(kind: CardKind, card: number) {
  return kind === 'suspect'
    ? { label: SUSPECT_NAMES[props.game.suspects[card]], suspect: props.game.suspects[card] }
    : { label: itemText(t, props.game, card, 'label'), icon: ITEM_ICONS[props.game.items[card]] }
}

// --- Placement -----------------------------------------------------------------

interface Picked {
  kind: CardKind
  card: number
  /** Column the card sits in, or null when it comes from the tray. */
  from: number | null
}

const selected = ref<Picked | null>(null)

const isSelected = (kind: CardKind, card: number) =>
  selected.value?.kind === kind && selected.value.card === card

function place(kind: CardKind, card: number, column: number) {
  board.value = placeCard(board.value, kind, card, column)
  selected.value = null
  playSound('card')
}

function unplace(kind: CardKind, column: number) {
  board.value = clearSlot(board.value, kind, column)
  selected.value = null
  playSound('card')
}

function reset() {
  board.value = emptyBoard(props.game.size)
  selected.value = null
}

/** Tap on a card: select it, deselect it, or drop the selected card onto its slot. */
function tapCard(picked: Picked) {
  const current = selected.value
  if (current?.kind === picked.kind && current.card === picked.card) selected.value = null
  else if (current?.kind === picked.kind && picked.from !== null) place(current.kind, current.card, picked.from)
  else selected.value = picked
}

function onSlotClick(kind: CardKind, column: number) {
  if (selected.value?.kind === kind) place(kind, selected.value.card, column)
}

/** Tapping the tray with a placed card selected sends it back. */
function onTrayClick(kind: CardKind) {
  const current = selected.value
  if (current?.kind === kind && current.from !== null) unplace(kind, current.from)
}

/** Keyboard activation (pointer taps are handled on pointerup). */
function onCardClick(event: MouseEvent, picked: Picked) {
  if (event.detail === 0) tapCard(picked)
}

// --- Drag and drop (pointer events: mouse, touch and pen) ------------------------

type Target = { kind: CardKind; column: number } | 'tray' | null

const drag = reactive({
  pending: null as (Picked & { pointerId: number; x0: number; y0: number }) | null,
  active: false,
  x: 0,
  y: 0,
  over: null as Target,
})

function targetAt(x: number, y: number, kind: CardKind): Target {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-slot-kind], [data-tray]')
  if (!el) return null
  if (el.dataset.tray) return el.dataset.tray === kind ? 'tray' : null
  if (el.dataset.slotKind !== kind) return null
  return { kind, column: Number(el.dataset.slotColumn) }
}

function onPointerDown(event: PointerEvent, picked: Picked) {
  if (event.button !== 0) return
  drag.pending = { ...picked, pointerId: event.pointerId, x0: event.clientX, y0: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  const p = drag.pending
  if (!p || event.pointerId !== p.pointerId) return
  if (!drag.active && Math.hypot(event.clientX - p.x0, event.clientY - p.y0) < DRAG_THRESHOLD) return
  drag.active = true
  drag.x = event.clientX
  drag.y = event.clientY
  drag.over = targetAt(event.clientX, event.clientY, p.kind)
}

function onPointerUp(event: PointerEvent) {
  const p = drag.pending
  if (!p || event.pointerId !== p.pointerId) return
  if (drag.active) {
    const target = targetAt(event.clientX, event.clientY, p.kind)
    if (target === 'tray' && p.from !== null) unplace(p.kind, p.from)
    else if (target && target !== 'tray') place(p.kind, p.card, target.column)
  } else {
    tapCard(p)
  }
  endDrag()
}

function endDrag() {
  drag.pending = null
  drag.active = false
  drag.over = null
}

const isOver = (kind: CardKind, column: number) =>
  drag.over !== null && drag.over !== 'tray' && drag.over.kind === kind && drag.over.column === column

// --- Notebook hints (read-only) ------------------------------------------------

/** Placed cards that contradict the player's own notebook. */
const conflicts = computed(() => boardConflicts(board.value, marks))

/** The card being dragged, or else the selected one. */
const activeCard = computed(() => (drag.active && drag.pending ? drag.pending : selected.value))

/** Rooms where the active card would contradict the notebook. */
const excluded = computed(() =>
  activeCard.value ? excludedColumns(board.value, marks, activeCard.value.kind, activeCard.value.card) : null,
)

const isExcluded = (kind: CardKind, column: number) =>
  activeCard.value?.kind === kind && Boolean(excluded.value?.[column])

const isLifted = (kind: CardKind, card: number) =>
  drag.active && drag.pending?.kind === kind && drag.pending.card === card
</script>

<template>
  <section class="board" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="endDrag">
    <h2 class="section-title">
      {{ t('board.title') }} <span class="points-badge">{{ t('board.points', { points: BOARD_POINTS }) }}</span>
    </h2>
    <p class="hint">{{ t('board.hint') }}</p>

    <div class="board-grid" :style="{ '--cols': game.size }">
      <div v-for="col in columns" :key="col.id" class="board-column" :class="{ crime: col.crime }">
        <RoomHeader :label="col.label" :icon="col.icon" :crime="col.crime" />

        <div
          v-for="kind in KINDS"
          :key="kind"
          class="board-slot"
          :class="{ over: isOver(kind, col.index), armed: selected?.kind === kind, excluded: isExcluded(kind, col.index) }"
          :data-slot-kind="kind"
          :data-slot-column="col.index"
        >
          <template v-for="card in [board[kind][col.index]]" :key="kind">
            <BoardCard
              v-if="card !== null"
              v-bind="cardProps(kind, card)"
              :selected="isSelected(kind, card)"
              :lifted="isLifted(kind, card)"
              :conflict="conflicts[kind][col.index]"
              @pointerdown="onPointerDown($event, { kind, card, from: col.index })"
              @click="onCardClick($event, { kind, card, from: col.index })"
            />
            <button
              v-else
              type="button"
              class="board-slot-empty"
              :aria-label="t('board.slot', { kind: t(`board.kinds.${kind}`), room: col.label })"
              data-sfx="none"
              @click="onSlotClick(kind, col.index)"
            >
              <span aria-hidden="true">{{ t(`board.kinds.${kind}`) }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <div
      v-for="kind in KINDS"
      :key="kind"
      class="board-tray"
      :class="{ over: drag.over === 'tray' && drag.pending?.kind === kind }"
      :data-tray="kind"
      :style="{ '--cols': game.size }"
      @click.self="onTrayClick(kind)"
    >
      <BoardCard
        v-for="card in trays[kind]"
        :key="card"
        v-bind="cardProps(kind, card)"
        :selected="isSelected(kind, card)"
        :lifted="isLifted(kind, card)"
        @pointerdown="onPointerDown($event, { kind, card, from: null })"
        @click="onCardClick($event, { kind, card, from: null })"
      />
    </div>

    <button class="btn btn-wide btn-icon" @click="reset">
      <RotateCcw :size="18" aria-hidden="true" />
      {{ t('board.reset') }}
    </button>

    <Teleport to="body">
      <div
        v-if="drag.active && drag.pending"
        class="board-ghost"
        :style="{ left: `${drag.x}px`, top: `${drag.y}px` }"
        aria-hidden="true"
      >
        <BoardCard v-bind="cardProps(drag.pending.kind, drag.pending.card)" tabindex="-1" />
      </div>
    </Teleport>
  </section>
</template>
