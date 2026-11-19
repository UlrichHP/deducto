/** Picks the initial locale and keeps <html lang> and storage in sync with it. */
import { watch, type Ref } from 'vue'
import { SUPPORTED_LOCALES, type Locale } from './index'

const STORAGE_KEY = 'deducto.locale'

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Storage unavailable (private mode, blocked site data): fall through.
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function persistLocale(locale: Ref<string>) {
  watch(
    locale,
    (code) => {
      document.documentElement.lang = code
      try {
        localStorage.setItem(STORAGE_KEY, code)
      } catch {
        // Not persisted; the choice still applies to this session.
      }
    },
    { immediate: true },
  )
}
