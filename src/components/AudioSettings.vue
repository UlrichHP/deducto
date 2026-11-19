<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { audioSettings } from '../audio'
import SoundToggle from './SoundToggle.vue'

const { t } = useI18n()

const sliders = [
  { key: 'music', label: 'audio.music' },
  { key: 'sfx', label: 'audio.effects' },
] as const

function update(key: 'music' | 'sfx', event: Event) {
  audioSettings.value[key] = Number((event.target as HTMLInputElement).value) / 100
  if (audioSettings.value[key] > 0) audioSettings.value.muted = false
}
</script>

<template>
  <section class="audio-settings">
    <div class="audio-settings-head">
      <h2 class="section-title">{{ t('audio.title') }}</h2>
      <SoundToggle />
    </div>
    <label v-for="s in sliders" :key="s.key" class="slider">
      <span>{{ t(s.label) }}</span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        :value="Math.round(audioSettings[s.key] * 100)"
        :disabled="audioSettings.muted"
        data-sfx="none"
        @input="update(s.key, $event)"
      />
      <output>{{ Math.round(audioSettings[s.key] * 100) }}</output>
    </label>
  </section>
</template>
