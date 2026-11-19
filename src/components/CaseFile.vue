<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Case } from '../game/types'
import { clueText, reportText, ruleText, suspectName } from '../i18n/caseText'

const props = defineProps<{ game: Case }>()
const { t } = useI18n()
const struck = reactive(new Set<number>())

const clueTexts = computed(() => props.game.clues.map((clue) => clueText(t, props.game, clue)))

function toggle(index: number) {
  if (struck.has(index)) struck.delete(index)
  else struck.add(index)
}
</script>

<template>
  <section class="case-file">
    <h2 class="section-title">{{ t('ui.policeReport') }}</h2>
    <p>{{ reportText(t, game) }}</p>
    <p class="rule">{{ ruleText(t, game) }}</p>

    <h2 class="section-title">{{ t('ui.suspects') }}</h2>
    <ul class="suspects">
      <li v-for="(id, i) in game.suspects" :key="id">
        <strong>{{ suspectName(game, i) }}</strong>, {{ t(`roles.${id}`) }}
      </li>
    </ul>

    <h2 class="section-title">
      {{ t('ui.clues') }} <small>{{ t('ui.tapToStrike') }}</small>
    </h2>
    <ol class="clues">
      <li v-for="(text, i) in clueTexts" :key="i">
        <button
          class="clue"
          :class="{ struck: struck.has(i) }"
          :aria-pressed="struck.has(i)"
          @click="toggle(i)"
        >
          {{ text }}
        </button>
      </li>
    </ol>
  </section>
</template>
