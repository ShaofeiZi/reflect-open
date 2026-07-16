import i18n from 'i18next'
import type { TOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import zhCN from '@/locales/zh-CN.json'

export const SUPPORTED_LANGUAGES = ['en', 'zh-CN'] as const

export const DEFAULT_LANGUAGE = 'en'

export const RESOURCES = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
} as const

/**
 * Whether a value is one of the supported language ids. Hand-edited settings
 * or stale persisted values must not reach `changeLanguage` unchecked.
 */
export function isSupportedLanguage(value: unknown): boolean {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

let initialized = false

/**
 * Initialize i18next once, synchronously, with bundled resources (no network
 * fetch). Called before React mounts so the first render already has the
 * right language. `initialLanguage` is whatever the settings provider has
 * resolved so far; the provider reconciles again once the disk load settles.
 */
export function initI18n(initialLanguage: string = DEFAULT_LANGUAGE): void {
  if (initialized) {
    return
  }
  void i18n.use(initReactI18next).init({
    resources: RESOURCES,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
  })
  initialized = true
}

/** Switch the active language at runtime (settings → i18n). */
export function changeLanguage(language: string): Promise<unknown> {
  if (!isSupportedLanguage(language)) {
    return Promise.resolve()
  }
  return i18n.changeLanguage(language)
}

/** The currently active language id. */
export function getLanguage(): string {
  return i18n.language ?? DEFAULT_LANGUAGE
}

/**
 * Translate product feedback emitted outside React. Unlike a translated value
 * captured during module initialization, this resolves the active language at
 * the moment an action runs, so command and background-operation messages
 * follow runtime language changes.
 */
export function translate(key: string, options?: TOptions): string {
  return options === undefined ? i18n.t(key) : i18n.t(key, options)
}

/** Subscribe to runtime language changes; returns the matching cleanup. */
export function onLanguageChanged(listener: () => void): () => void {
  i18n.on('languageChanged', listener)
  return () => i18n.off('languageChanged', listener)
}
