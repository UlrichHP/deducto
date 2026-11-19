import { describe, expect, it } from 'vitest'
import type { Composer } from 'vue-i18n'
import { ITEMS, ROOMS, SUSPECTS, VICTIMS } from '../../game/data'
import { generateCase } from '../../game/generator'
import en from '../../locales/en.json'
import fr from '../../locales/fr.json'
import { clueText, reportText, ruleText } from '../caseText'
import { createAppI18n, SUPPORTED_LOCALES } from '../index'

/** Dotted paths of every leaf message. */
function keyPaths(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    value !== null && typeof value === 'object' && !Array.isArray(value) && !('type' in value)
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

const SENTENCE = /^\p{Lu}[^{}]*[.!]$/u

it('every locale defines the same keys', () => {
  expect(keyPaths(fr).sort()).toEqual(keyPaths(en).sort())
})

describe.each(SUPPORTED_LOCALES)('locale %s', (locale) => {
  // Components get an untyped composer from useI18n(); mirror that here.
  const { t, te } = createAppI18n(locale).global as unknown as Composer

  it('translates every content id', () => {
    for (const id of SUSPECTS) expect(te(`roles.${id}`, locale)).toBe(true)
    for (const id of ROOMS) expect(te(`rooms.${id}.phrase`, locale) && te(`rooms.${id}.label`, locale)).toBe(true)
    for (const id of ITEMS) expect(te(`items.${id}.phrase`, locale) && te(`items.${id}.label`, locale)).toBe(true)
    for (const id of VICTIMS) {
      expect(te(`victims.${id}.name`, locale)).toBe(true)
      expect(['m', 'f']).toContain(t(`victims.${id}.gender`))
    }
  })

  it('renders reports and clues as complete sentences', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const game = generateCase(5, seed)
      expect(reportText(t, game)).toMatch(SENTENCE)
      expect(ruleText(t, game)).toMatch(SENTENCE)
      for (const clue of game.clues) expect(clueText(t, game, clue)).toMatch(SENTENCE)
    }
  })
})
