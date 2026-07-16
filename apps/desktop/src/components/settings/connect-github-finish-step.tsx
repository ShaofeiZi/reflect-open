import type { ReactElement, ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { InlineAlert } from '@/components/inline-alert'
import { Button } from '@/components/ui/button'
import type { ConnectGithubWizard } from '@/hooks/use-connect-github-wizard'

interface ConnectGithubFinishStepProps {
  wizard: ConnectGithubWizard
  /**
   * `row`: desktop dialog — small buttons side by side, escape hatches
   * leading. `stack`: mobile sheet — full-width buttons, primary action
   * first (the platform's bottom-sheet convention).
   */
  layout: 'row' | 'stack'
}

/**
 * The connect wizard's finish step, shared by the desktop dialog and the
 * mobile drawer so the view precedence and every user-facing string live
 * once. Renders whatever {@link ConnectGithubWizard.finishView} says —
 * the public-repo consent gate, the create/grant handoffs (whose polls the
 * hook owns), the in-flight state, or a failure's inline error with its
 * escape back to the repo step. Only button sizing/stacking varies by
 * `layout`.
 */
export function ConnectGithubFinishStep({
  wizard,
  layout,
}: ConnectGithubFinishStepProps): ReactElement {
  const { t } = useTranslation()
  const view = wizard.finishView
  const buttonSize = layout === 'row' ? ('sm' as const) : undefined
  const groupClass = layout === 'row' ? 'flex gap-2' : 'flex flex-col gap-2'

  function changeRepository(label = t('settings.githubConnect.changeRepo')): ReactNode {
    return (
      <Button variant="outline" size={buttonSize} onClick={wizard.backToRepo}>
        {label}
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {wizard.user !== null ? (
        <p className="text-xs text-text-muted">
          <Trans
            i18nKey="settings.githubConnect.signedInAs"
            values={{ login: wizard.user.login }}
            components={{ strong: <strong className="text-text" /> }}
          />
        </p>
      ) : null}

      {view.kind === 'publicConfirm' ? (
        <>
          <InlineAlert tone="error">
            <strong>
              {t('settings.githubConnect.publicWarning', { repo: `${view.repo.owner}/${view.repo.name}` })}
            </strong>{' '}
            {t('settings.githubConnect.publicWarningDescription')}
          </InlineAlert>
          <div className={groupClass}>
            {layout === 'row' ? changeRepository(t('settings.githubConnect.chooseAnother')) : null}
            <Button
              variant="destructive"
              size={buttonSize}
              disabled={wizard.pending || wizard.user === null}
              onClick={wizard.confirmPublic}
            >
              {t('settings.githubConnect.backupPublic')}
            </Button>
            {layout === 'stack' ? changeRepository(t('settings.githubConnect.chooseAnother')) : null}
          </div>
        </>
      ) : null}

      {view.kind === 'createGuide' ? (
        <>
          <p className="text-sm text-text">
            <Trans
              i18nKey="settings.githubConnect.createInstruction"
              values={{ repo: `${view.owner}/${view.name}` }}
              components={{ strong: <strong /> }}
            />
          </p>
          <div className={groupClass}>
            <Button size={buttonSize} onClick={wizard.openCreatePage}>
              {t('settings.githubConnect.createOnGithub')}
            </Button>
            {changeRepository()}
          </div>
          <p className="text-xs text-text-muted">{t('settings.githubConnect.waitingRepo')}</p>
          {wizard.authKind === 'app' ? (
            <p className="text-xs text-text-muted">
              {t('settings.githubConnect.grantAppBefore')}{' '}
              <button type="button" className="underline" onClick={wizard.openInstallPage}>
                {t('settings.githubConnect.grantAppLink')}
              </button>{' '}
              {t('settings.githubConnect.grantAppAfter')}
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              {t('settings.githubConnect.tokenAccessHint')}
            </p>
          )}
        </>
      ) : null}

      {view.kind === 'grantAccess' ? (
        <>
          <p className="text-sm text-text">
            <Trans
              i18nKey="settings.githubConnect.grantAccessInstruction"
              values={{ repo: `${view.repo.owner}/${view.repo.name}` }}
              components={{ strong: <strong /> }}
            />
          </p>
          <div className={groupClass}>
            <Button size={buttonSize} onClick={wizard.openInstallPage}>
              {t('settings.githubConnect.grantAccessOnGithub')}
            </Button>
            {changeRepository()}
          </div>
          {/* Steer to per-repo selection: the backup needs exactly one repo,
              so "All repositories" is needless account-wide risk. */}
          <p className="text-xs text-text-muted">
            {t('settings.githubConnect.repoSelectionHint')}
          </p>
          <p className="text-xs text-text-muted">{t('settings.githubConnect.waitingAccess')}</p>
        </>
      ) : null}

      {view.kind === 'connecting' ? <p className="text-sm text-text-muted">{t('settings.githubConnect.connecting')}</p> : null}

      {!wizard.pending && wizard.error !== null ? (
        <>
          <InlineAlert tone="error">{wizard.error}</InlineAlert>
          {view.kind === 'idle' ? (
            // A failed connect must never strand the user here — offer the
            // way back to a different repository. (The parked handoffs render
            // their own escapes.)
            changeRepository()
          ) : null}
        </>
      ) : null}
    </div>
  )
}
