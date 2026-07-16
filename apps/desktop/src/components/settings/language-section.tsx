import type { ReactElement } from 'react'
import { Languages, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { useSettings } from '@/providers/settings-provider'
import { cn } from '@/lib/utils'
import { SettingsField } from './field'
import { SettingsOptionCard } from './option-card'
import { SettingsSection } from './section'

interface LanguageOption {
  value: (typeof SUPPORTED_LANGUAGES)[number]
  labelKey: string
  icon: LucideIcon
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', labelKey: 'settings.languageSection.en', icon: Languages },
  { value: 'zh-CN', labelKey: 'settings.languageSection.zh-CN', icon: Languages },
]

/**
 * Interface-language picker as radio cards. Writes the choice to the settings
 * document; the settings provider reconciles i18next whenever `language`
 * changes, so this section needs no i18n context of its own.
 */
export function LanguageSection(): ReactElement {
  const { settings, updateSettings } = useSettings()
  const { t } = useTranslation()

  return (
    <SettingsSection id="language">
      <SettingsField legend={t('settings.languageSection.legend')} description={t('settings.languageSection.description')}>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
            const selected = settings.language === value
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
                  name="language"
                  value={value}
                  checked={selected}
                  onChange={() => updateSettings({ language: value })}
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
