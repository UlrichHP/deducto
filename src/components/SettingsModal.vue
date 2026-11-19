<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { audioSettings } from '../audio'
import AppModal from './AppModal.vue'
import LanguageSwitch from './LanguageSwitch.vue'

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const channels = [
  { on: 'musicOn', level: 'music', label: 'settings.music' },
  { on: 'sfxOn', level: 'sfx', label: 'settings.effects' },
] as const

function setLevel(key: 'music' | 'sfx', event: Event) {
  audioSettings.value[key] = Number((event.target as HTMLInputElement).value) / 100
}
</script>

<template>
  <AppModal :title="t('settings.title')" @close="emit('close')">
    <div class="settings">
      <div class="setting-row">
        <span>{{ t('settings.language') }}</span>
        <LanguageSwitch />
      </div>

      <div v-for="c in channels" :key="c.on" class="setting-block">
        <div class="setting-row">
          <span :id="`setting-${c.on}`">{{ t(c.label) }}</span>
          <button
            class="switch"
            role="switch"
            :aria-checked="audioSettings[c.on]"
            :aria-labelledby="`setting-${c.on}`"
            @click="audioSettings[c.on] = !audioSettings[c.on]"
          >
            <span class="switch-thumb" />
          </button>
        </div>
        <div class="slider">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="Math.round(audioSettings[c.level] * 100)"
            :disabled="!audioSettings[c.on]"
            :aria-label="t('settings.volume', { name: t(c.label) })"
            data-sfx="none"
            @input="setLevel(c.level, $event)"
          />
          <output>{{ Math.round(audioSettings[c.level] * 100) }}</output>
        </div>
      </div>
    </div>

    <button class="btn btn-accent" @click="emit('close')">{{ t('settings.close') }}</button>
  </AppModal>
</template>
