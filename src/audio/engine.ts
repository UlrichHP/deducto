/**
 * Shared Web Audio graph: one context, with separate music and effects buses
 * driven by the player's settings. Browsers only allow audio after a user
 * gesture, so the context is created lazily by unlockAudio().
 */
import { watch } from 'vue'
import { audioSettings } from './settings'

export interface AudioGraph {
  ctx: AudioContext
  music: GainNode
  sfx: GainNode
}

/** Headroom so music sits under the sound effects at equal slider values. */
const MUSIC_LEVEL = 0.6

let graph: AudioGraph | null = null

export function getAudio(): AudioGraph | null {
  return graph
}

/** Creates or resumes the audio context. Call it from a user gesture. */
export function unlockAudio(): AudioGraph | null {
  if (graph) {
    if (graph.ctx.state === 'suspended') void graph.ctx.resume()
    return graph
  }
  if (typeof AudioContext === 'undefined') return null
  const ctx = new AudioContext()
  const music = ctx.createGain()
  const sfx = ctx.createGain()
  music.connect(ctx.destination)
  sfx.connect(ctx.destination)
  graph = { ctx, music, sfx }
  applyVolumes()
  return graph
}

function applyVolumes() {
  if (!graph) return
  const { musicOn, music, sfxOn, sfx } = audioSettings.value
  const now = graph.ctx.currentTime
  graph.music.gain.setTargetAtTime(musicOn ? music * MUSIC_LEVEL : 0, now, 0.05)
  graph.sfx.gain.setTargetAtTime(sfxOn ? sfx : 0, now, 0.02)
}

watch(audioSettings, applyVolumes, { deep: true })

/** Shared one-second white-noise buffer for percussive sounds. */
let noise: AudioBuffer | null = null
export function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise?.sampleRate === ctx.sampleRate) return noise
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

export function midiToHz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}
