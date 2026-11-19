/**
 * Generative dreamlike "noir" background music: a hypnotic music-box arpeggio
 * bouncing between left and right, wide wobbling pads, an octave shimmer that
 * lives only in a very long reverb, a low drone, soft bass, rare vibraphone
 * notes and faint vinyl hiss. Notes are scheduled ahead of time on the audio
 * clock (lookahead scheduler).
 */
import { getAudio, midiToHz, noiseBuffer, type AudioGraph } from './engine'

const BPM = 46
const BEAT = 60 / BPM
const EIGHTH = BEAT / 2
/** Each chord lasts two bars. */
const CHORD_LENGTH = 8 * BEAT
const LOOKAHEAD = 2.5 // seconds scheduled in advance
const TICK_MS = 300

/** i9 – VImaj7#11 – iv9 – V7b9 in A minor. MIDI notes. */
const PROGRESSION = [
  { pad: [57, 60, 64, 67, 71], root: 45, arp: [81, 84, 88, 91, 95] }, // Am9
  { pad: [53, 57, 60, 64, 71], root: 41, arp: [77, 81, 84, 88, 95] }, // Fmaj7#11
  { pad: [50, 53, 57, 60, 64], root: 38, arp: [74, 77, 81, 84, 88] }, // Dm9
  { pad: [52, 56, 59, 62, 65], root: 40, arp: [76, 80, 83, 86, 89] }, // E7b9
]

/** Up-and-down pattern over the five arpeggio notes, one per eighth note. */
const ARP_PATTERN = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 1, 3, 2, 4, 3, 1]

/** A harmonic minor, vibraphone register. */
const MELODY_SCALE = [69, 71, 72, 74, 76, 77, 80, 81]

/** Long-lived nodes for one playback session. */
interface Rig {
  fader: GainNode
  dry: GainNode
  reverb: ConvolverNode
  echo: AudioNode
  /** Slow pitch wobble applied to every pad voice ("worn tape"). */
  wobble: GainNode
  sustained: AudioScheduledSourceNode[]
  nodes: AudioNode[]
}

let rig: Rig | null = null
let timer: ReturnType<typeof setInterval> | null = null
let nextChordTime = 0
let chordIndex = 0

const randomInt = (n: number) => Math.floor(Math.random() * n)
const pick = <T>(items: readonly T[]) => items[randomInt(items.length)]

/** Synthetic stereo hall impulse: decaying noise, different per channel. */
function hallImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
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
  const gain = (value: number) => {
    const node = track(ctx.createGain())
    node.gain.value = value
    return node
  }
  const panner = (pan: number) => {
    const node = track(ctx.createStereoPanner())
    node.pan.value = pan
    return node
  }

  const fader = gain(0)
  fader.gain.setValueAtTime(0, now)
  fader.gain.linearRampToValueAtTime(1, now + 5)
  fader.connect(g.music)

  const dry = gain(0.55)
  dry.connect(fader)

  const reverb = track(ctx.createConvolver())
  reverb.buffer = hallImpulse(ctx, 7, 3.2)
  reverb.connect(gain(0.8)).connect(fader)

  // Ping-pong echo: repeats alternate left and right, darker each time.
  const echoIn = gain(1)
  const left = track(ctx.createDelay(3))
  const right = track(ctx.createDelay(3))
  left.delayTime.value = BEAT * 0.75
  right.delayTime.value = BEAT * 0.75
  const tone = track(ctx.createBiquadFilter())
  tone.type = 'lowpass'
  tone.frequency.value = 3000
  const feedbackLeft = gain(0.5)
  const feedbackRight = gain(0.5)
  echoIn.connect(tone).connect(left)
  left.connect(feedbackLeft).connect(right)
  right.connect(feedbackRight).connect(left)
  const echoOut = gain(0.45)
  left.connect(panner(-0.85)).connect(echoOut)
  right.connect(panner(0.85)).connect(echoOut)
  echoOut.connect(fader)
  echoOut.connect(reverb)

  // Pitch wobble shared by the pads.
  const wobbleLfo = ctx.createOscillator()
  wobbleLfo.frequency.value = 0.13
  const wobble = gain(7) // cents
  wobbleLfo.connect(wobble)
  sustained.push(wobbleLfo)

  // Low drone on A whose filter slowly breathes.
  const droneFilter = track(ctx.createBiquadFilter())
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 280
  const droneLfo = ctx.createOscillator()
  droneLfo.frequency.value = 0.035
  droneLfo.connect(gain(140)).connect(droneFilter.frequency)
  sustained.push(droneLfo)
  const droneOut = gain(0.05)
  droneFilter.connect(droneOut)
  droneOut.connect(dry)
  droneOut.connect(reverb)
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
  hiss.connect(hissFilter).connect(gain(0.005)).connect(fader)
  sustained.push(hiss)

  for (const source of sustained) source.start(now)
  return { fader, dry, reverb, echo: echoIn, wobble, sustained, nodes }
}

/** Connects a voice to the dry bus and sends part of it to the hall. */
function route(g: AudioGraph, r: Rig, voice: AudioNode, reverbSend: number, dryLevel = 1) {
  if (dryLevel > 0) {
    const level = g.ctx.createGain()
    level.gain.value = dryLevel
    voice.connect(level).connect(r.dry)
  }
  const send = g.ctx.createGain()
  send.gain.value = reverbSend
  voice.connect(send).connect(r.reverb)
}

