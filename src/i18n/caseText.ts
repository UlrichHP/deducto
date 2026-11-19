/**
 * Turns a case's language-neutral data into sentences of the current locale.
 * Takes the `t` function so callers stay reactive to locale changes.
 */
import type { Composer } from 'vue-i18n'
import { SUSPECT_NAMES } from '../game/data'
import type { Case, Clue } from '../game/types'
import { capitalize } from '../utils/text'

type Translate = Composer['t']

const VARIANT_KEYS = ['a', 'b'] as const

export function suspectName(game: Case, index: number): string {
  return SUSPECT_NAMES[game.suspects[index]]
}

export function roomText(t: Translate, game: Case, index: number, field: 'label' | 'phrase' = 'phrase'): string {
  return t(`rooms.${game.rooms[index]}.${field}`)
}

export function itemText(t: Translate, game: Case, index: number, field: 'label' | 'phrase' = 'phrase'): string {
  return t(`items.${game.items[index]}.${field}`)
}

export function clueText(t: Translate, game: Case, clue: Clue): string {
  const named: Record<string, string> = {}
  if ('s' in clue) named.who = suspectName(game, clue.s)
  if ('r' in clue) named.room = roomText(t, game, clue.r)
  if ('r2' in clue) named.room2 = roomText(t, game, clue.r2)
  if ('i' in clue) named.item = itemText(t, game, clue.i)
  return capitalize(t(`clues.${clue.type}.${VARIANT_KEYS[clue.variant]}`, named))
}

export function reportText(t: Translate, game: Case): string {
  const gender = t(`victims.${game.victim}.gender`)
  return capitalize(
    t(`report.${gender}`, {
      victim: t(`victims.${game.victim}.name`),
      room: roomText(t, game, game.crimeRoom),
      weapon: itemText(t, game, game.weapon),
    }),
  )
}

export function ruleText(t: Translate, game: Case): string {
  return t('rule', { room: roomText(t, game, game.crimeRoom), weapon: itemText(t, game, game.weapon) })
}
