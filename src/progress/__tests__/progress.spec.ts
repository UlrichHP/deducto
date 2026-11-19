import { describe, expect, it } from 'vitest'
import {
  bestScore,
  currentStreak,
  emptyProgress,
  normalizeProgress,
  rankInfo,
  recordResult,
  type GameResult,
  type Progress,
} from '../progress'

const NOW = new Date('2026-11-19T12:00:00')

function play(p: Progress, overrides: Partial<GameResult> = {}) {
  return recordResult(p, { size: 5, won: true, seconds: 300, accusations: 2, daily: null, boardCorrect: 4, boardTotal: 10, score: 500, ...overrides }, NOW)
}

describe('recordResult', () => {
  it('counts wins, losses and best time per size', () => {
    let p = emptyProgress()
    p = play(p, { seconds: 200 }).progress
    p = play(p, { seconds: 150 }).progress
    p = play(p, { won: false, accusations: 3 }).progress
    expect(p.solved).toBe(2)
    expect(p.failed).toBe(1)
    expect(p.bySize[5]).toEqual({ solved: 2, failed: 1, bestSeconds: 150, bestScore: 500 })
  })

  it('does not mutate the previous progress', () => {
    const p = emptyProgress()
    play(p)
    expect(p).toEqual(emptyProgress())
  })

  it('unlocks achievements once', () => {
    const first = play(emptyProgress(), { accusations: 1 })
    expect(first.unlocked).toEqual(expect.arrayContaining(['firstCase', 'sharpEye']))
    expect(play(first.progress, { accusations: 1 }).unlocked).not.toContain('firstCase')
  })

  it('grants speed achievements only on 5+ suspects', () => {
    expect(play(emptyProgress(), { size: 4, seconds: 30 }).unlocked).not.toContain('lightning')
    expect(play(emptyProgress(), { size: 5, seconds: 55 }).unlocked).toEqual(
      expect.arrayContaining(['quickWit', 'lightning']),
    )
  })
})

describe('case board and score', () => {
  it('counts perfect boards on solved cases only', () => {
    let p = play(emptyProgress(), { boardCorrect: 10 }).progress
    p = play(p, { won: false, accusations: 3, boardCorrect: 10 }).progress
    expect(p.perfectBoards).toBe(1)
  })

  it('unlocks board and score achievements', () => {
    const { unlocked } = play(emptyProgress(), { boardCorrect: 10, score: 1000, accusations: 1 })
    expect(unlocked).toEqual(expect.arrayContaining(['perfectBoard', 'masterpiece']))
    expect(play(emptyProgress(), { score: 999 }).unlocked).not.toContain('masterpiece')
  })

  it('keeps the best score per size and overall', () => {
    let p = play(emptyProgress(), { score: 640 }).progress
    p = play(p, { score: 410 }).progress
    p = play(p, { size: 4, score: 720 }).progress
    expect(p.bySize[5].bestScore).toBe(640)
    expect(bestScore(p)).toBe(720)
    expect(bestScore(emptyProgress())).toBeNull()
  })

  it('loads older saves without scores', () => {
    const old = normalizeProgress({ solved: 2, bySize: { 5: { solved: 2, failed: 0, bestSeconds: 90 } } })
    expect(old.perfectBoards).toBe(0)
    expect(bestScore(old)).toBeNull()
    expect(play(old, { score: 300 }).progress.bySize[5].bestScore).toBe(300)
  })
})

describe('daily streak', () => {
  it('grows on consecutive days, resets after a gap or a loss', () => {
    let p = emptyProgress()
    p = play(p, { daily: '2026-11-17' }).progress
    p = play(p, { daily: '2026-11-18' }).progress
    const third = play(p, { daily: '2026-11-19' })
    expect(third.progress.streak).toMatchObject({ current: 3, best: 3 })
    expect(third.unlocked).toContain('streak3')

    p = play(third.progress, { daily: '2026-11-21' }).progress
    expect(p.streak).toMatchObject({ current: 1, best: 3 })

    p = play(p, { daily: '2026-11-22', won: false, accusations: 3 }).progress
    expect(p.streak.current).toBe(0)
  })

  it('ignores replays of the same daily case', () => {
    const once = play(emptyProgress(), { daily: '2026-11-19' }).progress
    const twice = play(once, { daily: '2026-11-19' })
    expect(twice.progress).toBe(once)
    expect(twice.unlocked).toEqual([])
  })

  it('reports a broken streak as zero', () => {
    const p = play(emptyProgress(), { daily: '2026-11-15' }).progress
    expect(currentStreak(p, '2026-11-16')).toBe(1)
    expect(currentStreak(p, '2026-11-17')).toBe(0)
  })
})

describe('rankInfo', () => {
  it('reports the current rank and progress to the next one', () => {
    expect(rankInfo(0)).toMatchObject({ current: 'rookie', next: 'constable', nextAt: 3, ratio: 0 })
    expect(rankInfo(17)).toMatchObject({ current: 'inspector', next: 'detective', nextAt: 25 })
    expect(rankInfo(17).ratio).toBeCloseTo(7 / 15)
    expect(rankInfo(250)).toMatchObject({ current: 'commissioner', next: null, ratio: 1 })
  })
})

describe('normalizeProgress', () => {
  it('fills missing fields and survives garbage', () => {
    expect(normalizeProgress('nope')).toEqual(emptyProgress())
    expect(normalizeProgress({ solved: 4 })).toMatchObject({ solved: 4, streak: { current: 0 } })
  })
})
