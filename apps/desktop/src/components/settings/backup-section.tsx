import { useRef, useState, type ReactElement } from 'react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useQuery } from '@tanstack/react-query'
import { getConflictedNotes, getDuplicateNoteIds, hasBridge } from '@reflect/core'
import { ExternalLink } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { ConnectGithubDialog } from '@/components/settings/connect-github-dialog'
import { ConflictedNoteLinks } from '@/components/settings/conflicted-note-links'
import { SettingsField } from '@/components/settings/field'
import { SyncForkNotice } from '@/components/settings/sync-fork-notice'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAsyncAction } from '@/hooks/use-async-action'
import { suggestRepoName } from '@/lib/github-repos'
import { INDEX_QUERY_SCOPE } from '@/lib/query-client'
import { useGraph } from '@/providers/graph-provider'
import { useSync, type BackupState } from '@/providers/sync-provider'

/** A short, plain-language line for each backup state — never Git jargon. */
function statusLine(backup: Extract<BackupState, { phase: 'connected' }>, t: TFunction): string {
  switch (backup.status.state) {
    case 'idle':
      return t('settings.backupSection.status.idle')
    case 'syncing':
      return t('settings.backupSection.status.syncing')
    case 'offline':
      return t('settings.backupSection.status.offline')
    case 'error':
      // "Reconnect GitHub" only helps when GitHub is the remote; a generic
      // remote's auth message already names the fix (ssh-add, known_hosts…).
      if (backup.status.errorKind === 'auth' && backup.repo !== null) {
        return t('settings.backupSection.status.authFailed')
      }
      if (
        backup.status.errorKind === 'rejected' &&
        backup.repo === null &&
        /^https?:\/\//i.test(backup.remoteUrl)
      ) {
        return t('settings.backupSection.status.unsupportedHttps')
      }
      return t('settings.backupSection.status.failed', { message: backup.status.message })
  }
}

function githubRepoBrowserUrl(repo: NonNullable<Extract<BackupState, { phase: 'connected' }>['repo']>): string {
  return `https://github.com/${repo.owner}/${repo.name}`
}

/**
 * Settings → Sync → GitHub sync: connect a GitHub repository, see the current
 * backup state in product language, back up on demand, and disconnect.
 * Conflicted notes ("needs review") surface here with a count; each conflicted
 * note also shows its own banner when opened.
 */
