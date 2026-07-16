import { useState, type ReactElement } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  agentSkillInstall,
  agentSkillStatus,
  agentSkillUninstall,
  hasBridge,
  type AgentSkillStatus,
} from '@reflect/core'
import { SettingsField } from '@/components/settings/field'
import { SettingsSection } from '@/components/settings/section'
import { Button } from '@/components/ui/button'
import { isMacosDesktop } from '@/lib/platform'
import { userErrorMessage } from '@/lib/user-error-message'
import { useGraph } from '@/providers/graph-provider'

/**
 * Settings → Agents: one-click install of a per-graph agent skill under
 * `~/.agents/skills/`. The skill is named after the graph and teaches coding
 * agents (Claude Code and friends) to read this graph through the bundled
 * `reflect` CLI. macOS desktop only, like the iCloud section — the navigator
 * hides the entry through the same gate (see use-visible-settings-sections).
 */
export function AgentsSection(): ReactElement | null {
  const { graph } = useGraph()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryKey = ['agent-skill', graph?.root]
  const { data: status } = useQuery({
    queryKey,
    queryFn: agentSkillStatus,
    enabled: hasBridge() && isMacosDesktop && graph !== null,
  })

  if (!isMacosDesktop || graph === null) {
    return null
  }

  async function run(action: (generation: number) => Promise<AgentSkillStatus>): Promise<void> {
    if (graph === null) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      queryClient.setQueryData(queryKey, await action(graph.generation))
    } catch (caught) {
      setError(userErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const installed = status?.installState === 'current'
  return (
    <SettingsSection id="agents">
      <SettingsField
        legend={t('settings.agentsSection.legend')}
        description={t('settings.agentsSection.description', { graphName: graph.name })}
      >
        {status !== undefined ? (
          <div className="mt-2 flex flex-col gap-2">
            <p className="truncate font-mono text-xs text-text-muted" title={status.skillPath}>
              {status.skillPath}
            </p>
            {status.installState === 'conflict' ? (
              <p className="text-xs text-destructive">
                {t('settings.agentsSection.conflict')}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                {installed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Check aria-hidden className="size-3.5" />
                    {t('settings.agentsSection.installed')}
                  </span>
                ) : (
                  <Button size="xs" disabled={busy} onClick={() => void run(agentSkillInstall)}>
                    {status.installState === 'stale'
                      ? t('settings.agentsSection.updateSkill')
                      : t('settings.agentsSection.installSkill')}
                  </Button>
                )}
                {status.installState !== 'missing' ? (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void run(agentSkillUninstall)}
                  >
                    {t('settings.agentsSection.remove')}
                  </Button>
                ) : null}
              </div>
            )}
            {error !== null ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        ) : null}
      </SettingsField>
    </SettingsSection>
  )
}
