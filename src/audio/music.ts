/**
 * Generative "noir" background music: a slow minor jazz progression with a
 * soft pad, walking bass, brushes and a sparse improvised melody. Notes are
 * scheduled a little ahead of time on the audio clock (lookahead scheduler).
 */
import { getAudio, midiToHz, noiseBuffer, type AudioGraph } from './engine'

const BPM = 68
const BEAT = 60 / BPM
const BAR = 4 * BEAT
const LOOKAHEAD = 1.5 // seconds scheduled in advance
const TICK_MS = 250

/** i – iv – iiø – V7 in A minor, one bar each (MIDI notes). */
const PROGRESSION = [
  { pad: [57, 60, 64, 67, 71], bass: [45, 48, 52, 50] }, // Am9
  { pad: [50, 53, 57, 60, 64], bass: [50, 53, 57, 55] }, // Dm9
  { pad: [47, 50, 53, 57], bass: [47, 50, 53, 52] }, // Bm7b5
  { pad: [52, 56, 59, 62, 65], bass: [52, 56, 59, 56] }, // E7b9
]

/** A minor blues scale, upper register. */
const MELODY_NOTES = [69, 72, 74, 75, 76, 79, 81, 84]
const MELODY_CHANCE = 0.2

let timer: ReturnType<typeof setInterval> | null = null
let fader: GainNode | null = null
let nextBarTime = 0
let barIndex = 0

function pad(g: AudioGraph, out: AudioNode, notes: number[], start: number) {
  const { ctx } = g
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.05, start + 0.8)
  env.gain.setValueAtTime(0.05, start + BAR - 0.3)
  env.gain.linearRampToValueAtTime(0, start + BAR + 0.6)
  filter.connect(env).connect(out)
  for (const note of notes) {
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = midiToHz(note)
      osc.detune.value = detune
      osc.connect(filter)
      osc.start(start)
      osc.stop(start + BAR + 0.7)
    }
  }
}

function pluck(g: AudioGraph, out: AudioNode, note: number, start: number, length: number, gain: number, type: OscillatorType) {
  const { ctx } = g
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = midiToHz(note)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(gain, start + 0.02)
  env.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(env).connect(out)
  osc.start(start)
  osc.stop(start + length + 0.05)
}

function brush(g: AudioGraph, out: AudioNode, start: number, gain: number) {
  const { ctx } = g
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 6000
  const env = ctx.createGain()
  env.gain.setValueAtTime(gain, start)
  env.gain.exponentialRampToValueAtTime(0.0001, start + 0.15)
  src.connect(filter).connect(env).connect(out)
  src.start(start, Math.random() * 0.5)
  src.stop(start + 0.2)
}

function scheduleBar(g: AudioGraph, out: AudioNode, bar: (typeof PROGRESSION)[number], start: number) {
  pad(g, out, bar.pad, start)
  bar.bass.forEach((note, beat) => pluck(g, out, note, start + beat * BEAT, BEAT * 0.9, 0.14, 'triangle'))
  for (let beat = 0; beat < 4; beat++) {
    const t = start + beat * BEAT
    brush(g, out, t, beat % 2 ? 0.03 : 0.015)
    brush(g, out, t + BEAT * (2 / 3), 0.012) // swung offbeat
  }
  for (let eighth = 0; eighth < 8; eighth++) {
    if (Math.random() > MELODY_CHANCE) continue
    const swing = eighth % 2 ? BEAT * (2 / 3) : 0
    const t = start + Math.floor(eighth / 2) * BEAT + swing
    const note = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)]
    pluck(g, out, note, t, BEAT * 1.2, 0.05, 'sine')
  }
}

function tick() {
  const g = getAudio()
  if (!g || !fader) return
  while (nextBarTime < g.ctx.currentTime + LOOKAHEAD) {
    scheduleBar(g, fader, PROGRESSION[barIndex % PROGRESSION.length], nextBarTime)
    nextBarTime += BAR
    barIndex++
  }
}

export function isMusicPlaying(): boolean {
  return timer !== null
}

/** Starts the loop with a fade-in. No-op if audio is locked or already playing. */
export function startMusic() {
  const g = getAudio()
  if (!g || timer) return
  fader = g.ctx.createGain()
  fader.gain.setValueAtTime(0, g.ctx.currentTime)
  fader.gain.linearRampToValueAtTime(1, g.ctx.currentTime + 3)
  fader.connect(g.music)
  nextBarTime = g.ctx.currentTime + 0.1
  barIndex = 0
  tick()
  timer = setInterval(tick, TICK_MS)
}

/** Fades the loop out, then releases its nodes. */
export function stopMusic() {
  const g = getAudio()
  if (!timer) return
  clearInterval(timer)
  timer = null
  const old = fader
  fader = null
  if (!g || !old) return
  old.gain.cancelScheduledValues(g.ctx.currentTime)
  old.gain.setTargetAtTime(0, g.ctx.currentTime, 0.3)
  setTimeout(() => old.disconnect(), 2500)
}
