import { describe, expect, it } from 'vitest'
import { MAX_SCORE, scoreGame, type ScoreInput } from '../score'

const perfect: ScoreInput = { won: true, size: 5, seconds: 100, accusations: 1, boardCorrect: 10, boardTotal: 10 }

describe('scoreGame', () => {
  it('gives the maximum for a fast first-try solve with a perfect board', () => {
    expect(scoreGame(perfect)).toEqual({ accusation: 500, board: 300, time: 200, total: MAX_SCORE })
  })

  it('scores zero when the case is not solved', () => {
    expect(scoreGame({ ...perfect, won: false }).total).toBe(0)
  })

  it('rewards fewer accusations', () => {
    expect(scoreGame({ ...perfect, accusations: 2 }).accusation).toBe(300)
    expect(scoreGame({ ...perfect, accusations: 3 }).accusation).toBe(100)
  })

  it('pays the board in proportion to correct cards', () => {
    expect(scoreGame({ ...perfect, boardCorrect: 4 }).board).toBe(120)
    expect(scoreGame({ ...perfect, boardCorrect: 0 }).board).toBe(0)
  })

  it('reduces the time bonus after the target time, down to zero', () => {
    expect(scoreGame({ ...perfect, seconds: 180 }).time).toBe(200)
    expect(scoreGame({ ...perfect, seconds: 450 }).time).toBe(100)
    expect(scoreGame({ ...perfect, seconds: 2000 }).time).toBe(0)
  })
})
