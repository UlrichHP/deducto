<script lang="ts">
export type CaseLabel = { kind: 'daily'; date: Date } | { kind: 'random'; number: string }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Case } from '../game/types'
import { itemText, roomText, suspectName } from '../i18n/caseText'
import type { AchievementId } from '../progress/progress'
import { recordGame } from '../progress/store'
import { dayKey } from '../utils/date'
import { formatDuration } from '../utils/text'
import AppModal from './AppModal.vue'
import CaseFile from './CaseFile.vue'
import HelpButton from './HelpButton.vue'
import SettingsButton from './SettingsButton.vue'
import NoteBook from './NoteBook.vue'
import { playSound } from '../audio'

const MAX_ACCUSATIONS = 3

const props = defineProps<{ game: Case; label: CaseLabel }>()
const emit = defineEmits<{ menu: []; newCase: [size: number] }>()
const { t, locale } = useI18n()

type Modal =
  | { kind: 'accuse' }
  | { kind: 'wrong'; suspect: number }
  | { kind: 'end'; won: boolean; seconds: number }

const tab = ref<'file' | 'notebook'>('file')
const accusationsLeft = ref(MAX_ACCUSATIONS)
const finished = ref(false)
const modal = ref<Modal | null>(null)
const unlocked = ref<AchievementId[]>([])
const startedAt = Date.now()

const title = computed(() =>
  props.label.kind === 'daily'
    ? t('ui.dailyTitle', { date: props.label.date.toLocaleDateString(locale.value) })
    : t('ui.caseTitle', { number: props.label.number }),
)

const culprit = computed(() => ({
  name: suspectName(props.game, props.game.culprit),
  role: t(`roles.${props.game.suspects[props.game.culprit]}`),
}))

const modalTitle = computed(() => {
  switch (modal.value?.kind) {
    case 'accuse':
      return t('ui.whoIsGuilty')
    case 'wrong':
      return t('ui.falseLead')
    case 'end':
      return modal.value.won ? t('ui.solved') : t('ui.closed')
    default:
      return ''
  }
})

function accuse(index: number) {
  if (index === props.game.culprit) return end(true)
  accusationsLeft.value--
  if (accusationsLeft.value <= 0) return end(false)
  playSound('wrong')
  modal.value = { kind: 'wrong', suspect: index }
}

function end(won: boolean) {
  finished.value = true
  const seconds = Math.round((Date.now() - startedAt) / 1000)
  unlocked.value = recordGame({
    size: props.game.size,
    won,
    seconds,
    accusations: MAX_ACCUSATIONS - accusationsLeft.value + (won ? 1 : 0),
    daily: props.label.kind === 'daily' ? dayKey(props.label.date) : null,
  })
  modal.value = { kind: 'end', won, seconds }
  playSound(won ? 'win' : 'lose')
  if (unlocked.value.length) playSound('achievement', 0.8)
}
</script>

<template>
  <div class="game">
    <header class="game-header">
      <h1>{{ title }}</h1>
      <div class="game-header-actions">
        <HelpButton />
        <SettingsButton />
        <button class="btn btn-small" @click="emit('menu')">{{ t('ui.menu') }}</button>
      </div>
    </header>

    <nav class="tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'file'" @click="tab = 'file'">{{ t('ui.tabFile') }}</button>
      <button role="tab" :aria-selected="tab === 'notebook'" @click="tab = 'notebook'">
        {{ t('ui.tabNotebook') }}
      </button>
    </nav>

    <div class="panels">
      <CaseFile class="panel" :class="{ active: tab === 'file' }" :game="game" />
      <NoteBook class="panel" :class="{ active: tab === 'notebook' }" :game="game" />
    </div>

    <footer class="game-footer">
      <button v-if="!finished" class="btn btn-accent btn-big" @click="modal = { kind: 'accuse' }">
        {{ t('ui.accuse') }}
      </button>
      <button v-else class="btn btn-accent btn-big" @click="emit('newCase', game.size)">
        {{ t('ui.newCase') }}
      </button>
    </footer>

    <AppModal v-if="modal" :title="modalTitle" @close="modal = null">
      <template v-if="modal.kind === 'accuse'">
        <p class="muted">{{ t('ui.accusationsLeft', { n: accusationsLeft }, accusationsLeft) }}</p>
        <button v-for="(id, i) in game.suspects" :key="id" class="btn" data-sfx="none" @click="accuse(i)">
          {{ suspectName(game, i) }}
        </button>
        <button class="btn btn-ghost" @click="modal = null">{{ t('ui.cancel') }}</button>
      </template>

      <template v-else-if="modal.kind === 'wrong'">
        <p>
          {{ t('ui.alibi', { name: suspectName(game, modal.suspect), n: accusationsLeft }, accusationsLeft) }}
        </p>
        <button class="btn" @click="modal = null">{{ t('ui.resume') }}</button>
      </template>

      <template v-else>
        <p v-if="modal.won">
          {{ t('ui.won', { ...culprit, duration: formatDuration(modal.seconds) }) }}
        </p>
        <p v-else>{{ t('ui.lost', culprit) }}</p>

        <div v-if="unlocked.length" class="unlocked">
          <h3 class="section-title">{{ t('ui.achievementUnlocked') }}</h3>
          <p v-for="id in unlocked" :key="id">★ {{ t(`achievements.${id}.title`) }}</p>
        </div>

        <h3 class="section-title">{{ t('ui.truth') }}</h3>
        <ul class="truth">
          <li v-for="(id, i) in game.suspects" :key="id" :class="{ 'is-culprit': i === game.culprit }">
            {{ suspectName(game, i) }} · {{ roomText(t, game, game.roomOf[i], 'label') }} ·
            {{ itemText(t, game, game.itemOf[i], 'label') }}
          </li>
        </ul>
        <button class="btn btn-accent" @click="emit('newCase', game.size)">{{ t('ui.newCase') }}</button>
        <button class="btn" @click="modal = null">{{ t('ui.reviewFile') }}</button>
        <button class="btn btn-ghost" @click="emit('menu')">{{ t('ui.menu') }}</button>
      </template>
    </AppModal>
  </div>
</template>
