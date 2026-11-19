import type { ItemId, RoomId, SuspectId, VictimId } from './data'

/**
 * A logical clue. Indexes refer to the current case: suspects (s),
 * rooms (r, r2) and items (i).
 */
export type ClueLogic =
  | { type: 'notRoom'; s: number; r: number }
  | { type: 'notItem'; s: number; i: number }
  | { type: 'roomItem'; r: number; i: number }
  | { type: 'notRoomItem'; r: number; i: number }
  | { type: 'eitherRoom'; s: number; r: number; r2: number }

/** A clue plus which of the locale's two phrasings to use. */
export type Clue = ClueLogic & { variant: 0 | 1 }

export interface Case {
  seed: number
  size: number
  suspects: SuspectId[]
  rooms: RoomId[]
  items: ItemId[]
  victim: VictimId
  culprit: number
  crimeRoom: number
  weapon: number
  /** roomOf[s] = room of suspect s */
  roomOf: number[]
  /** itemOf[s] = item held by suspect s */
  itemOf: number[]
  clues: Clue[]
}
