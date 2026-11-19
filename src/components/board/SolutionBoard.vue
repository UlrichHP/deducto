<script setup lang="ts">
/**
 * The solution laid out like the case board: each room with the suspect who
 * was there and the item they held. When the player used their board, each
 * card shows whether they had it in the right place.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BoardState } from '../../game/board'
import { SUSPECT_NAMES } from '../../game/data'
import type { Case } from '../../game/types'
import { itemText, roomText } from '../../i18n/caseText'
import BoardCard from './BoardCard.vue'
import { ITEM_ICONS, ROOM_ICONS } from './icons'

const props = defineProps<{ game: Case; board: BoardState; showStatus: boolean }>()
const { t } = useI18n()

const columns = computed(() =>
  props.game.rooms.map((id, room) => {
    const suspect = props.game.roomOf.indexOf(room)
    const item = props.game.itemOf[suspect]
    const status = (right: boolean): 'right' | 'wrong' | undefined =>
      props.showStatus ? (right ? 'right' : 'wrong') : undefined
    return {
      id,
      crime: room === props.game.crimeRoom,
      label: roomText(t, props.game, room, 'label'),
      icon: ROOM_ICONS[id],
      suspect: {
        id: props.game.suspects[suspect],
        label: SUSPECT_NAMES[props.game.suspects[suspect]],
        status: status(props.board.suspect[room] === suspect),
      },
      item: {
        label: itemText(t, props.game, item, 'label'),
        icon: ITEM_ICONS[props.game.items[item]],
        status: status(props.board.item[room] === item),
      },
    }
  }),
)
</script>

<template>
  <div class="board-grid solution-board" :style="{ '--cols': game.size }">
    <div v-for="col in columns" :key="col.id" class="board-column" :class="{ crime: col.crime }">
      <div class="board-room">
        <component :is="col.icon" :size="18" :stroke-width="1.6" aria-hidden="true" />
        <span>{{ col.label }}</span>
        <span v-if="col.crime" class="board-crime">{{ t('board.crimeScene') }}</span>
      </div>
      <BoardCard
        readonly
        :label="col.suspect.label"
        :suspect="col.suspect.id"
        :status="col.suspect.status"
        :highlight="col.crime"
      />
      <BoardCard
        readonly
        :label="col.item.label"
        :icon="col.item.icon"
        :status="col.item.status"
        :highlight="col.crime"
      />
    </div>
  </div>
</template>
