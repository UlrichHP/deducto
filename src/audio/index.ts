/**
 * Wires audio into the page: unlocks on the first gesture, plays a sound for
 * clicks on buttons (overridable with data-sfx="<name>" or "none"), starts and
 * stops the music with the settings, and pauses everything in the background.
 */
import { watch } from 'vue'
import { getAudio, unlockAudio } from './engine'
import { isMusicPlaying, startMusic, stopMusic } from './music'
import { audioSettings } from './settings'
import { isSoundName, playSound } from './sfx'

export { audioSettings } from './settings'
export { playSound, type SoundName } from './sfx'

const musicWanted = () => audioSettings.value.musicOn && audioSettings.value.music > 0

function syncMusic() {
  if (!getAudio()) return
  if (musicWanted() && !isMusicPlaying()) startMusic()
  else if (!musicWanted() && isMusicPlaying()) stopMusic()
}

function onGesture() {
  if (document.hidden) return
  unlockAudio()
  syncMusic()
}

function onClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null
  const el = target?.closest<HTMLElement>('[data-sfx], button, summary')
  if (!el || (el instanceof HTMLButtonElement && el.disabled)) return
  const name = el.dataset.sfx ?? 'tap'
  if (isSoundName(name)) playSound(name)
}

function onVisibilityChange() {
  const g = getAudio()
  if (!g) return
  if (document.hidden) void g.ctx.suspend()
  else void g.ctx.resume()
}

export function initAudio() {
  window.addEventListener('pointerdown', onGesture, { capture: true })
  window.addEventListener('keydown', onGesture, { capture: true })
  document.addEventListener('click', onClick, { capture: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  watch(audioSettings, syncMusic, { deep: true })
}
