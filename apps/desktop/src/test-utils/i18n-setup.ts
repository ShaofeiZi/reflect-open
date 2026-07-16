import { initI18n } from '@/lib/i18n'

/**
 * Ensures i18next is initialized for component tests. `initI18n` is a once
 * guard; the default language is English, matching the assertions that quote
 * canonical English strings.
 */
initI18n()
