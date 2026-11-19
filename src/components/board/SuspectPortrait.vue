<script setup lang="ts">
/**
 * Noir silhouette portrait for a suspect: a shared bust plus a distinctive
 * accessory drawn in the accent colour. Decorative; the card carries the name.
 */
import type { SuspectId } from '../../game/data'

defineProps<{ id: SuspectId }>()
</script>

<template>
  <svg class="portrait" viewBox="0 0 64 64" aria-hidden="true">
    <!-- Bust -->
    <path class="ink" d="M6 64C8 50 20 45 32 45s24 5 26 19z" />
    <rect class="ink" x="27.5" y="35" width="9" height="11" rx="3" />
    <ellipse class="ink" cx="32" cy="27" rx="10.5" ry="12.5" />

    <template v-if="id === 'adele'">
      <!-- Hair bun and pearl necklace -->
      <circle class="ink" cx="32" cy="12" r="6" />
      <path class="ink" d="M21 27c0-11 5-15 11-15s11 4 11 15c-2-6-6-9-11-9s-9 3-11 9z" />
      <g class="accent">
        <circle cx="25" cy="48" r="1.4" /><circle cx="28.5" cy="49.5" r="1.4" />
        <circle cx="32" cy="50" r="1.4" /><circle cx="35.5" cy="49.5" r="1.4" />
        <circle cx="39" cy="48" r="1.4" />
      </g>
    </template>

    <template v-else-if="id === 'basile'">
      <!-- Bowler hat and bow tie -->
      <path class="ink" d="M22 19c0-8 4-12 10-12s10 4 10 12z" />
      <ellipse class="ink" cx="32" cy="19" rx="15" ry="3" />
      <path class="accent" d="M26 47l6 3-6 3zM38 47l-6 3 6 3z" />
      <circle class="accent" cx="32" cy="50" r="1.6" />
    </template>

    <template v-else-if="id === 'capucine'">
      <!-- Wide tilted hat with a feather -->
      <ellipse class="ink" cx="31" cy="17" rx="20" ry="4" transform="rotate(-10 31 17)" />
      <path class="ink" d="M23 17c0-7 4-10 9-10s9 3 10 8z" />
      <path class="accent" d="M42 13c6-8 13-8 16-6-5 0-10 3-14 8z" />
      <circle class="accent" cx="22" cy="31" r="1.5" />
    </template>

    <template v-else-if="id === 'desire'">
      <!-- Top hat and spectacles -->
      <rect class="ink" x="23" y="1" width="18" height="14" rx="1.5" />
      <ellipse class="ink" cx="32" cy="15.5" rx="14" ry="2.5" />
      <rect class="accent" x="23" y="11" width="18" height="2.5" />
      <g class="accent-line">
        <circle cx="27.5" cy="27" r="3.2" /><circle cx="36.5" cy="27" r="3.2" />
        <path d="M30.7 27h2.6" />
      </g>
    </template>

    <template v-else-if="id === 'eugenie'">
      <!-- Wide straw hat with a flower -->
      <ellipse class="ink" cx="32" cy="18" rx="22" ry="4.5" />
      <path class="ink" d="M23 18c0-7 4-10 9-10s9 3 9 10z" />
      <g class="accent">
        <circle cx="40" cy="14" r="2.2" /><circle cx="43" cy="12.5" r="2.2" />
        <circle cx="43" cy="16" r="2.2" /><circle cx="46" cy="14.5" r="2.2" />
      </g>
    </template>

    <template v-else-if="id === 'firmin'">
      <!-- Flat cap and a playing card in the breast pocket -->
      <path class="ink" d="M20 21c0-9 6-13 13-13 7 0 11 4 11 9 4 1 7 3 7 4z" />
      <rect class="accent" x="40" y="51" width="7" height="9" rx="1" transform="rotate(12 43 55)" />
      <path class="ink-on-accent" d="M43.4 53.6l1.4 2-1.9 1.5-1.4-2z" />
    </template>

    <template v-else>
      <!-- Doctor: head mirror and stethoscope -->
      <path class="ink" d="M21 24c0-10 5-14 11-14s11 4 11 14c-3-5-6-7-11-7s-8 2-11 7z" />
      <circle class="accent" cx="32" cy="16" r="4" />
      <circle class="ink" cx="32" cy="16" r="1.6" />
      <path class="accent-line" d="M25 46c0 9 7 12 9 7M39 46c0 6-2 9-5 7" />
      <circle class="accent" cx="34" cy="54" r="2" />
    </template>
  </svg>
</template>

