import { errorMessage, isAppError, type AppError } from '@reflect/core'
import { translate } from '@/lib/i18n'

function appErrorMessage(error: AppError): string {
  switch (error.kind) {
    case 'auth':
      return translate('operations.errors.auth')
    case 'notFound':
      return translate('operations.errors.not-found')
    case 'noGraph':
      return translate('operations.errors.no-graph')
    case 'traversal':
      return translate('operations.errors.path-rejected')
    case 'io':
      return translate('operations.errors.file', { message: error.message })
    case 'parse':
      return translate('operations.errors.data', { message: error.message })
    case 'unknown':
      return translate('operations.errors.unknown', { message: error.message })
    case 'network':
      return translate('operations.errors.network')
  }
}

/**
 * Format a caught value for direct presentation in the UI. Structured app
 * errors become stable localized product copy; foreign errors keep their
 * diagnostic inside a localized fallback because their remediation is not
 * known.
 */
export function userErrorMessage(cause: unknown): string {
  return isAppError(cause)
    ? appErrorMessage(cause)
    : translate('operations.errors.unknown', { message: errorMessage(cause) })
}
