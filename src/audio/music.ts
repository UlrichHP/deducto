/**
 * Generative "noir" background music, slow and haunting: a low drone, dark
 * minor-major and lydian chords, long bass notes, a sparse vibraphone line
 * with echo, uneasy high swells, a large reverb and faint vinyl crackle.
 * Notes are scheduled ahead of time on the audio clock (lookahead scheduler).
 */
import { getAudio, midiToHz, noiseBuffer, type AudioGraph } from './engine'

const BPM = 52
const BEAT = 60 / BPM
/** Each chord lasts two bars. */
const CHORD_LENGTH = 8 * BEAT
const LOOKAHEAD = 2.5 // seconds scheduled in advance
const TICK_MS = 300

/** A minor, with the "film noir" minor-major seventh. MIDI notes. */
const PROGRESSION = [
  { pad: [57, 60, 64, 68, 71], root: 45 }, // Am(maj9)
  { pad: [53, 57, 60, 64, 71], root: 41 }, // Fmaj7#11
  { pad: [50, 53, 57, 60, 64], root: 38 }, // Dm9
  { pad: [52, 56, 59, 62, 65], root: 40 }, // E7b9
]

/** A harmonic minor, vibraphone register. */
const MELODY_SCALE = [69, 71, 72, 74, 76, 77, 80, 81, 83, 84]

/** Long-lived nodes for one playback session. */
interface Rig {
  fader: GainNode
  dry: GainNode
  reverb: ConvolverNode
  echo: DelayNode
  sustained: AudioScheduledSourceNode[]
  nodes: AudioNode[]
}

let rig: Rig | null = null
let timer: ReturnType<typeof setInterval> | null = null
let nextChordTime = 0
let chordIndex = 0

const randomInt = (n: number) => Math.floor(Math.random() * n)
const pick = <T>(items: readonly T[]) => items[randomInt(items.length)]

/** Synthetic stereo hall impulse: decaying noise. */
function hallImpulse(ctx: AudioContext, seconds = 4.5, decay = 2.8): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay
  }
  return buffer
}

function buildRig(g: AudioGraph): Rig {
  const { ctx } = g
  const now = ctx.currentTime
  const nodes: AudioNode[] = []
  const sustained: AudioScheduledSourceNode[] = []
  const track = <T extends AudioNode>(node: T) => (nodes.push(node), node)

  const fader = track(ctx.createGain())
  fader.gain.setValueAtTime(0, now)
  fader.gain.linearRampToValueAtTime(1, now + 4)
  fader.connect(g.music)

  const dry = track(ctx.createGain())
  dry.gain.value = 0.75
  dry.connect(fader)

  const reverb = track(ctx.createConvolver())
  reverb.buffer = hallImpulse(ctx)
  const wet = track(ctx.createGain())
  wet.gain.value = 0.6
  reverb.connect(wet).connect(fader)

  // Dotted-eighth echo, darkened on each repeat, fed into the hall.
  const echo = track(ctx.createDelay(2))
  echo.delayTime.value = BEAT * 0.75
  const echoTone = track(ctx.createBiquadFilter())
  echoTone.type = 'lowpass'
  echoTone.frequency.value = 2200
  const feedback = track(ctx.createGain())
  feedback.gain.value = 0.42
  const echoOut = track(ctx.createGain())
  echoOut.gain.value = 0.5
  echo.connect(echoTone).connect(feedback).connect(echo)
  echoTone.connect(echoOut).connect(fader)
  echoTone.connect(reverb)

  // Drone on A, with a filter that slowly breathes.
  const droneFilter = track(ctx.createBiquadFilter())
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 320
  const droneLfo = ctx.createOscillator()
  droneLfo.frequency.value = 0.04
  const droneLfoDepth = track(ctx.createGain())
  droneLfoDepth.gain.value = 160
  droneLfo.connect(droneLfoDepth).connect(droneFilter.frequency)
  const droneGain = track(ctx.createGain())
  droneGain.gain.value = 0.07
  droneFilter.connect(droneGain)
  droneGain.connect(dry)
  droneGain.connect(reverb)
  sustained.push(droneLfo)
  for (const [note, type] of [
    [33, 'sine'],
    [45, 'triangle'],
    [52, 'sine'],
  ] as const) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = midiToHz(note)
    osc.detune.value = (Math.random() - 0.5) * 8
    osc.connect(droneFilter)
    sustained.push(osc)
  }

  // Faint vinyl hiss.
  const hiss = ctx.createBufferSource()
  hiss.buffer = noiseBuffer(ctx)
  hiss.loop = true
  const hissFilter = track(ctx.createBiquadFilter())
  hissFilter.type = 'bandpass'
  hissFilter.frequency.value = 4000
  hissFilter.Q.value = 0.5
  const hissGain = track(ctx.createGain())
  hissGain.gain.value = 0.008
  hiss.connect(hissFilter).connect(hissGain).connect(fader)
  sustained.push(hiss)

  for (const source of sustained) source.start(now)
  return { fader, dry, reverb, echo, sustained, nodes }
}

/** Connects a voice to the dry bus and sends part of it to the hall. */
function route(r: Rig, g: AudioGraph, voice: AudioNode, reverbSend: number) {
  voice.connect(r.dry)
  const send = g.ctx.createGain()
  send.gain.value = reverbSend
  voice.connect(send).connect(r.reverb)
}

