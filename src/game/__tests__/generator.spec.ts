import { describe, expect, it } from 'vitest'
import { generateCase, holds, permutations } from '../generator'
import type { Case, ClueLogic } from '../types'

/** Independent brute-force solver (known fact + clues). */
function solutions(game: Case, clues: readonly ClueLogic[]) {
  const perms = permutations(game.size)
  const found: [number[], number[]][] = []
  for (const rp of perms) {
    for (const ip of perms) {
      if (ip[rp.indexOf(game.crimeRoom)] !== game.weapon) continue
      if (clues.every((c) => holds(c, rp, ip))) found.push([rp, ip])
    }
  }
  return found
}

describe('generateCase', () => {
  it('is deterministic for a given seed', () => {
    expect(generateCase(5, 1234)).toEqual(generateCase(5, 1234))
    expect(generateCase(5, 1234)).not.toEqual(generateCase(5, 1235))
  })

  it('rejects out-of-range sizes', () => {
    expect(() => generateCase(2, 1)).toThrow(RangeError)
    expect(() => generateCase(8, 1)).toThrow(RangeError)
  })

  it.each([
    [3, 30],
    [4, 30],
    [5, 30],
    [6, 3],
  ])('produces a uniquely solvable case with no redundant clue (%i suspects)', (size, runs) => {
    for (let seed = 1; seed <= runs; seed++) {
      const game = generateCase(size, seed)

      expect(game.roomOf[game.culprit]).toBe(game.crimeRoom)
      expect(game.itemOf[game.culprit]).toBe(game.weapon)
      expect(solutions(game, game.clues)).toEqual([[game.roomOf, game.itemOf]])

      game.clues.forEach((_, i) => {
        const without = game.clues.filter((_, j) => j !== i)
        expect(solutions(game, without).length).toBeGreaterThan(1)
      })
    }
  })
})