/** Wide, slowly opening pad; each note has a voice on each side. */
function pad(g: AudioGraph, r: Rig, notes: number[], start: number) {
  const { ctx } = g
  const end = start + CHORD_LENGTH
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 0.5
  filter.frequency.setValueAtTime(400, start)
  filter.frequency.linearRampToValueAtTime(950, start + CHORD_LENGTH * 0.6)
  filter.frequency.linearRampToValueAtTime(450, end + 3)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.022, start + 3.5)
  env.gain.setValueAtTime(0.022, end - 0.5)
  env.gain.linearRampToValueAtTime(0, end + 4)
  filter.connect(env)
  route(g, r, env, 0.9, 0.8)
  for (const note of notes) {
    for (const [detune, side] of [
      [-8, -0.7],
      [8, 0.7],
    ]) {
      const osc = ctx.createOscillator()
      osc.type = side < 0 ? 'triangle' : 'sine'
      osc.frequency.value = midiToHz(note)
      osc.detune.value = detune
      r.wobble.connect(osc.detune)
      const pan = ctx.createStereoPanner()
      pan.pan.value = side
      osc.connect(pan).connect(filter)
      osc.start(start)
      osc.stop(end + 4.1)
    }
  }

  // Octave shimmer: heard only through the reverb.
  const shimmer = ctx.createGain()
  shimmer.gain.setValueAtTime(0, start)
  shimmer.gain.linearRampToValueAtTime(0.01, start + CHORD_LENGTH * 0.5)
  shimmer.gain.linearRampToValueAtTime(0, end + 2)
  route(g, r, shimmer, 1, 0)
  for (const note of notes.slice(-2)) {
    const osc = ctx.createOscillator()
    osc.frequency.value = midiToHz(note + 12)
    osc.connect(shimmer)
    osc.start(start)
    osc.stop(end + 2.1)
  }
}

function bass(g: AudioGraph, r: Rig, note: number, start: number) {
  const { ctx } = g
  const osc = ctx.createOscillator()
  osc.frequency.value = midiToHz(note)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(0.16, start + 0.4)
  env.gain.exponentialRampToValueAtTime(0.0001, start + CHORD_LENGTH)
  osc.connect(env)
  route(g, r, env, 0.3)
  osc.start(start)
  osc.stop(start + CHORD_LENGTH + 0.1)
}

/** Music-box note: bright, short attack, long ring, panned. */
function musicBox(g: AudioGraph, r: Rig, note: number, start: number, pan: number, level: number) {
  const { ctx } = g
  const freq = midiToHz(note)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(level, start + 0.004)
  env.gain.exponentialRampToValueAtTime(0.0001, start + 1.6)
  const tine = ctx.createOscillator()
  tine.frequency.value = freq
  const overtone = ctx.createOscillator()
  overtone.frequency.value = freq * 3.01
  const overtoneGain = ctx.createGain()
  overtoneGain.gain.setValueAtTime(0.18, start)
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25)
  tine.connect(env)
  overtone.connect(overtoneGain).connect(env)
  const panner = ctx.createStereoPanner()
  panner.pan.value = pan
  env.connect(panner)
  route(g, r, panner, 0.7, 0.7)
  panner.connect(r.echo)
  for (const osc of [tine, overtone]) {
    osc.start(start)
    osc.stop(start + 1.7)
  }
}

/** Rare vibraphone note with motor tremolo. */
function vibraphone(g: AudioGraph, r: Rig, note: number, start: number) {
  const { ctx } = g
  const freq = midiToHz(note)
  const body = ctx.createGain()
  body.gain.setValueAtTime(0, start)
  body.gain.linearRampToValueAtTime(0.045, start + 0.006)
  body.gain.exponentialRampToValueAtTime(0.0001, start + 3.5)
  const tremolo = ctx.createGain()
  tremolo.gain.value = 0.75
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 4
  const depth = ctx.createGain()
  depth.gain.value = 0.25
  lfo.connect(depth).connect(tremolo.gain)
  const fundamental = ctx.createOscillator()
  fundamental.frequency.value = freq
  fundamental.connect(body).connect(tremolo)
  route(g, r, tremolo, 0.8, 0.8)
  tremolo.connect(r.echo)
  for (const osc of [fundamental, lfo]) {
    osc.start(start)
    osc.stop(start + 3.6)
  }
}

function scheduleChord(g: AudioGraph, r: Rig, index: number, start: number) {
  const chord = PROGRESSION[index % PROGRESSION.length]
  pad(g, r, chord.pad, start)
  bass(g, r, chord.root, start)

  // The arpeggio enters after the first two chords, and sometimes rests.
  const arpeggio = index >= 2 && Math.random() < 0.8
  if (arpeggio) {
    ARP_PATTERN.forEach((step, i) => {
      // Notes fade in and out over the two bars, like a passing music box.
      const swell = Math.sin((Math.PI * (i + 0.5)) / ARP_PATTERN.length)
      musicBox(g, r, chord.arp[step], start + i * EIGHTH, i % 2 ? 0.45 : -0.45, 0.012 + 0.02 * swell)
    })
  }

  // A vibraphone note now and then, more often when the music box rests.
  if (Math.random() < (arpeggio ? 0.3 : 0.8)) {
    const tones = chord.pad.map((n) => n + 12).filter((n) => n >= 69 && n <= 81)
    const note = Math.random() < 0.6 && tones.length ? pick(tones) : pick(MELODY_SCALE)
    vibraphone(g, r, note, start + (4 + randomInt(9)) * EIGHTH)
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
