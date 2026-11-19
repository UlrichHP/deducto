/** Player audio preferences, saved to localStorage. */
import { ref, watch } from 'vue'

export interface AudioSettings {
  /** 0..1 */
  music: number
  /** 0..1 */
  sfx: number
  muted: boolean
}

const STORAGE_KEY = 'deducto.audio'
const DEFAULTS: AudioSettings = { music: 0.5, sfx: 0.7, muted: false }

const clamp01 = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback

function load(): AudioSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<AudioSettings> | null
    if (!raw) return { ...DEFAULTS }
    return {
      music: clamp01(raw.music, DEFAULTS.music),
      sfx: clamp01(raw.sfx, DEFAULTS.sfx),
      muted: raw.muted === true,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export const audioSettings = ref<AudioSettings>(load())

watch(
  audioSettings,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Not persisted; settings still apply to this session.
    }
  },
  { deep: true },
)
