/**
 * Player progression, kept on the device: stats, daily streak, rank and
 * achievements. Pure functions only; persistence lives in store.ts.
 */
import { shiftDay } from '../utils/date'

export interface GameResult {
  size: number
  won: boolean
  seconds: number
  /** Accusations used, including the winning one. */
  accusations: number
  /** Day key when this was the daily case, otherwise null. */
  daily: string | null
  /** Case board slots holding the right card, out of boardTotal. */
  boardCorrect: number
  boardTotal: number
  /** Case score out of 1000 (see score.ts). */
  score: number
}

export interface SizeStats {
  solved: number
  failed: number
  bestSeconds: number | null
  bestScore: number | null
}

export interface Progress {
  version: 1
  solved: number
  failed: number
  /** Cases solved with the first accusation. */
  firstTry: number
  /** Cases solved with every board slot right. */
  perfectBoards: number
  bySize: Record<string, SizeStats>
  /** Outcome of each daily case played, by day key. */
  daily: Record<string, 'won' | 'lost'>
  streak: { current: number; best: number; lastDay: string | null }
  /** Unlock date (ISO) of each achievement earned. */
  achievements: Partial<Record<AchievementId, string>>
}

export const ACHIEVEMENTS = [
  'firstCase',
  'tenCases',
  'fiftyCases',
  'hundredCases',
  'sharpEye',
  'flawless',
  'lastChance',
  'quickWit',
  'lightning',
  'dailyFirst',
  'streak3',
  'streak7',
  'streak30',
  'perfectBoard',
  'architect',
  'masterpiece',
] as const
export type AchievementId = (typeof ACHIEVEMENTS)[number]

type AchievementTest = (p: Progress, r: GameResult) => boolean

const ACHIEVEMENT_TESTS: Record<AchievementId, AchievementTest> = {
  firstCase: (p) => p.solved >= 1,
  tenCases: (p) => p.solved >= 10,
  fiftyCases: (p) => p.solved >= 50,
  hundredCases: (p) => p.solved >= 100,
  sharpEye: (_, r) => r.won && r.accusations === 1,
  flawless: (p) => p.firstTry >= 10,
  lastChance: (_, r) => r.won && r.accusations === 3,
  quickWit: (_, r) => r.won && r.size >= 5 && r.seconds <= 120,
  lightning: (_, r) => r.won && r.size >= 5 && r.seconds <= 60,
  dailyFirst: (_, r) => r.won && r.daily !== null,
  streak3: (p) => p.streak.current >= 3,
  streak7: (p) => p.streak.current >= 7,
  streak30: (p) => p.streak.current >= 30,
  perfectBoard: (_, r) => isPerfectBoard(r),
  architect: (p) => p.perfectBoards >= 10,
  masterpiece: (_, r) => r.won && r.score >= 1000,
}

function isPerfectBoard(r: GameResult): boolean {
  return r.won && r.boardTotal > 0 && r.boardCorrect === r.boardTotal
}

/** Ranks by number of cases solved, in ascending order. */
export const RANKS = [
  { id: 'rookie', min: 0 },
  { id: 'constable', min: 3 },
  { id: 'inspector', min: 10 },
  { id: 'detective', min: 25 },
  { id: 'chiefInspector', min: 50 },
  { id: 'commissioner', min: 100 },
] as const
export type RankId = (typeof RANKS)[number]['id']

export function emptyProgress(): Progress {
  return {
    version: 1,
    solved: 0,
    failed: 0,
    firstTry: 0,
    perfectBoards: 0,
    bySize: {},
    daily: {},
    streak: { current: 0, best: 0, lastDay: null },
    achievements: {},
  }
}

/**
 * Applies a finished game. A daily case only counts the first time it is
 * played that day; replays return the progress unchanged.
 */
export function recordResult(
  prev: Progress,
  result: GameResult,
  now: Date,
): { progress: Progress; unlocked: AchievementId[] } {
  if (result.daily && prev.daily[result.daily]) return { progress: prev, unlocked: [] }

  const p: Progress = structuredClone(prev)
  const size = (p.bySize[result.size] ??= { solved: 0, failed: 0, bestSeconds: null, bestScore: null })

  if (result.won) {
    p.solved++
    size.solved++
    if (result.accusations === 1) p.firstTry++
    if (size.bestSeconds === null || result.seconds < size.bestSeconds) size.bestSeconds = result.seconds
    size.bestScore = Math.max(size.bestScore ?? 0, result.score)
    if (isPerfectBoard(result)) p.perfectBoards++
  } else {
    p.failed++
    size.failed++
  }

  if (result.daily) {
    p.daily[result.daily] = result.won ? 'won' : 'lost'
    const s = p.streak
    if (!result.won) s.current = 0
    else if (s.lastDay === shiftDay(result.daily, -1)) s.current++
    else s.current = 1
    s.lastDay = result.daily
    s.best = Math.max(s.best, s.current)
  }

  const unlocked = ACHIEVEMENTS.filter((id) => !p.achievements[id] && ACHIEVEMENT_TESTS[id](p, result))
  for (const id of unlocked) p.achievements[id] = now.toISOString()

  return { progress: p, unlocked }
}

/** Best score across all board sizes, or null before the first solve. */
export function bestScore(p: Progress): number | null {
  const scores = Object.values(p.bySize).map((s) => s.bestScore ?? null).filter((s) => s !== null)
  return scores.length ? Math.max(...scores) : null
}

/** Streak still alive today: the last daily case won was today or yesterday. */
export function currentStreak(p: Progress, today: string): number {
  const { lastDay, current } = p.streak
  return lastDay === today || lastDay === shiftDay(today, -1) ? current : 0
}

export function rankInfo(solved: number) {
  let index = 0
  while (index + 1 < RANKS.length && solved >= RANKS[index + 1].min) index++
  const current = RANKS[index]
  const next = RANKS[index + 1] ?? null
  const ratio = next ? (solved - current.min) / (next.min - current.min) : 1
  return { current: current.id as RankId, next: next?.id ?? null, nextAt: next?.min ?? null, ratio }
}

/** Merges stored data over defaults so older or partial saves still load. */
export function normalizeProgress(raw: unknown): Progress {
  const base = emptyProgress()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<Progress>
  return {
    ...base,
    ...data,
    version: 1,
    streak: { ...base.streak, ...data.streak },
    bySize: { ...data.bySize },
    daily: { ...data.daily },
    achievements: { ...data.achievements },
  }
}