function pad(g: AudioGraph, r: Rig, notes: number[], start: number) {
  const { ctx } = g
  const end = start + CHORD_LENGTH
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 0.7
  filter.frequency.setValueAtTime(450, start)
  filter.frequency.linearRampToValueAtTime(1100, start + CHORD_LENGTH / 2)
  filter.frequency.linearRampToValueAtTime(500, end + 2)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.026, start + 2.5)
  env.gain.setValueAtTime(0.026, end - 0.5)
  env.gain.linearRampToValueAtTime(0, end + 3)
  filter.connect(env)
  route(r, g, env, 0.8)
  for (const note of notes) {
    for (const detune of [-9, 9]) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = midiToHz(note)
      osc.detune.value = detune
      osc.connect(filter)
      osc.start(start)
      osc.stop(end + 3.1)
    }
  }
}

function bass(g: AudioGraph, r: Rig, note: number, start: number) {
  const { ctx } = g
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = midiToHz(note)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 380
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.18, start + 0.08)
  env.gain.exponentialRampToValueAtTime(0.0001, start + CHORD_LENGTH * 0.9)
  osc.connect(filter).connect(env)
  route(r, g, env, 0.35)
  osc.start(start)
  osc.stop(start + CHORD_LENGTH)
}

/** Vibraphone-like note: sine plus a bright partial, with motor tremolo. */
function vibraphone(g: AudioGraph, r: Rig, note: number, start: number) {
  const { ctx } = g
  const freq = midiToHz(note)
  const body = ctx.createGain()
  body.gain.setValueAtTime(0, start)
  body.gain.linearRampToValueAtTime(0.055, start + 0.006)
  body.gain.exponentialRampToValueAtTime(0.0001, start + 3)

  const tremolo = ctx.createGain()
  tremolo.gain.value = 0.75
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 4.5
  const depth = ctx.createGain()
  depth.gain.value = 0.25
  lfo.connect(depth).connect(tremolo.gain)

  const fundamental = ctx.createOscillator()
  fundamental.frequency.value = freq
  const partial = ctx.createOscillator()
  partial.frequency.value = freq * 4
  const partialGain = ctx.createGain()
  partialGain.gain.setValueAtTime(0.25, start)
  partialGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5)

  fundamental.connect(body)
  partial.connect(partialGain).connect(body)
  body.connect(tremolo)
  route(r, g, tremolo, 0.6)
  tremolo.connect(r.echo)

  for (const osc of [fundamental, partial, lfo]) {
    osc.start(start)
    osc.stop(start + 3.1)
  }
}

/** Two close high notes swelling in and out: an unresolved, uneasy shimmer. */
function swell(g: AudioGraph, r: Rig, start: number) {
  const { ctx } = g
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.012, start + CHORD_LENGTH * 0.45)
  env.gain.linearRampToValueAtTime(0, start + CHORD_LENGTH)
  route(r, g, env, 1)
  for (const note of [88, 89]) {
    const osc = ctx.createOscillator()
    osc.frequency.value = midiToHz(note)
    osc.connect(env)
    osc.start(start)
    osc.stop(start + CHORD_LENGTH + 0.1)
  }
}

/** Random vinyl pops across the chord. */
function crackle(g: AudioGraph, r: Rig, start: number) {
  const { ctx } = g
  const count = 2 + randomInt(5)
  for (let i = 0; i < count; i++) {
    const t = start + Math.random() * CHORD_LENGTH
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1500
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.02 + Math.random() * 0.05, t)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.012)
    src.connect(filter).connect(env).connect(r.fader)
    src.start(t, Math.random() * 0.5)
    src.stop(t + 0.02)
  }
}

function scheduleChord(g: AudioGraph, r: Rig, index: number, start: number) {
  const chord = PROGRESSION[index % PROGRESSION.length]
  pad(g, r, chord.pad, start)
  bass(g, r, chord.root, start)
  crackle(g, r, start)
  if (index % 4 === 3) swell(g, r, start)

  // One to three melody notes, mostly chord tones, placed on eighth notes.
  const chordTones = chord.pad.map((n) => n + 12).filter((n) => n >= 69 && n <= 84)
  const slots = new Set<number>()
  const count = 1 + randomInt(3)
  while (slots.size < count) slots.add(2 + randomInt(13))
  for (const slot of [...slots].sort((a, b) => a - b)) {
    const note = Math.random() < 0.6 && chordTones.length ? pick(chordTones) : pick(MELODY_SCALE)
    vibraphone(g, r, note, start + slot * (BEAT / 2))
  }
}

function tick() {
  const g = getAudio()
  if (!g || !rig) return
  while (nextChordTime < g.ctx.currentTime + LOOKAHEAD) {
    scheduleChord(g, rig, chordIndex, nextChordTime)
    nextChordTime += CHORD_LENGTH
    chordIndex++
  }
}

export function isMusicPlaying(): boolean {
  return timer !== null
}

/** Starts the music with a slow fade-in. No-op if audio is locked or already playing. */
export function startMusic() {
  const g = getAudio()
  if (!g || timer) return
  rig = buildRig(g)
  nextChordTime = g.ctx.currentTime + 0.2
  chordIndex = 0
  tick()
  timer = setInterval(tick, TICK_MS)
}

/** Fades the music out, then stops and releases its nodes. */
export function stopMusic() {
  const g = getAudio()
  if (!timer) return
  clearInterval(timer)
  timer = null
  const old = rig
  rig = null
  if (!g || !old) return
  const now = g.ctx.currentTime
  old.fader.gain.cancelScheduledValues(now)
  old.fader.gain.setValueAtTime(old.fader.gain.value, now)
  old.fader.gain.linearRampToValueAtTime(0, now + 1.5)
  setTimeout(() => {
    for (const source of old.sustained) source.stop()
    for (const node of old.nodes) node.disconnect()
  }, 2000)
}
