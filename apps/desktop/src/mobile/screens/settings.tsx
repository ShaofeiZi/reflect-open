import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  aiProvider,
  errorMessage,
  hasBridge,
  listNotes,
  normalizeChatSystemPrompt,
  type AiProviderConfig,
  type EditorTextSize,
  type Language,
  type ThemePreference,
} from '@reflect/core'
import { useAiProviders } from '@/hooks/use-ai-providers'
import { useAppVersion } from '@/hooks/use-app-version'
import { marketingVersion } from '@/lib/marketing-version'
import { INDEX_QUERY_SCOPE } from '@/lib/query-client'
import { AddAiProviderDrawer } from '@/mobile/add-ai-provider-drawer'
import { AiProviderActionsDrawer } from '@/mobile/ai-provider-actions-drawer'
import { ChatSystemPromptDrawer } from '@/mobile/chat-system-prompt-drawer'
import { ConnectGithubDrawer } from '@/mobile/connect-github-drawer'
import { MobileScreenHeader } from '@/mobile/screen-header'
import {
  SettingsActionRow,
  SettingsGroup,
  SettingsNavRow,
  SettingsSegmentedRow,
  SettingsSwitchRow,
  SettingsValueRow,
  type SegmentedOption,
} from '@/mobile/settings-list'
import { useMobileSyncStatus } from '@/mobile/use-sync-status'
import { useGraph } from '@/providers/graph-provider'
import { useSettings } from '@/providers/settings-provider'
import { useSyncContext } from '@/providers/sync-provider'
import { useRouter } from '@/routing/router'

function themeOptions(t: (key: string) => string): readonly SegmentedOption<ThemePreference>[] {
  return [
    { value: 'system', label: t('mobile.settings-screen.theme-system') },
    { value: 'light', label: t('mobile.settings-screen.theme-light') },
    { value: 'dark', label: t('mobile.settings-screen.theme-dark') },
  ]
}

function textSizeOptions(t: (key: string) => string): readonly SegmentedOption<EditorTextSize>[] {
  return [
    { value: 'small', label: t('mobile.settings-screen.text-small') },
    { value: 'medium', label: t('mobile.settings-screen.text-medium') },
    { value: 'large', label: t('mobile.settings-screen.text-large') },
  ]
}

function languageOptions(t: (key: string) => string): readonly SegmentedOption<Language>[] {
  return [
    { value: 'en', label: t('mobile.settings-screen.language-en') },
    { value: 'zh-CN', label: t('mobile.settings-screen.language-zh-CN') },
  ]
}

/**
 * The mobile Settings screen — a pushed card (route kind `settings`) in the
 * iOS inset-grouped idiom, replacing the old bottom-sheet hodgepodge. The
 * graph row discloses into the Graphs switcher screen; appearance and editor
 * preferences edit the shared settings document (the same keys desktop
 * exposes); the backup group mirrors the status pill's engine state, connects
 * GitHub for the local graph (the {@link ConnectGithubDrawer} sheet — iCloud
 * graphs sync through the container instead, Plan 21), and can disconnect.
 */
