<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import GameScreen, { type CaseLabel } from './components/GameScreen.vue'
import MenuScreen from './components/MenuScreen.vue'
import ProfileScreen from './components/ProfileScreen.vue'
import { generateCase } from './game/generator'
import { hashString } from './game/rng'
import type { Case } from './game/types'
import { dayKey } from './utils/date'

interface Session {
  game: Case
  label: CaseLabel
}

const DAILY_SIZE = 5
const session = shallowRef<Session | null>(null)
const showProfile = ref(false)

function startDaily() {
  const now = new Date()
  session.value = {
    game: generateCase(DAILY_SIZE, hashString(`deducto-${dayKey(now)}`)),
    label: { kind: 'daily', date: now },
  }
}

function startRandom(size: number) {
  const seed = Math.floor(Math.random() * 2 ** 32)
  session.value = {
    game: generateCase(size, seed),
    label: { kind: 'random', number: String(seed % 10000).padStart(4, '0') },
  }
}

function backToMenu() {
  session.value = null
  showProfile.value = false
}
</script>

<template>
  <GameScreen
    v-if="session"
    :key="session.game.seed"
    :game="session.game"
    :label="session.label"
    @menu="backToMenu"
    @new-case="startRandom"
  />
  <ProfileScreen v-else-if="showProfile" @back="showProfile = false" />
  <MenuScreen v-else @daily="startDaily" @random="startRandom" @profile="showProfile = true" />
</template>
