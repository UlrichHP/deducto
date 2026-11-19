import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import fr from '../locales/fr.json'

export const SUPPORTED_LOCALES = ['en', 'fr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export function createAppI18n(locale: Locale) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, fr },
  })
}
