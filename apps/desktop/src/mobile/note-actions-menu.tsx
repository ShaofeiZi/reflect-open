import { useState, type ReactElement } from 'react'
import { MoreHorizontal, Pin, PinOff, Share, Trash2 } from 'lucide-react'
import { errorMessage } from '@reflect/core'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { toggleNotePinned } from '@/lib/note-pin'
import { deleteOpenNote } from '@/lib/note-delete'
import { userErrorMessage } from '@/lib/user-error-message'
import { shareNote } from '@/mobile/share'
import { useGraph } from '@/providers/graph-provider'
import { usePinnedNotes } from '@/hooks/use-pinned-notes'

interface NoteActionsMenuProps {
  /** Graph-relative path of the note the actions operate on. */
  path: string
  /** Called after the note is deleted, so the screen can navigate away. */
  onDeleted: () => void
}

/**
 * The note screen's "⋯" action sheet (Plan 19): pin/unpin, share,
 * and delete-to-trash. Pin reflects the index's pinned set; {@link shareNote}
 * hands the note's body to the OS share sheet via the Web Share API
 * (`navigator.share`); delete confirms first (it's destructive, even if
 * recoverable from `.reflect/trash/`) and routes through
 * {@link deleteOpenNote} so the open session is discarded rather than flushed.
 */
export function NoteActionsMenu({ path, onDeleted }: NoteActionsMenuProps): ReactElement {
  const { graph } = useGraph()
  const { t } = useTranslation()
  const isPinned = usePinnedNotes().some((note) => note.path === path)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pin = (): void => {
    if (graph !== null) {
      void toggleNotePinned(path, graph.generation).catch(() => {})
    }
  }

  const share = (): void => {
    void shareNote(path).catch((cause) => console.error('share failed:', errorMessage(cause)))
  }

  const confirmDelete = (): void => {
    if (graph === null) {
      return
    }
    setBusy(true)
    setError(null)
    void deleteOpenNote(path, graph.generation)
      .then(() => {
        setConfirmingDelete(false)
        onDeleted()
      })
      .catch((cause) => setError(userErrorMessage(cause)))
      .finally(() => setBusy(false))
  }

  return (
    <>
      <Drawer open={actionsOpen} onOpenChange={setActionsOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="size-10" aria-label={t('mobile.note-actions.aria')}>
            <MoreHorizontal />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="sr-only">{t('mobile.note-actions.title')}</DrawerTitle>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 justify-start gap-3 text-base"
              onClick={() => {
                pin()
                setActionsOpen(false)
              }}
            >
              {isPinned ? <PinOff /> : <Pin />}
              {isPinned ? t('mobile.note-actions.unpin') : t('mobile.note-actions.pin')}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 justify-start gap-3 text-base"
              onClick={() => {
                share()
                setActionsOpen(false)
              }}
            >
              <Share />
              {t('mobile.note-actions.share')}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 justify-start gap-3 text-base text-destructive hover:text-destructive"
              onClick={() => {
                setActionsOpen(false)
                setConfirmingDelete(true)
              }}
            >
              <Trash2 />
              {t('mobile.note-actions.delete')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={confirmingDelete} onOpenChange={(open) => !busy && setConfirmingDelete(open)}>
        <DialogContent>
          <DialogTitle>{t('mobile.note-actions.delete-title')}</DialogTitle>
          <DialogDescription>
            {t('mobile.note-actions.delete-description')}
          </DialogDescription>
          {error !== null && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                {t('mobile.note-actions.cancel')}
              </Button>
            </DialogClose>
            <Button variant="destructive" disabled={busy} onClick={confirmDelete}>
              {t('mobile.note-actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
