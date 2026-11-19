/** Reactive progress saved to localStorage. */
import { ref, watch } from 'vue'
import { normalizeProgress, recordResult, type AchievementId, type GameResult, type Progress } from './progress'

const STORAGE_KEY = 'deducto.progress'

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalizeProgress(raw ? JSON.parse(raw) : null)
  } catch {
    return normalizeProgress(null)
  }
}

export const progress = ref<Progress>(load())

watch(
  progress,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Storage unavailable: progress lasts for this session only.
    }
  },
  { deep: true },
)

/** Records a finished game and returns the achievements it unlocked. */
export function recordGame(result: GameResult): AchievementId[] {
  const { progress: next, unlocked } = recordResult(progress.value, result, new Date())
  progress.value = next
  return unlocked
}
