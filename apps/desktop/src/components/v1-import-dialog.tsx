import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { GraphImportProgress, GraphImportSummary } from '@reflect/core'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { V1ImportState } from '@/providers/v1-import-provider'

interface V1ImportDialogProps {
  state: V1ImportState
  onCancel: () => void
  onDismiss: () => void
}

function count(quantity: number, singular: string, plural: string): string {
  return `${quantity} ${quantity === 1 ? singular : plural}`
}

/** The one-line result the dialog shows once an import completes. */
export function summaryText(summary: GraphImportSummary, t: TFunction): string {
  const parts = [
    `${count(summary.importedFiles, t('common.import.file-singular'), t('common.import.file-plural'))} ${t('common.import.imported', { count: summary.importedFiles })}`,
  ]
  if (summary.mergedFiles > 0) {
    parts.push(
      `${count(summary.mergedFiles, t('common.import.daily-note-singular'), t('common.import.daily-note-plural'))} ${t('common.import.merged', { count: summary.mergedFiles })}`,
    )
  }
  if (summary.renamedFiles > 0) {
    parts.push(t('common.import.renamed', { count: summary.renamedFiles }))
  }
  if (summary.skippedFiles > 0) {
    parts.push(t('common.import.already-present', { count: summary.skippedFiles }))
  }
  if (summary.downloadedAssets > 0) {
    parts.push(
      `${count(summary.downloadedAssets, t('common.import.attachment-singular'), t('common.import.attachment-plural'))} ${t('common.import.downloaded', { count: summary.downloadedAssets })}`,
    )
  }
  const text = `${parts.join(', ')}.`
  if (summary.failedAssetDownloads === 0) {
    return text
  }
  if (summary.failedAssetDownloads === 1) {
    return `${text} ${t('common.import.attachment-failed-singular')}`
  }
  return `${text} ${t('common.import.attachment-failed-plural', { count: summary.failedAssetDownloads })}`
}

function stageText(progress: GraphImportProgress | null, t: TFunction): string {
  if (progress === null) {
    return t('common.import.reading-export')
  }
  if (progress.stage === 'downloading') {
    return t('common.import.downloading-attachments', { done: progress.done, total: progress.total })
  }
  return t('common.import.adding-notes', { done: progress.done, total: progress.total })
}

function stagePercent(progress: GraphImportProgress | null): number | undefined {
  if (progress === null || progress.total === 0) {
    return undefined
  }
  return Math.round((progress.done / progress.total) * 100)
}

/**
 * The modal face of a running Reflect V1 import. While the import runs the
 * dialog cannot be dismissed (there is nothing else to do in the graph until
 * it settles) — but it can be cancelled up until writing starts, because
 * nothing lands in the graph before then. Once finished it reports the
 * outcome and closes on demand.
 */
export function V1ImportDialog({ state, onCancel, onDismiss }: V1ImportDialogProps): ReactElement {
  const running = state.phase === 'running'
  const { t } = useTranslation()
  // Cancelling mid-write would leave a half-imported graph; the native side
  // only honours cancellation before writes start, so the button goes with it.
  const cancellable = running && (state.progress === null || state.progress.stage === 'downloading')

  return (
    <Dialog
      open={state.phase !== 'idle'}
      onOpenChange={(next) => {
        if (!next && !running) {
          onDismiss()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => {
          event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (running) {
            event.preventDefault()
          }
        }}
      >
        {state.phase === 'running' ? (
          <>
            <DialogTitle>{t('common.import.importing-v1')}</DialogTitle>
            <DialogDescription role="status">{stageText(state.progress, t)}</DialogDescription>
            <Progress value={stagePercent(state.progress) ?? null} />
            {cancellable ? (
              <DialogFooter>
                <Button variant="ghost" disabled={state.cancelling} onClick={onCancel}>
                  {state.cancelling ? t('common.import.cancelling') : t('common.cancel')}
                </Button>
              </DialogFooter>
            ) : null}
          </>
        ) : null}
        {state.phase === 'done' ? (
          <>
            <DialogTitle>{t('common.import.complete')}</DialogTitle>
            <DialogDescription role="status">{summaryText(state.summary, t)}</DialogDescription>
            <DialogFooter>
              <Button onClick={onDismiss}>{t('common.done')}</Button>
            </DialogFooter>
          </>
        ) : null}
        {state.phase === 'failed' ? (
          <>
            <DialogTitle>{t('common.import.failed')}</DialogTitle>
            <DialogDescription role="alert">{state.message}</DialogDescription>
            <DialogFooter>
              <Button variant="ghost" onClick={onDismiss}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
