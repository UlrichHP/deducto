/**
 * Case board: the player's own hypothesis of who was where with what.
 * Rooms are fixed columns; each column has one suspect slot and one item slot
 * that hold a card index (or null). It never reveals whether a card is right.
 */

export type CardKind = 'suspect' | 'item'

/** slots[kind][column] = card index placed under that room, or null. */
export type BoardState = Record<CardKind, (number | null)[]>

export function emptyBoard(size: number): BoardState {
  return { suspect: Array(size).fill(null), item: Array(size).fill(null) }
}

/**
 * Puts a card in a slot. A card already on the board moves, swapping with
 * whatever was in the target slot; a card from the tray sends the target's
 * previous card back to the tray.
 */
export function placeCard(state: BoardState, kind: CardKind, card: number, column: number): BoardState {
  const row = [...state[kind]]
  const from = row.indexOf(card)
  if (from === column) return state
  const displaced = row[column]
  row[column] = card
  if (from !== -1) row[from] = displaced
  return { ...state, [kind]: row }
}

export function clearSlot(state: BoardState, kind: CardKind, column: number): BoardState {
  if (state[kind][column] === null) return state
  const row = [...state[kind]]
  row[column] = null
  return { ...state, [kind]: row }
}

/**
 * How many slots hold the right card, given the solution: roomOf[s] is the
 * room of suspect s and itemOf[s] the item they held.
 */
export function boardAccuracy(
  state: BoardState,
  roomOf: readonly number[],
  itemOf: readonly number[],
): { correct: number; total: number } {
  let correct = 0
  roomOf.forEach((room, s) => {
    if (state.suspect[room] === s) correct++
    if (state.item[room] === itemOf[s]) correct++
  })
  return { correct, total: roomOf.length * 2 }
}

/** Cards of a kind not yet on the board, in their original order. */
export function trayCards(state: BoardState, kind: CardKind): number[] {
  const placed = new Set(state[kind])
  return state[kind].map((_, card) => card).filter((card) => !placed.has(card))
}
