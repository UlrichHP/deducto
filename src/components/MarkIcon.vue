<script setup lang="ts">
/**
 * Notebook mark icons, shared by the grid cells and the help sentences so
 * both always look the same.
 */
import { ArrowRight, Circle, X } from 'lucide-vue-next'

withDefaults(defineProps<{ mark: 'no' | 'yes' | 'arrow'; size?: number }>(), { size: 20 })
</script>

<template>
  <X v-if="mark === 'no'" class="mark-icon" :size="size" :stroke-width="2.5" aria-hidden="true" />
  <Circle
    v-else-if="mark === 'yes'"
    class="mark-icon"
    :size="size * 0.9"
    fill="currentColor"
    :stroke-width="0"
    aria-hidden="true"
  />
  <ArrowRight v-else class="mark-icon" :size="size * 0.8" :stroke-width="2" aria-hidden="true" />
</template>
