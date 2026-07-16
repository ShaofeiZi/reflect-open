import type { BackupState } from '@/lib/backup-controller'
type Translate = (key: string, options?: Record<string, unknown>) => string

function english(key: string, options?: Record<string, unknown>): string {
  switch (key) {
    case 'mobile.sync-status.syncing':
      return 'Syncing'
    case 'mobile.sync-status.needs-review':
      return 'Needs review'
    case 'mobile.sync-status.needs-attention':
      return 'Needs attention'
    case 'mobile.sync-status.offline':
      return 'Offline'
    case 'mobile.sync-status.backed-up':
      return 'Backed up'
    case 'mobile.sync-status.one-conflict':
      return 'A note was edited on two devices at once — open it to choose what to keep.'
    case 'mobile.sync-status.many-conflicts':
      return `${String(options?.['count'] ?? 0)} notes were edited on two devices at once — open them to choose what to keep.`
    default:
      return key
  }
}

/**
 * The plain-language sync status mobile shows (Plan 19, step 10). The phone
 * spends much of its life "not yet pushed" — foreground-only cycles — so the
 * status surface matters more than on desktop, and it must never speak git:
 * no commits, branches, or merges, just what the user's notes are doing.
 */
export interface MobileSyncStatus {
  /** What the user reads: `Backed up`, `Syncing`, `Needs review`, … */
  label: string
  /**
   * Drives the indicator color: calm, working, or wants a look. `ok` is the
   * all-good resting state — the settings sheet still shows its label, but
   * the floating pill hides (quiet UI — no chrome when nothing's wrong).
   */
  tone: 'ok' | 'active' | 'attention'
  /** A plain-language line with more detail (offline/error states), if any. */
  detail: string | null
}

/**
 * Map the engine's product state (plus the graph's conflicted-note count,
 * which outlives any one cycle) to the mobile wording. `null` when the graph
 * has no backup configured — there is no status to speak of.
 *
 * Precedence: an in-flight cycle shows as `Syncing` (it may be resolving the
 * rest); conflicted notes then take the headline (`Needs review` persists
 * across idle cycles — conflicts never block other notes from syncing, so
 * the engine alone would happily report all-clear); errors and offline last.
 */
export function mobileSyncStatus(
  backup: BackupState,
  conflictCount: number,
  t: Translate = english,
): MobileSyncStatus | null {
  if (backup.phase !== 'connected') {
    return null
  }
  const status = backup.status
  if (status.state === 'syncing') {
    return { label: t('mobile.sync-status.syncing'), tone: 'active', detail: null }
  }
  if (conflictCount > 0) {
    return {
      label: t('mobile.sync-status.needs-review'),
      tone: 'attention',
      detail:
        conflictCount === 1
          ? t('mobile.sync-status.one-conflict')
          : t('mobile.sync-status.many-conflicts', { count: conflictCount }),
    }
  }
  if (status.state === 'error') {
    return { label: t('mobile.sync-status.needs-attention'), tone: 'attention', detail: status.message }
  }
  if (status.state === 'offline') {
    return { label: t('mobile.sync-status.offline'), tone: 'attention', detail: status.message }
  }
  return { label: t('mobile.sync-status.backed-up'), tone: 'ok', detail: null }
}