export function MobileSettings(): ReactElement {
  const { t } = useTranslation()
  const { back, canBack, navigate } = useRouter()
  const { graph, mobileStorageKind } = useGraph()
  const { settings, updateSettings } = useSettings()
  const version = useAppVersion()
  const sync = useSyncContext()
  // Shared with the status pill (one hook, one query cache entry) — and null
  // until the conflict count is known, so the row never claims `Backed up`
  // over conflict markers already on disk and then flips.
  const status = useMobileSyncStatus()
  const [disconnecting, setDisconnecting] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const {
    providers,
    defaultProvider,
    addProvider,
    removeProvider,
    makeDefault,
    setDefaultModel,
  } = useAiProviders()
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [systemPromptOpen, setSystemPromptOpen] = useState(false)
  // The managed provider sticks around after close so the exit animation has
  // content; `manageOpen` alone drives visibility (the edit-sheet pattern).
  const [managedProvider, setManagedProvider] = useState<AiProviderConfig | null>(null)
  const [manageOpen, setManageOpen] = useState(false)

  const { data: notes } = useQuery({
    queryKey: [INDEX_QUERY_SCOPE, graph?.root, 'mobile-note-count'],
    queryFn: () => listNotes(),
    enabled: hasBridge() && graph !== null,
  })

  const backup = sync?.backup ?? null
  const repo = backup !== null && backup.phase === 'connected' ? backup.repo : null
  // The connect entry point is local-graph-only (iCloud sync and a Git remote
  // are mutually exclusive per graph, Plan 21) and waits out the controller's
  // `loading` phase so the row never flashes on a graph that turns out to be
  // connected.
  const canConnect = mobileStorageKind === 'local' && backup?.phase === 'disconnected'

  // Stop backing this graph up and forget the GitHub credential (one graph
  // per device — unlinking is signing out). The local clone stays; the
  // controller restarts into its disconnected state, and re-connecting
  // re-onboards.
  async function disconnect(): Promise<void> {
    if (sync === null) {
      return
    }
    setDisconnecting(true)
    try {
      await sync.disconnectGraph()
      await sync.signOut()
    } catch (err) {
      console.error('GitHub disconnect failed:', errorMessage(err))
    } finally {
      setDisconnecting(false)
    }
  }

  const storageLabel =
    mobileStorageKind === 'icloud'
      ? t('mobile.settings-screen.icloud-drive')
      : mobileStorageKind === 'local'
        ? t('mobile.settings-screen.this-device')
        : undefined

  return (
    <div
      className="flex h-full w-screen flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <MobileScreenHeader
        title={t('mobile.settings-screen.title')}
        onBack={() => (canBack ? back() : navigate({ kind: 'today' }))}
      />
      <main
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex flex-col gap-6 px-4 py-4">
          <SettingsGroup header={t('mobile.settings-screen.graph')}>
            <SettingsNavRow
              label={graph?.name ?? '—'}
              value={storageLabel}
              onPress={() => navigate({ kind: 'graphs' })}
            />
          </SettingsGroup>

          <SettingsGroup header={t('mobile.settings-screen.language')}>
            <SettingsSegmentedRow
              label={t('mobile.settings-screen.interface-language')}
              value={settings.language}
              options={languageOptions(t)}
              onChange={(language) => updateSettings({ language })}
            />
          </SettingsGroup>

          <SettingsGroup header={t('mobile.settings-screen.appearance')}>
            <SettingsSegmentedRow
              label={t('mobile.settings-screen.theme')}
              value={settings.theme}
              options={themeOptions(t)}
              onChange={(theme) => updateSettings({ theme })}
            />
            <SettingsSegmentedRow
              label={t('mobile.settings-screen.text-size')}
              value={settings.editorTextSize}
              options={textSizeOptions(t)}
              onChange={(editorTextSize) => updateSettings({ editorTextSize })}
            />
          </SettingsGroup>

          <SettingsGroup header={t('mobile.settings-screen.editor')}>
            <SettingsSwitchRow
              label={t('mobile.settings-screen.start-bullet')}
              checked={settings.editorDefaultBullet}
              onCheckedChange={(editorDefaultBullet) => updateSettings({ editorDefaultBullet })}
            />
            <SettingsSwitchRow
              label={t('mobile.settings-screen.bullet-after-heading')}
              checked={settings.editorBulletAfterHeading}
              onCheckedChange={(editorBulletAfterHeading) =>
                updateSettings({ editorBulletAfterHeading })
              }
            />
          </SettingsGroup>

          <SettingsGroup
            header={t('mobile.settings-screen.ai')}
            footer={t('mobile.settings-screen.ai-footer')}
          >
            {providers.map((provider) => (
              <SettingsNavRow
                key={provider.id}
                label={aiProvider(provider.provider).label}
                value={`·····${provider.keyHint}${provider.id === defaultProvider?.id ? ` · ${t('mobile.settings-screen.default')}` : ''}`}
                onPress={() => {
                  setManagedProvider(provider)
                  setManageOpen(true)
                }}
              />
            ))}
            <SettingsActionRow label={t('mobile.add-ai-provider.title')} onPress={() => setAddProviderOpen(true)} />
            <SettingsNavRow
              label={t('mobile.chat-system-prompt.title')}
              value={normalizeChatSystemPrompt(settings.chatSystemPrompt) === '' ? t('mobile.settings-screen.default') : t('mobile.settings-screen.custom')}
              onPress={() => setSystemPromptOpen(true)}
            />
          </SettingsGroup>

          {repo !== null || status !== null || canConnect ? (
            <SettingsGroup
              header={t('mobile.settings-screen.backup')}
              footer={
                canConnect
                  ? t('mobile.settings-screen.backup-footer-connect')
                  : (status?.detail ?? null)
              }
            >
              {repo !== null ? (
                <SettingsValueRow label={t('mobile.settings-screen.github')} value={`${repo.owner}/${repo.name}`} />
              ) : null}
              {status !== null ? <SettingsValueRow label={t('mobile.settings-screen.status')} value={status.label} /> : null}
              {canConnect ? (
                <SettingsActionRow label={t('mobile.settings-screen.connect-github')} onPress={() => setConnectOpen(true)} />
              ) : null}
              {repo !== null ? (
                <SettingsActionRow
                  label={t('mobile.settings-screen.disconnect-github')}
                  tone="destructive"
                  pending={disconnecting}
                  onPress={() => void disconnect()}
                />
              ) : null}
            </SettingsGroup>
          ) : null}

          <SettingsGroup header={t('mobile.settings-screen.about')}>
            <SettingsValueRow
              label={t('mobile.settings-screen.notes')}
              value={notes === undefined ? '…' : String(notes.length)}
            />
            <SettingsValueRow
              label={t('mobile.settings-screen.version')}
              value={version === null ? '…' : marketingVersion(version)}
            />
          </SettingsGroup>
        </div>
      </main>
      <ConnectGithubDrawer open={connectOpen} onOpenChange={setConnectOpen} />
      <AddAiProviderDrawer
        open={addProviderOpen}
        onOpenChange={setAddProviderOpen}
        onAdd={addProvider}
      />
      <AiProviderActionsDrawer
        provider={managedProvider}
        isDefault={managedProvider !== null && managedProvider.id === defaultProvider?.id}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onMakeDefault={makeDefault}
        onSetDefaultModel={setDefaultModel}
        onRemove={removeProvider}
      />
      <ChatSystemPromptDrawer
        value={settings.chatSystemPrompt}
        open={systemPromptOpen}
        onOpenChange={setSystemPromptOpen}
        onSave={(chatSystemPrompt) => updateSettings({ chatSystemPrompt })}
      />
    </div>
  )
}
