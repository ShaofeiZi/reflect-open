import { useState, type ReactElement } from 'react'
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
import { Input } from '@/components/ui/input'
import { userErrorMessage } from '@/lib/user-error-message'
import { useGraph } from '@/providers/graph-provider'
import { SettingsField } from './field'
import { SettingsSection } from './section'

export function DestructiveSection(): ReactElement {
  const { graph, forget, deleteGraph } = useGraph()
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [forgetting, setForgetting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const graphId = graph?.root ?? t('settings.destructiveSection.thisGraph')
  const graphName = graph?.name ?? ''
  // GitHub-style guard: the delete button stays dead until the typed name
  // matches the graph's folder name exactly.
  const nameConfirmed = graph !== null && deleteName === graph.name

  const forgetGraph = async (): Promise<void> => {
    if (graph === null || forgetting) {
      return
    }
    setForgetting(true)
    try {
      await forget(graph.root)
      setConfirming(false)
    } finally {
      setForgetting(false)
    }
  }

  const openDeleteDialog = (): void => {
    setDeleteName('')
    setDeleteError(null)
    setConfirmingDelete(true)
  }

  const deleteGraphToTrash = async (): Promise<void> => {
    if (!nameConfirmed || deleting) {
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteGraph()
      setConfirmingDelete(false)
    } catch (err) {
      setDeleteError(userErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <SettingsSection id="destructive">
        <SettingsField
          legend={t('settings.destructiveSection.savedLegend')}
          description={t('settings.destructiveSection.savedDescription')}
        >
          <div className="mt-3 flex justify-start">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={graph === null || forgetting}
              onClick={() => setConfirming(true)}
            >
              {t('settings.destructiveSection.forget')}
            </Button>
          </div>
        </SettingsField>
        <SettingsField
          legend={t('settings.destructiveSection.deleteLegend')}
          description={t('settings.destructiveSection.deleteDescription')}
        >
          <div className="mt-3 flex justify-start">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={graph === null || deleting}
              onClick={openDeleteDialog}
            >
              {t('settings.destructiveSection.delete')}
            </Button>
          </div>
        </SettingsField>
      </SettingsSection>

      <Dialog open={confirming} onOpenChange={(open) => !forgetting && setConfirming(open)}>
        <DialogContent>
          <DialogTitle>{t('settings.destructiveSection.forgetTitle')}</DialogTitle>
          <DialogDescription className="min-w-0">
            {t('settings.destructiveSection.forgetDescription', { graphId })}
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={forgetting}>
                {t('settings.destructiveSection.cancel')}
              </Button>
            </DialogClose>
            <Button variant="destructive" disabled={forgetting} onClick={() => void forgetGraph()}>
              {forgetting ? t('settings.destructiveSection.forgetting') : t('settings.destructiveSection.forget')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => !deleting && setConfirmingDelete(open)}
      >
        <DialogContent>
          <DialogTitle>{t('settings.destructiveSection.deleteTitle')}</DialogTitle>
          <DialogDescription className="min-w-0">
            {t('settings.destructiveSection.deleteConfirm', { graphId, graphName })}
          </DialogDescription>
          <Input
            aria-label={t('settings.destructiveSection.graphName')}
            placeholder={graphName}
            value={deleteName}
            autoComplete="off"
            spellCheck={false}
            disabled={deleting}
            onChange={(event) => setDeleteName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void deleteGraphToTrash()
              }
            }}
          />
          {deleteError !== null && (
            <p role="alert" className="text-xs text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={deleting}>
                {t('settings.destructiveSection.cancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={!nameConfirmed || deleting}
              onClick={() => void deleteGraphToTrash()}
            >
              {deleting ? t('settings.destructiveSection.deleting') : t('settings.destructiveSection.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
