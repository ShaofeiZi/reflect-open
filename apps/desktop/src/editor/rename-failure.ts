import { translate } from '@/lib/i18n'

/**
 * Failure reporting for one settled rename (Plan 07b/17). The three phases
 * fail independently, and the report says what *held*: a failed rewrite with
 * a placed alias still resolves every old link, while a failed alias after a
 * clean rewrite breaks none — only both failing leaves links dangling. A
 * failed move is cosmetic (filename drift; resolution never reads
 * filenames). One combined "failure" string couldn't say any of that.
 */

/** Per-phase failure messages from one rename; `null` means the phase held. */
export interface RenamePhaseFailures {
  rewrite: string | null
  alias: string | null
  move: string | null
}

/**
 * The operation-status message for a settled rename of `from`, or `null`
 * when every phase succeeded. The operation label already names the rename;
 * the message says what failed and what that means for the user's links.
 */
export function composeRenameFailure(
  from: string,
  failures: RenamePhaseFailures,
): string | null {
  const parts: string[] = []
  if (failures.rewrite !== null && failures.alias !== null) {
    parts.push(
      translate('operations.rename.rewrite-and-alias-failed', {
        rewrite: failures.rewrite,
        alias: failures.alias,
        from,
      }),
    )
  } else if (failures.rewrite !== null) {
    parts.push(
      translate('operations.rename.rewrite-failed', {
        rewrite: failures.rewrite,
        from,
      }),
    )
  } else if (failures.alias !== null) {
    parts.push(
      translate('operations.rename.alias-failed', {
        alias: failures.alias,
        from,
      }),
    )
  }
  if (failures.move !== null) {
    parts.push(translate('operations.rename.move-failed', { move: failures.move }))
  }
  return parts.length > 0 ? parts.join('; ') : null
}
