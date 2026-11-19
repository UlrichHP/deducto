/**
 * Content pools, as language-neutral ids.
 * Display strings (roles, room and item names, phrasing) live in src/i18n.
 */
export const SUSPECTS = ['adele', 'basile', 'capucine', 'desire', 'eugenie', 'firmin', 'gaspard'] as const
export const ROOMS = ['observatory', 'greenhouse', 'wineCellar', 'smokingRoom', 'gallery', 'chapel', 'library'] as const
export const ITEMS = ['poker', 'arsenic', 'letterOpener', 'scarf', 'statuette', 'pistol', 'cord'] as const
export const VICTIMS = ['count', 'baroness', 'professor', 'general'] as const

export type SuspectId = (typeof SUSPECTS)[number]
export type RoomId = (typeof ROOMS)[number]
export type ItemId = (typeof ITEMS)[number]
export type VictimId = (typeof VICTIMS)[number]

/** Suspect names are proper nouns, shared by every locale. */
export const SUSPECT_NAMES: Record<SuspectId, string> = {
  adele: 'Adèle',
  basile: 'Basile',
  capucine: 'Capucine',
  desire: 'Désiré',
  eugenie: 'Eugénie',
  firmin: 'Firmin',
  gaspard: 'Gaspard',
}
