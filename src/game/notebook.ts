/**
 * Notebook grids (suspect × room, suspect × item) and how they relate to the
 * case board. The notebook is the player's source of exclusions; the board
 * only reads it, to flag placements that contradict the player's own notes.
 */
import type { BoardState } from './board'

/** 0 = empty, 1 = no (✕), 2 = yes (●) */
export type Mark = 0 | 1 | 2
export const EMPTY: Mark = 0
export const NO: Mark = 1
export const YES: Mark = 2

export type GridId = 'rooms' | 'items'
/** marks[grid][suspect][room or item] */
export type Marks = Record<GridId, Mark[][]>

export function emptyMarks(size: number): Marks {
  const grid = () => Array.from({ length: size }, () => Array<Mark>(size).fill(EMPTY))
  return { rooms: grid(), items: grid() }
}

/**
 * Cycles a cell empty → no → yes → empty, in place. Setting "yes" crosses out
 * the still-empty cells of its row and column; it never overwrites a mark.
 */
export function cycleMark(marks: Marks, grid: GridId, row: number, col: number): Mark {
  const g = marks[grid]
  const next = ((g[row][col] + 1) % 3) as Mark
  g[row][col] = next
  if (next === YES) {
    for (let k = 0; k < g.length; k++) {
      if (k !== col && g[row][k] === EMPTY) g[row][k] = NO
      if (k !== row && g[k][col] === EMPTY) g[k][col] = NO
    }
  }
  return next
}

/** True if the notes rule out suspect s being in room r. */
export function suspectExcludedFromRoom(marks: Marks, s: number, r: number): boolean {
  const g = marks.rooms
  if (g[s][r] === NO) return true
  return g[s].some((m, other) => other !== r && m === YES) || g.some((row, other) => other !== s && row[r] === YES)
}

/** True if the notes rule out suspect s holding item i. */
export function suspectExcludedFromItem(marks: Marks, s: number, i: number): boolean {
  const g = marks.items
  if (g[s][i] === NO) return true
  return g[s].some((m, other) => other !== i && m === YES) || g.some((row, other) => other !== s && row[i] === YES)
}

/** Board slots whose card contradicts the notebook, by kind and column. */
export function boardConflicts(board: BoardState, marks: Marks): { suspect: boolean[]; item: boolean[] } {
  return {
    suspect: board.suspect.map((s, room) => s !== null && suspectExcludedFromRoom(marks, s, room)),
    item: board.item.map((i, room) => {
      const s = board.suspect[room]
      return i !== null && s !== null && suspectExcludedFromItem(marks, s, i)
    }),
  }
}

/** Columns (rooms) where placing this card would contradict the notebook. */
export function excludedColumns(board: BoardState, marks: Marks, kind: 'suspect' | 'item', card: number): boolean[] {
  return board.suspect.map((placed, room) =>
    kind === 'suspect'
      ? suspectExcludedFromRoom(marks, card, room)
      : placed !== null && suspectExcludedFromItem(marks, placed, card),
  )
}
