<script setup lang="ts">
import { Lock, Star } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { AchievementId } from '../progress/progress'

defineProps<{ id: AchievementId; unlocked: boolean }>()
const { t } = useI18n()
</script>

<template>
  <li class="achievement" :class="{ locked: !unlocked }">
    <span class="achievement-badge" aria-hidden="true">
      <Star v-if="unlocked" :size="22" fill="currentColor" :stroke-width="1.5" />
      <Lock v-else :size="16" :stroke-width="2" />
    </span>
    <span>
      <strong>{{ t(`achievements.${id}.title`) }}</strong>
      <span class="achievement-desc">{{ t(`achievements.${id}.description`) }}</span>
      <span v-if="!unlocked" class="visually-hidden">({{ t('profile.locked') }})</span>
    </span>
  </li>
</template>
