<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { audioSettings } from '../audio'

const { t } = useI18n()

function toggle() {
  audioSettings.value.muted = !audioSettings.value.muted
}
</script>

<template>
  <button
    class="icon-btn"
    :aria-label="audioSettings.muted ? t('audio.unmute') : t('audio.mute')"
    :title="audioSettings.muted ? t('audio.unmute') : t('audio.mute')"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <template v-if="audioSettings.muted">
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </template>
      <template v-else>
        <path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </template>
    </svg>
  </button>
</template>
