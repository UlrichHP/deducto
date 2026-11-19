<script setup lang="ts">
import type { Component } from 'vue'
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
}>()
</script>

<template>
  <button
    type="button"
    class="board-card"
    :class="{ selected, lifted, 'is-suspect': suspect }"
    :aria-pressed="selected ?? false"
    data-sfx="none"
  >
    <SuspectPortrait v-if="suspect" :id="suspect" />
    <component :is="icon" v-else-if="icon" :size="22" :stroke-width="1.6" aria-hidden="true" />
    <span class="board-card-label">{{ label }}</span>
  </button>
</template>
