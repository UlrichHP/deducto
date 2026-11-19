<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageSwitch from './LanguageSwitch.vue'

const emit = defineEmits<{ daily: []; random: [size: number] }>()
const { t } = useI18n()
</script>

<template>
  <main class="menu">
    <LanguageSwitch class="menu-lang" />

    <h1 class="logo">DEDUCTO</h1>
    <p class="tagline">{{ t('ui.tagline') }}</p>

    <div class="menu-actions">
      <button class="btn btn-accent" @click="emit('daily')">{{ t('ui.dailyCase') }}</button>
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
