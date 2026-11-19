<script setup lang="ts">
import { Check, TriangleAlert, X } from 'lucide-vue-next'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SuspectId } from '../../game/data'
import SuspectPortrait from './SuspectPortrait.vue'

defineProps<{
  label: string
  /** Set for suspect cards: draws the portrait. */
  suspect?: SuspectId
  /** Set for item cards. */
  icon?: Component
  selected?: boolean
  /** The card is being dragged: its original spot is shown faded. */
  lifted?: boolean
  /** The placement contradicts the player's notebook. */
  conflict?: boolean
  /** Display-only card (solution board): not focusable or clickable. */
  readonly?: boolean
  /** On the solution board: whether the player's board had this card here. */
  status?: 'right' | 'wrong'
  /** Emphasised card, e.g. the culprit or the weapon. */
  highlight?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <component
    :is="readonly ? 'div' : 'button'"
    :type="readonly ? undefined : 'button'"
    class="board-card"
    :class="{ selected, lifted, conflict, highlight, readonly, 'is-suspect': suspect }"
    :aria-pressed="readonly ? undefined : (selected ?? false)"
    data-sfx="none"
  >
    <SuspectPortrait v-if="suspect" :id="suspect" />
    <component :is="icon" v-else-if="icon" :size="22" :stroke-width="1.6" aria-hidden="true" />
    <span class="board-card-label">{{ label }}</span>
    <span v-if="conflict" class="board-card-badge alert" :title="t('board.conflict')">
      <TriangleAlert :size="12" :stroke-width="2.4" aria-hidden="true" />
      <span class="visually-hidden">{{ t('board.conflict') }}</span>
    </span>
    <span v-else-if="status" class="board-card-badge" :class="status">
      <Check v-if="status === 'right'" :size="12" :stroke-width="3" aria-hidden="true" />
      <X v-else :size="12" :stroke-width="3" aria-hidden="true" />
      <span class="visually-hidden">{{ status === 'right' ? t('score.rowRight') : t('score.rowWrong') }}</span>
    </span>
  </component>
</template>
