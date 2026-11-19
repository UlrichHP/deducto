<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = useTemplateRef<HTMLElement>('dialog')

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  dialog.value?.querySelector<HTMLElement>('button')?.focus()
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section ref="dialog" class="modal" role="dialog" aria-modal="true" :aria-label="title">
      <h2>{{ title }}</h2>
      <slot />
    </section>
  </div>
</template>
