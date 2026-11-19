import { describe, expect, it } from 'vitest'
import { emptyBoard, placeCard } from '../board'
import { boardConflicts, cycleMark, emptyMarks, excludedColumns, NO, YES } from '../notebook'

describe('cycleMark', () => {
  it('cycles empty → no → yes → empty', () => {
    const marks = emptyMarks(3)
    expect(cycleMark(marks, 'rooms', 0, 0)).toBe(NO)
    expect(cycleMark(marks, 'rooms', 0, 0)).toBe(YES)
    expect(cycleMark(marks, 'rooms', 0, 0)).toBe(0)
  })

  it('crosses out the rest of the row and column without overwriting marks', () => {
    const marks = emptyMarks(3)
    marks.rooms[1][1] = YES
    marks.rooms[0][2] = YES
    cycleMark(marks, 'rooms', 0, 1) // → no
    cycleMark(marks, 'rooms', 0, 1) // → yes
    expect(marks.rooms[0]).toEqual([NO, YES, YES])
    expect(marks.rooms[1]).toEqual([0, YES, 0])
    expect(marks.rooms[2]).toEqual([0, NO, 0])
  })
})

describe('board and notebook', () => {
  it('flags a suspect placed in a room the notes exclude', () => {
    const marks = emptyMarks(3)
    marks.rooms[0][1] = NO
    const board = placeCard(emptyBoard(3), 'suspect', 0, 1)
    expect(boardConflicts(board, marks).suspect).toEqual([false, true, false])
  })

  it('flags a suspect placed where the notes put someone else, or put them elsewhere', () => {
    const marks = emptyMarks(3)
    marks.rooms[2][0] = YES
    let board = placeCard(emptyBoard(3), 'suspect', 1, 0)
    board = placeCard(board, 'suspect', 2, 1)
    expect(boardConflicts(board, marks).suspect).toEqual([true, true, false])
  })

  it('flags an item the notes say its room occupant did not hold', () => {
    const marks = emptyMarks(3)
    marks.items[0][2] = NO
    let board = placeCard(emptyBoard(3), 'suspect', 0, 1)
    board = placeCard(board, 'item', 2, 1)
    board = placeCard(board, 'item', 1, 0)
    expect(boardConflicts(board, marks).item).toEqual([false, true, false])
  })

  it('lists excluded columns for a card being placed', () => {
    const marks = emptyMarks(3)
    marks.rooms[1][0] = NO
    marks.items[2][0] = NO
    const board = placeCard(emptyBoard(3), 'suspect', 2, 1)
    expect(excludedColumns(board, marks, 'suspect', 1)).toEqual([true, false, false])
    expect(excludedColumns(board, marks, 'item', 0)).toEqual([false, true, false])
  })

  it('reports nothing when the notebook is empty', () => {
    const board = placeCard(placeCard(emptyBoard(3), 'suspect', 0, 0), 'item', 0, 0)
    expect(boardConflicts(board, emptyMarks(3))).toEqual({ suspect: [false, false, false], item: [false, false, false] })
  })
})
