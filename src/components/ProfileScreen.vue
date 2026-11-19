<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ACHIEVEMENTS, currentStreak, rankInfo } from '../progress/progress'
import { progress } from '../progress/store'
import { dayKey, shiftDay } from '../utils/date'
import { formatDuration } from '../utils/text'
import LanguageSwitch from './LanguageSwitch.vue'

const emit = defineEmits<{ back: [] }>()
const { t, locale } = useI18n()

const today = dayKey(new Date())
const p = computed(() => progress.value)
const rank = computed(() => rankInfo(p.value.solved))

const stats = computed(() => {
  const played = p.value.solved + p.value.failed
  const best = p.value.bySize[5]?.bestSeconds ?? null
  const streak = currentStreak(p.value, today)
  return [
    { label: t('profile.solved'), value: String(p.value.solved) },
    { label: t('profile.successRate'), value: played ? `${Math.round((p.value.solved / played) * 100)} %` : '—' },
    { label: t('profile.firstTry'), value: String(p.value.firstTry) },
    { label: t('profile.bestTime'), value: best === null ? '—' : formatDuration(best) },
    { label: t('profile.currentStreak'), value: t('profile.days', { n: streak }, streak) },
    { label: t('profile.bestStreak'), value: t('profile.days', { n: p.value.streak.best }, p.value.streak.best) },
  ]
})

const lastDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const key = shiftDay(today, i - 6)
    const [y, m, d] = key.split('-').map(Number)
    const outcome = p.value.daily[key] ?? null
    return {
      key,
      weekday: new Date(y, m - 1, d).toLocaleDateString(locale.value, { weekday: 'narrow' }),
      outcome,
      label: `${new Date(y, m - 1, d).toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' })}: ${t(
        outcome === 'won' ? 'profile.dailyWon' : outcome === 'lost' ? 'profile.dailyLost' : 'profile.dailyMissed',
      )}`,
    }
  }),
)

const achievements = computed(() =>
  ACHIEVEMENTS.map((id) => ({
    id,
    unlocked: Boolean(p.value.achievements[id]),
    title: t(`achievements.${id}.title`),
    description: t(`achievements.${id}.description`),
  })),
)
const unlockedCount = computed(() => achievements.value.filter((a) => a.unlocked).length)
</script>

<template>
  <main class="profile">
    <header class="screen-header">
      <button class="btn btn-small" @click="emit('back')">← {{ t('ui.back') }}</button>
      <LanguageSwitch />
    </header>

    <h1 class="screen-title">{{ t('profile.title') }}</h1>

    <section class="rank-card" :aria-label="t('profile.rank')">
      <p class="rank-label">{{ t('profile.rank') }}</p>
      <p class="rank-name">{{ t(`ranks.${rank.current}`) }}</p>
      <div
        class="progress-bar"
        role="progressbar"
        :aria-valuenow="Math.round(rank.ratio * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span :style="{ width: `${rank.ratio * 100}%` }" />
      </div>
      <p class="muted">
        <template v-if="rank.next && rank.nextAt !== null">
          {{
            t('profile.toNextRank', { n: rank.nextAt - p.solved, rank: t(`ranks.${rank.next}`) }, rank.nextAt - p.solved)
          }}
        </template>
        <template v-else>{{ t('profile.maxRank') }}</template>
      </p>
    </section>

    <h2 class="section-title">{{ t('profile.stats') }}</h2>
    <dl class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>

    <h2 class="section-title">{{ t('profile.lastDays') }}</h2>
    <ol class="week">
      <li v-for="day in lastDays" :key="day.key" :aria-label="day.label" :title="day.label">
        <span class="week-dot" :data-outcome="day.outcome ?? 'none'" />
        <span class="week-day" aria-hidden="true">{{ day.weekday }}</span>
      </li>
    </ol>

    <h2 class="section-title">
      {{ t('profile.achievements') }}
      <small>{{ t('profile.unlockedCount', { n: unlockedCount, total: achievements.length }) }}</small>
    </h2>
    <ul class="achievements">
      <li v-for="a in achievements" :key="a.id" class="achievement" :class="{ locked: !a.unlocked }">
        <span class="achievement-badge" aria-hidden="true">{{ a.unlocked ? '★' : '?' }}</span>
        <span>
          <strong>{{ a.title }}</strong>
          <span class="achievement-desc">{{ a.description }}</span>
          <span v-if="!a.unlocked" class="visually-hidden">({{ t('profile.locked') }})</span>
        </span>
      </li>
    </ul>
  </main>
</template>