export function BackupSettingsField(): ReactElement {
  const { backup, disconnectGraph, signOut, backUpNow } = useSync()
  const { graph } = useGraph()
  const { t } = useTranslation()
  const [connectOpen, setConnectOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const openRepoAttempt = useRef(0)
  const action = useAsyncAction()
  const signOutAction = useAsyncAction()

  const conflicted = useQuery({
    queryKey: [INDEX_QUERY_SCOPE, 'conflicted-notes', graph?.root],
    queryFn: () => getConflictedNotes(),
    enabled: hasBridge() && graph !== null,
  })
  const conflictedNotes = conflicted.data ?? []
  const conflictCount = conflictedNotes.length

  // A sync fork (Plan 17): two files claiming one frontmatter id — the same
  // note retitled differently on two devices. Surfaced for review beside the
  // marker conflicts; repair is the user's call, never automatic.
  const duplicateIds = useQuery({
    queryKey: [INDEX_QUERY_SCOPE, 'duplicate-note-ids', graph?.root],
    queryFn: () => getDuplicateNoteIds(),
    enabled: hasBridge() && graph !== null,
  })
  const forkGroups = duplicateIds.data ?? []

  const repoLabel =
    backup.phase === 'connected'
      ? (backup.repo !== null ? `${backup.repo.owner}/${backup.repo.name}` : backup.remoteUrl)
      : null
  // A hand-wired non-GitHub remote (Plan 16) renders the section host-neutral.
  const genericRemote = backup.phase === 'connected' && backup.repo === null

  function openGithubRepo(): void {
    if (backup.phase !== 'connected' || backup.repo === null) {
      return
    }
    const url = githubRepoBrowserUrl(backup.repo)
    const attempt = openRepoAttempt.current + 1
    openRepoAttempt.current = attempt
    action.setError(null)
    void openUrl(url)
      .then(() => {
        if (openRepoAttempt.current === attempt) {
          action.setError(null)
        }
      })
      .catch(() => {
        if (openRepoAttempt.current === attempt) {
          action.setError(t('settings.backupSection.browserOpenFailed', { url }))
        }
      })
  }

  function setSignOutDialogOpen(open: boolean): void {
    if (!open && signOutAction.pending) {
      return
    }
    setSignOutOpen(open)
  }

  async function confirmSignOut(): Promise<void> {
    await signOutAction.run(async () => {
      await signOut()
      setSignOutOpen(false)
    })
  }

  return (
    <>
      <SettingsField
        legend={genericRemote ? t('settings.backupSection.genericLegend') : t('settings.backupSection.githubLegend')}
        description={
          genericRemote
            ? t('settings.backupSection.genericDescription')
            : t('settings.backupSection.githubDescription')
        }
      >
        <div className="mt-3 flex flex-col gap-2">
          {backup.phase === 'loading' ? (
            <p className="text-xs text-text-muted">{t('settings.backupSection.checking')}</p>
          ) : null}

          {backup.phase === 'disconnected' ? (
            <div>
              <Button size="sm" onClick={() => setConnectOpen(true)}>
                {t('settings.backupSection.connect')}
              </Button>
            </div>
          ) : null}

          {backup.phase === 'connected' ? (
            <>
              <p className="text-sm text-text">
                <span className="font-medium">{repoLabel}</span>
                <span className="ml-2 text-xs text-text-muted">{statusLine(backup, t)}</span>
              </p>
              {conflictCount > 0 ? (
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p>
                    {conflictCount === 1
                      ? t('settings.backupSection.noteNeedsReview')
                      : t('settings.backupSection.notesNeedReview', { count: conflictCount })}{' '}
                    {t('settings.backupSection.openToKeep', {
                      target: conflictCount === 1
                        ? t('settings.backupSection.targetIt')
                        : t('settings.backupSection.targetOne'),
                    })}
                  </p>
                  <ConflictedNoteLinks notes={conflictedNotes} />
                </div>
              ) : null}
              <SyncForkNotice groups={forkGroups} />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={backup.status.state === 'syncing' || action.pending}
                  onClick={() => void action.run(backUpNow)}
                >
                  {t('settings.backupSection.backUpNow')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title={t('settings.backupSection.stopTitle')}
                  onClick={() => void action.run(disconnectGraph)}
                >
                  {t('settings.backupSection.stop')}
                </Button>
                {backup.repo !== null ? (
                  <Button variant="ghost" size="sm" onClick={openGithubRepo}>
                    <ExternalLink aria-hidden />
                    {t('settings.backupSection.openRepo')}
                  </Button>
                ) : null}
              </div>
              {backup.repo !== null ? (
                <div className="mt-2 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-text">{t('settings.backupSection.account')}</p>
                    <p className="text-xs text-text-muted">
                      {t('settings.backupSection.accountDescription')}
                    </p>
                  </div>
                  <Dialog open={signOutOpen} onOpenChange={setSignOutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        title={t('settings.backupSection.signOutTitle')}
                        disabled={signOutAction.pending}
                      >
                        {t('settings.backupSection.signOut')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent showCloseButton={!signOutAction.pending}>
                      <DialogHeader>
                        <DialogTitle>{t('settings.backupSection.signOutConfirmTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('settings.backupSection.signOutConfirmDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      {signOutAction.error !== null ? (
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {signOutAction.error}
                        </p>
                      ) : null}
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" disabled={signOutAction.pending}>
                            {t('settings.backupSection.cancel')}
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          disabled={signOutAction.pending}
                          onClick={() => void confirmSignOut()}
                        >
                          {t('settings.backupSection.signOutButton')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : null}
            </>
          ) : null}

          {action.error !== null ? (
            <p className="text-xs text-red-700 dark:text-red-300">{action.error}</p>
          ) : null}
        </div>
      </SettingsField>
      {connectOpen ? (
        <ConnectGithubDialog
          suggestedRepoName={suggestRepoName(graph?.name)}
          onClose={() => setConnectOpen(false)}
        />
      ) : null}
    </>
  )
}
