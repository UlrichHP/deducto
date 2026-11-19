<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentStreak, rankInfo } from '../progress/progress'
import { progress } from '../progress/store'
import { dayKey } from '../utils/date'
import SettingsButton from './SettingsButton.vue'

const emit = defineEmits<{ daily: []; random: [size: number]; profile: [] }>()
const { t } = useI18n()

const today = dayKey(new Date())
const dailyOutcome = computed(() => progress.value.daily[today] ?? null)
const streak = computed(() => currentStreak(progress.value, today))
const rank = computed(() => rankInfo(progress.value.solved).current)

const dailyLabel = computed(() =>
  dailyOutcome.value === 'won'
    ? t('ui.dailyWon')
    : dailyOutcome.value === 'lost'
      ? t('ui.dailyLost')
      : t('ui.dailyCase'),
)
</script>

<template>
  <main class="menu">
    <div class="menu-top">
      <button class="btn btn-small profile-btn" @click="emit('profile')">
        <span>{{ t('ui.profile') }}</span>
        <span class="profile-meta">{{ t(`ranks.${rank}`) }}<template v-if="streak"> · {{ streak }}🔥</template></span>
      </button>
      <div class="toolbar">
        <SettingsButton />
      </div>
    </div>

    <h1 class="logo">DEDUCTO</h1>
    <p class="tagline">{{ t('ui.tagline') }}</p>

    <div class="menu-actions">
      <button class="btn" :class="dailyOutcome ? 'btn-done' : 'btn-accent'" @click="emit('daily')">
        {{ dailyLabel }}
      </button>
      <button class="btn" @click="emit('random', 4)">{{ t('ui.newCaseWith', { n: 4 }) }}</button>
      <button class="btn" @click="emit('random', 5)">{{ t('ui.newCaseWith', { n: 5 }) }}</button>
    </div>

    <details class="howto">
      <summary>{{ t('ui.howToTitle') }}</summary>
      <p>{{ t('ui.howToRules') }}</p>
      <p>{{ t('ui.howToGoal') }}</p>
    </details>
  </main>
</template>
