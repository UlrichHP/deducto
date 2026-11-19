/** Player audio preferences, saved to localStorage. */
import { ref, watch } from 'vue'

export interface AudioSettings {
  musicOn: boolean
  /** 0..1 */
  music: number
  sfxOn: boolean
  /** 0..1 */
  sfx: number
}

const STORAGE_KEY = 'deducto.audio'
const DEFAULTS: AudioSettings = { musicOn: true, music: 0.5, sfxOn: true, sfx: 0.7 }

const clamp01 = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)

/** Accepts older saves, which had a single `muted` flag. */
export function normalizeAudioSettings(raw: unknown): AudioSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS }
  const data = raw as Partial<AudioSettings> & { muted?: unknown }
  const legacyOn = data.muted === true ? false : undefined
  return {
    musicOn: bool(data.musicOn ?? legacyOn, DEFAULTS.musicOn),
    music: clamp01(data.music, DEFAULTS.music),
    sfxOn: bool(data.sfxOn ?? legacyOn, DEFAULTS.sfxOn),
    sfx: clamp01(data.sfx, DEFAULTS.sfx),
  }
}

function load(): AudioSettings {
  try {
    return normalizeAudioSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
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
