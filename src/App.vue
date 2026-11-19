<script setup lang="ts">
import { shallowRef } from 'vue'
import GameScreen, { type CaseLabel } from './components/GameScreen.vue'
import MenuScreen from './components/MenuScreen.vue'
import { generateCase } from './game/generator'
import { hashString } from './game/rng'
import type { Case } from './game/types'

interface Session {
  game: Case
  label: CaseLabel
}

const DAILY_SIZE = 5
const session = shallowRef<Session | null>(null)

function startDaily() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  session.value = {
    game: generateCase(DAILY_SIZE, hashString(`deducto-${day}`)),
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
</script>

<template>
  <MenuScreen v-if="!session" @daily="startDaily" @random="startRandom" />
  <GameScreen
    v-else
    :key="session.game.seed"
    :game="session.game"
    :label="session.label"
    @menu="session = null"
    @new-case="startRandom"
  />
</template>
