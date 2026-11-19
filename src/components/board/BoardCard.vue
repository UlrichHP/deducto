<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next'
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
}>()

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="board-card"
    :class="{ selected, lifted, conflict, 'is-suspect': suspect }"
    :aria-pressed="selected ?? false"
    data-sfx="none"
  >
    <SuspectPortrait v-if="suspect" :id="suspect" />
    <component :is="icon" v-else-if="icon" :size="22" :stroke-width="1.6" aria-hidden="true" />
    <span class="board-card-label">{{ label }}</span>
    <span v-if="conflict" class="board-card-alert" :title="t('board.conflict')">
      <TriangleAlert :size="12" :stroke-width="2.4" aria-hidden="true" />
      <span class="visually-hidden">{{ t('board.conflict') }}</span>
    </span>
  </button>
</template>
