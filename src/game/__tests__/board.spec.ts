import { describe, expect, it } from 'vitest'
import { clearSlot, emptyBoard, placeCard, trayCards } from '../board'

describe('case board', () => {
  it('starts empty with every card in the tray', () => {
    const board = emptyBoard(4)
    expect(board.suspect).toEqual([null, null, null, null])
    expect(trayCards(board, 'suspect')).toEqual([0, 1, 2, 3])
  })

  it('places a card from the tray', () => {
    const board = placeCard(emptyBoard(3), 'suspect', 2, 0)
    expect(board.suspect).toEqual([2, null, null])
    expect(trayCards(board, 'suspect')).toEqual([0, 1])
    expect(board.item).toEqual([null, null, null])
  })

  it('sends the previous card back to the tray when placing from the tray', () => {
    let board = placeCard(emptyBoard(3), 'item', 1, 2)
    board = placeCard(board, 'item', 0, 2)
    expect(board.item).toEqual([null, null, 0])
    expect(trayCards(board, 'item')).toEqual([1, 2])
  })

  it('swaps when moving a card onto an occupied slot', () => {
    let board = placeCard(emptyBoard(3), 'suspect', 0, 0)
    board = placeCard(board, 'suspect', 1, 1)
    board = placeCard(board, 'suspect', 0, 1)
    expect(board.suspect).toEqual([1, 0, null])
  })

  it('moves a card to an empty slot', () => {
    let board = placeCard(emptyBoard(3), 'suspect', 2, 0)
    board = placeCard(board, 'suspect', 2, 1)
    expect(board.suspect).toEqual([null, 2, null])
  })

  it('clears a slot and does not mutate earlier states', () => {
    const placed = placeCard(emptyBoard(2), 'suspect', 1, 0)
    const cleared = clearSlot(placed, 'suspect', 0)
    expect(cleared.suspect).toEqual([null, null])
    expect(placed.suspect).toEqual([1, null])
  })
})
