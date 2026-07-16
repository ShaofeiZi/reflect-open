import { useEffect, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useUpdate } from '@/providers/update-provider'

const UPDATE_TOAST_ID = 'reflect-update'
const PERSISTENT_TOAST_MS = Number.POSITIVE_INFINITY
const NON_DISMISSIBLE_UPDATE_OPTIONS = {
  closeButton: false,
  dismissible: false,
}

function runToastAction(action: () => Promise<void>): void {
  void action().catch((error: unknown) => {
    console.error('update toast action failed:', error)
  })
}

/** Mirrors the auto-update lifecycle into the global Sonner notification surface. */
export function UpdateToast(): ReactElement | null {
  const { state, install, restart } = useUpdate()
  const { t } = useTranslation()

  useEffect(() => {
    switch (state.phase) {
      case 'available':
        toast.message(t('common.update.available'), {
          id: UPDATE_TOAST_ID,
          description: t('common.update.available-desc', { version: state.version }),
          duration: PERSISTENT_TOAST_MS,
          ...NON_DISMISSIBLE_UPDATE_OPTIONS,
          action: {
            label: t('common.update.install'),
            onClick: () => runToastAction(install),
          },
        })
        break
      case 'downloading':
        toast.loading(t('common.update.downloading'), {
          id: UPDATE_TOAST_ID,
          description: state.percent !== null ? `${state.percent}%` : t('common.update.preparing'),
          duration: PERSISTENT_TOAST_MS,
          // Sonner merges options into the existing toast by id, so the
          // "Install" action from the `available` phase persists unless we
          // clear it — otherwise a clickable Install button lingers over the
          // download progress. The update only becomes installable once it has
          // fully downloaded, surfaced as "Restart" in the `ready` phase.
          action: undefined,
          ...NON_DISMISSIBLE_UPDATE_OPTIONS,
        })
        break
      case 'ready':
        toast.success(t('common.update.ready'), {
          id: UPDATE_TOAST_ID,
          description: t('common.update.ready-desc', { version: state.version }),
          duration: PERSISTENT_TOAST_MS,
          ...NON_DISMISSIBLE_UPDATE_OPTIONS,
          action: {
            label: t('common.update.restart'),
            onClick: () => runToastAction(restart),
          },
        })
        break
      case 'error':
        if (state.during === 'install') {
          toast.error(t('common.update.failed'), {
            id: UPDATE_TOAST_ID,
            description: state.message,
            duration: PERSISTENT_TOAST_MS,
            ...NON_DISMISSIBLE_UPDATE_OPTIONS,
            action: {
              label: t('common.update.retry-install'),
              onClick: () => runToastAction(install),
            },
          })
        } else {
          toast.dismiss(UPDATE_TOAST_ID)
        }
        break
      default:
        toast.dismiss(UPDATE_TOAST_ID)
        break
    }
  }, [install, restart, state, t])

  return null
}
