/**
 * Case score out of 1000: accusation (up to 500), case board accuracy
 * (up to 300) and speed (up to 200). An unsolved case scores 0.
 */

export interface ScoreInput {
  won: boolean
  size: number
  seconds: number
  /** Accusations used, including the winning one. */
  accusations: number
  boardCorrect: number
  boardTotal: number
}

export interface Score {
  accusation: number
  board: number
  time: number
  total: number
}

export const MAX_SCORE = 1000

/** Points by number of accusations used (index 1 = first try). */
const ACCUSATION_POINTS = [0, 500, 300, 100]
export const BOARD_POINTS = 300
const TIME_POINTS = 200

/** Target solving time in seconds; slower solves earn less, down to 0 at 4× the target. */
export const PAR_SECONDS: Record<number, number> = { 3: 60, 4: 120, 5: 180, 6: 300 }

export function scoreGame(input: ScoreInput): Score {
  if (!input.won) return { accusation: 0, board: 0, time: 0, total: 0 }
  const accusation = ACCUSATION_POINTS[input.accusations] ?? 0
  const board = input.boardTotal ? Math.round((BOARD_POINTS * input.boardCorrect) / input.boardTotal) : 0
  const par = PAR_SECONDS[input.size] ?? 180
  const late = Math.max(0, input.seconds - par)
  const time = Math.max(0, Math.round(TIME_POINTS * (1 - late / (3 * par))))
  return { accusation, board, time, total: accusation + board + time }
}
