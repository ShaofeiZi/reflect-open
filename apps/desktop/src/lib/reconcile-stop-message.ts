import type { ReconcileStop } from '@reflect/core'
import { translate } from '@/lib/i18n'
import { userErrorMessage } from '@/lib/user-error-message'

/**
 * Convert a background reconciliation stop into user-facing product copy.
 * Known actionable states are fully localized; unexpected diagnostics stay
 * available inside a localized shell so troubleshooting detail is not lost.
 */
export function reconcileStopMessage(stopped: ReconcileStop): string {
  switch (stopped.reason) {
    case 'config':
      return translate('operations.errors.config')
    case 'stale':
      return translate('operations.errors.stale')
    default:
      return userErrorMessage({ kind: stopped.reason, message: stopped.message })
  }
}
