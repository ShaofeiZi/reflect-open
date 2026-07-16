import { translate } from '@/lib/i18n'
import { startOperation } from '@/lib/operations'

/**
 * The one user-visible refusal for an `ambiguous` title resolution
 * (`resolveOrCreateNoteWithTitle`): several notes may claim the title's exact
 * or fallback key, or an unavailable collision prevents proving uniqueness.
 * Neither navigation nor creation may guess in those states.
 */
export function reportAmbiguousNoteTitle(operationLabelKey: string, title: string): void {
  startOperation(translate(operationLabelKey)).fail(
    translate('operations.links.ambiguous', { title }),
  )
}
