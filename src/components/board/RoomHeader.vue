<script setup lang="ts">
import { Slice } from 'lucide-vue-next'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ label: string; icon: Component; crime?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <div class="board-room" :class="{ crime }">
    <component :is="icon" :size="20" :stroke-width="1.6" aria-hidden="true" />
    <span>{{ label }}</span>
    <span v-if="crime" class="board-card-badge crime" :title="t('board.crimeScene')">
      <Slice :size="12" :stroke-width="2.4" aria-hidden="true" />
      <span class="visually-hidden">{{ t('board.crimeScene') }}</span>
    </span>
  </div>
</template>
