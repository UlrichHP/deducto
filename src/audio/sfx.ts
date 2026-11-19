/** Sound effects synthesized on the fly: no audio files to download. */
import { getAudio, noiseBuffer, type AudioGraph } from './engine'

export const SOUNDS = ['tap', 'pen', 'strike', 'card', 'wrong', 'win', 'lose', 'achievement'] as const
export type SoundName = (typeof SOUNDS)[number]

interface ToneOptions {
  freq: number
  /** Frequency to glide to by the end of the note. */
  to?: number
  type?: OscillatorType
  start: number
  duration: number
  gain: number
  attack?: number
}

function tone({ ctx, sfx }: AudioGraph, o: ToneOptions) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, o.start)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, o.start + o.duration)
  env.gain.setValueAtTime(0, o.start)
  env.gain.linearRampToValueAtTime(o.gain, o.start + (o.attack ?? 0.005))
  env.gain.exponentialRampToValueAtTime(0.0001, o.start + o.duration)
  osc.connect(env).connect(sfx)
  osc.start(o.start)
  osc.stop(o.start + o.duration + 0.05)
}

interface BurstOptions {
  start: number
  duration: number
  gain: number
  filter: BiquadFilterType
  freq: number
  to?: number
  q?: number
}

function burst({ ctx, sfx }: AudioGraph, o: BurstOptions) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  const filter = ctx.createBiquadFilter()
  filter.type = o.filter
  filter.Q.value = o.q ?? 1
  filter.frequency.setValueAtTime(o.freq, o.start)
  if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, o.start + o.duration)
  const env = ctx.createGain()
  env.gain.setValueAtTime(o.gain, o.start)
  env.gain.exponentialRampToValueAtTime(0.0001, o.start + o.duration)
  src.connect(filter).connect(env).connect(sfx)
  src.start(o.start, Math.random() * 0.5)
  src.stop(o.start + o.duration + 0.05)
}

const RECIPES: Record<SoundName, (g: AudioGraph, t: number) => void> = {
  // Soft click for buttons.
  tap: (g, t) => tone(g, { freq: 700, to: 520, start: t, duration: 0.06, gain: 0.12 }),
  // Pencil mark on paper.
  pen: (g, t) => {
    burst(g, { start: t, duration: 0.05, gain: 0.3, filter: 'bandpass', freq: 3500, q: 2 })
    burst(g, { start: t + 0.04, duration: 0.06, gain: 0.2, filter: 'bandpass', freq: 2800, q: 2 })
  },
  // Line drawn through a clue.
  strike: (g, t) => burst(g, { start: t, duration: 0.18, gain: 0.25, filter: 'bandpass', freq: 1500, to: 4500, q: 1.2 }),
  // Card slid onto the table.
  card: (g, t) => {
    burst(g, { start: t, duration: 0.09, gain: 0.35, filter: 'bandpass', freq: 2200, to: 900, q: 0.8 })
    tone(g, { freq: 180, to: 120, start: t + 0.06, duration: 0.08, gain: 0.12 })
  },
  // Rubber stamp: false lead.
  wrong: (g, t) => {
    burst(g, { start: t, duration: 0.12, gain: 0.5, filter: 'lowpass', freq: 400 })
    tone(g, { freq: 150, to: 60, type: 'triangle', start: t, duration: 0.35, gain: 0.35 })
  },
  // Rising major arpeggio.
  win: (g, t) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone(g, { freq, type: 'triangle', start: t + i * 0.09, duration: 0.6, gain: 0.16 }),
    )
  },
  // Falling minor line.
  lose: (g, t) => {
    ;[392, 311.13, 261.63, 196].forEach((freq, i) =>
      tone(g, { freq, type: 'triangle', start: t + i * 0.18, duration: 0.7, gain: 0.15 }),
    )
  },
  // Two bell strikes.
  achievement: (g, t) => {
    for (const [i, freq] of [1318.5, 1760].entries()) {
      tone(g, { freq, start: t + i * 0.12, duration: 0.9, gain: 0.12 })
      tone(g, { freq: freq * 2.76, start: t + i * 0.12, duration: 0.4, gain: 0.03 })
    }
  },
}

export function isSoundName(value: string): value is SoundName {
  return (SOUNDS as readonly string[]).includes(value)
}

/** Plays a sound if audio is unlocked; silently does nothing otherwise. */
export function playSound(name: SoundName, delay = 0) {
  const graph = getAudio()
  if (!graph || graph.ctx.state !== 'running') return
  RECIPES[name](graph, graph.ctx.currentTime + 0.005 + delay)
}
