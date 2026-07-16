import type { ReactElement } from 'react'
import type { ThemePreference } from '@reflect/core'
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSettings } from '@/providers/settings-provider'
import { SettingsField } from './field'
import { SettingsOptionCard } from './option-card'
import { SettingsSection } from './section'

interface ThemeOption {
  value: ThemePreference
  labelKey: string
  icon: LucideIcon
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'system', labelKey: 'settings.appearanceSection.themeOptions.system', icon: Monitor },
  { value: 'light', labelKey: 'settings.appearanceSection.themeOptions.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.appearanceSection.themeOptions.dark', icon: Moon },
]

/**
 * Theme picker as radio cards (the original app's idiom). Edits the settings
 * document directly — the ThemeProvider applies whatever is persisted, so
 * this section needs no theme context of its own.
 */
export function AppearanceSection(): ReactElement {
  const { settings, updateSettings } = useSettings()
  const { t } = useTranslation()

  return (
    <SettingsSection id="appearance">
      <SettingsField
        legend={t('settings.appearanceSection.theme.legend')}
        description={t('settings.appearanceSection.theme.description')}
      >
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
            const selected = settings.theme === value
            return (
              <SettingsOptionCard
                key={value}
                selected={selected}
                className={cn(
                  'flex-col items-center gap-1.5 px-3 py-3',
                  selected ? 'text-accent-soft-text' : 'text-text-secondary',
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={selected}
                  onChange={() => updateSettings({ theme: value })}
                  className="sr-only"
                />
                <Icon aria-hidden strokeWidth={1.75} className="size-4" />
                <span className="text-xs font-medium">{t(labelKey)}</span>
              </SettingsOptionCard>
            )
          })}
        </div>
      </SettingsField>
    </SettingsSection>
  )
}
