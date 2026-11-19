/**
 * Generates a case with exactly one solution.
 *
 * Each suspect was in a different room and held a different item (two
 * permutations). Known to the player: whoever was in the crime room held the
 * murder weapon, so that person is the culprit.
 *
 * Every clue is true. Random clues are drawn until a single configuration
 * remains, then redundant clues are removed to keep the puzzle tight.
 */
import { ITEMS, ROOMS, SUSPECTS, VICTIMS } from './data'
import { mulberry32, randInt, shuffle, type Rng } from './rng'
import type { Case, ClueLogic } from './types'

type ClueType = ClueLogic['type']
type Candidate = readonly [roomOf: number[], itemOf: number[]]

/** Relative draw frequency of each clue type. */
const CLUE_WEIGHTS: Record<ClueType, number> = {
  notRoom: 3,
  notItem: 3,
  roomItem: 2,
  notRoomItem: 2,
  eitherRoom: 2,
}

const WEIGHTED_TYPES = (Object.entries(CLUE_WEIGHTS) as [ClueType, number][]).flatMap(
  ([type, weight]) => Array<ClueType>(weight).fill(type),
)

export const MIN_SUSPECTS = 3
export const MAX_SUSPECTS = Math.min(SUSPECTS.length, ROOMS.length, ITEMS.length)

export function generateCase(size: number, seed: number): Case {
  if (!Number.isInteger(size) || size < MIN_SUSPECTS || size > MAX_SUSPECTS) {
    throw new RangeError(`size must be between ${MIN_SUSPECTS} and ${MAX_SUSPECTS}`)
  }
  const rng = mulberry32(seed)
  const perms = permutations(size)

  const suspects = pick(rng, SUSPECTS, size)
  const rooms = pick(rng, ROOMS, size)
  const items = pick(rng, ITEMS, size)
  const victim = VICTIMS[randInt(rng, VICTIMS.length)]

  const roomOf = perms[randInt(rng, perms.length)]
  const itemOf = perms[randInt(rng, perms.length)]
  const culprit = randInt(rng, size)
  const crimeRoom = roomOf[culprit]
  const weapon = itemOf[culprit]

  const base = initialCandidates(perms, crimeRoom, weapon)
  let candidates = base
  let clues: ClueLogic[] = []
  for (let guard = 0; candidates.length > 1 && guard < 10_000; guard++) {
    const clue = randomTrueClue(rng, size, roomOf, itemOf)
    const filtered = candidates.filter(([rp, ip]) => holds(clue, rp, ip))
    if (filtered.length < candidates.length) {
      candidates = filtered
      clues.push(clue)
    }
  }

  shuffle(rng, clues)
  for (let i = 0; i < clues.length; ) {
    const reduced = clues.filter((_, j) => j !== i)
    if (countSolutions(base, reduced, 2) === 1) clues = reduced
    else i++
  }

  return {
    seed,
    size,
    suspects,
    rooms,
    items,
    victim,
    culprit,
    crimeRoom,
    weapon,
    roomOf,
    itemOf,
    clues: clues.map((clue) => ({ ...clue, variant: rng() < 0.5 ? 0 : 1 })),
  }
}

// --- Solver --------------------------------------------------------------------

/** True if the clue holds for the configuration (roomOf, itemOf). */
export function holds(clue: ClueLogic, roomOf: readonly number[], itemOf: readonly number[]): boolean {
  switch (clue.type) {
    case 'notRoom':
      return roomOf[clue.s] !== clue.r
    case 'notItem':
      return itemOf[clue.s] !== clue.i
    case 'roomItem':
      return itemOf[roomOf.indexOf(clue.r)] === clue.i
    case 'notRoomItem':
      return itemOf[roomOf.indexOf(clue.r)] !== clue.i
    case 'eitherRoom':
      return roomOf[clue.s] === clue.r || roomOf[clue.s] === clue.r2
  }
}

/** Every permutation of [0, k). */
export function permutations(k: number): number[][] {
  if (k === 0) return [[]]
  const out: number[][] = []
  for (const p of permutations(k - 1)) {
    for (let pos = 0; pos <= p.length; pos++) {
      out.push([...p.slice(0, pos), k - 1, ...p.slice(pos)])
    }
  }
  return out
}

/** Configurations consistent with the known fact (whoever was in the crime room held the weapon). */
function initialCandidates(perms: number[][], crimeRoom: number, weapon: number): Candidate[] {
  const out: Candidate[] = []
  for (const rp of perms) {
    const holder = rp.indexOf(crimeRoom)
    for (const ip of perms) {
      if (ip[holder] === weapon) out.push([rp, ip])
    }
  }
  return out
}

function countSolutions(base: readonly Candidate[], clues: readonly ClueLogic[], limit: number): number {
  let count = 0
  for (const [rp, ip] of base) {
    if (clues.every((clue) => holds(clue, rp, ip)) && ++count >= limit) break
  }
  return count
}

// --- Clue drawing ----------------------------------------------------------------

function randomTrueClue(rng: Rng, size: number, roomOf: number[], itemOf: number[]): ClueLogic {
  const type = WEIGHTED_TYPES[randInt(rng, WEIGHTED_TYPES.length)]
  const s = randInt(rng, size)
  const other = (x: number) => {
    const v = randInt(rng, size - 1)
    return v < x ? v : v + 1
  }
  switch (type) {
    case 'notRoom':
      return { type, s, r: other(roomOf[s]) }
    case 'notItem':
      return { type, s, i: other(itemOf[s]) }
    case 'roomItem':
      return { type, r: roomOf[s], i: itemOf[s] }
    case 'notRoomItem':
      return { type, r: roomOf[s], i: other(itemOf[s]) }
    case 'eitherRoom': {
      const decoy = other(roomOf[s])
      return rng() < 0.5
        ? { type, s, r: roomOf[s], r2: decoy }
        : { type, s, r: decoy, r2: roomOf[s] }
    }
  }
}

function pick<T>(rng: Rng, pool: readonly T[], count: number): T[] {
  return shuffle(rng, [...pool]).slice(0, count)
}
