<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsModal from './SettingsModal.vue'

const { t } = useI18n()
const open = ref(false)
</script>

<template>
  <button class="icon-btn" :aria-label="t('settings.open')" :title="t('settings.title')" @click="open = true">
    <Settings :size="22" :stroke-width="1.8" aria-hidden="true" />
  </button>
  <SettingsModal v-if="open" @close="open = false" />
</template>
