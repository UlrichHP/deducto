<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, type Locale } from '../i18n'

const { locale, t } = useI18n()

function select(code: Locale) {
  locale.value = code
}
</script>

<template>
  <div class="lang-switch" role="group" :aria-label="t('ui.language')">
    <button
      v-for="code in SUPPORTED_LOCALES"
      :key="code"
      :lang="code"
      :aria-pressed="locale === code"
      @click="select(code)"
    >
      {{ code.toUpperCase() }}
    </button>
  </div>
</template>
