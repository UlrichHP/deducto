<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'

const { t } = useI18n()
const open = ref(false)

const steps = ['ui.howToRules', 'ui.howToGoal', 'ui.howToNotebook', 'ui.howToBoard', 'ui.howToScore'] as const
</script>

<template>
  <button class="icon-btn" :aria-label="t('ui.howToOpen')" :title="t('ui.howToOpen')" @click="open = true">
    <CircleHelp :size="22" :stroke-width="1.8" aria-hidden="true" />
  </button>
  <AppModal v-if="open" :title="t('ui.howToTitle')" @close="open = false">
    <ol class="howto-steps">
      <li v-for="key in steps" :key="key">{{ t(key) }}</li>
    </ol>
    <button class="btn btn-accent" @click="open = false">{{ t('ui.gotIt') }}</button>
  </AppModal>
</template>
