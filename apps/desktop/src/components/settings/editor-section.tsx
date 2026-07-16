import type { ReactElement } from 'react'
import type { EditorMarkdownSyntax, EditorTextSize } from '@reflect/core'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSettings } from '@/providers/settings-provider'
import { SettingsField } from './field'
import { KeyboardShortcutsField } from './keyboard-shortcuts-field'
import { SettingsOptionCard } from './option-card'
import { SettingsSection } from './section'
import { SettingsSwitchField } from './switch-field'

interface MarkdownSyntaxOption {
  value: EditorMarkdownSyntax
  labelKey: string
  descriptionKey: string
}

const MARKDOWN_SYNTAX_OPTIONS: MarkdownSyntaxOption[] = [
  {
    value: 'hide',
    labelKey: 'settings.editorSection.markdownOptions.hide.label',
    descriptionKey: 'settings.editorSection.markdownOptions.hide.description',
  },
  {
    value: 'hybrid',
    labelKey: 'settings.editorSection.markdownOptions.hybrid.label',
    descriptionKey: 'settings.editorSection.markdownOptions.hybrid.description',
  },
  {
    value: 'show',
    labelKey: 'settings.editorSection.markdownOptions.show.label',
    descriptionKey: 'settings.editorSection.markdownOptions.show.description',
  },
]

interface TextSizeOption {
  value: EditorTextSize
  labelKey: string
  descriptionKey: string
}

const TEXT_SIZE_OPTIONS: TextSizeOption[] = [
  {
    value: 'small',
    labelKey: 'settings.editorSection.textSizeOptions.small.label',
    descriptionKey: 'settings.editorSection.textSizeOptions.small.description',
  },
  {
    value: 'medium',
    labelKey: 'settings.editorSection.textSizeOptions.medium.label',
    descriptionKey: 'settings.editorSection.textSizeOptions.medium.description',
  },
  {
    value: 'large',
    labelKey: 'settings.editorSection.textSizeOptions.large.label',
    descriptionKey: 'settings.editorSection.textSizeOptions.large.description',
  },
]

export function EditorSection(): ReactElement {
  const { settings, updateSettings } = useSettings()
  const { t } = useTranslation()

  return (
    <SettingsSection id="editor">
      <SettingsField
        legend={t('settings.editorSection.markdownSyntax.legend')}
        description={t('settings.editorSection.markdownSyntax.description')}
      >
        <div className="mt-3 @container">
          <div className="grid grid-cols-1 gap-2 @xl:grid-cols-3">
            {MARKDOWN_SYNTAX_OPTIONS.map((option) => {
              const selected = settings.editorMarkdownSyntax === option.value
              return (
                <SettingsOptionCard
                  key={option.value}
                  selected={selected}
                  className="items-start justify-between gap-3 px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        selected && 'text-accent-soft-text',
                      )}
                    >
                      {t(option.labelKey)}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {t(option.descriptionKey)}
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="editor-markdown-syntax"
                    value={option.value}
                    checked={selected}
                    onChange={() => updateSettings({ editorMarkdownSyntax: option.value })}
                    className="mt-0.5 shrink-0 accent-accent"
                  />
                </SettingsOptionCard>
              )
            })}
          </div>
        </div>
      </SettingsField>

      <SettingsField
        legend={t('settings.editorSection.textSize.legend')}
        description={t('settings.editorSection.textSize.description')}
      >
        <div className="mt-3 @container">
          <div className="grid grid-cols-1 gap-2 @xl:grid-cols-3">
            {TEXT_SIZE_OPTIONS.map((option) => {
              const selected = settings.editorTextSize === option.value
              return (
                <SettingsOptionCard
                  key={option.value}
                  selected={selected}
                  className="items-start justify-between gap-3 px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        selected && 'text-accent-soft-text',
                      )}
                    >
                      {t(option.labelKey)}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {t(option.descriptionKey)}
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="editor-text-size"
                    value={option.value}
                    checked={selected}
                    onChange={() => updateSettings({ editorTextSize: option.value })}
                    className="mt-0.5 shrink-0 accent-accent"
                  />
                </SettingsOptionCard>
              )
            })}
          </div>
        </div>
      </SettingsField>

      <SettingsSwitchField
        legend={t('settings.editorSection.fullWidth.legend')}
        description={t('settings.editorSection.fullWidth.description')}
        checked={settings.editorFullWidth}
        onCheckedChange={(checked) => updateSettings({ editorFullWidth: checked })}
      />

      <SettingsSwitchField
        legend={t('settings.editorSection.spellCheck.legend')}
        description={t('settings.editorSection.spellCheck.description')}
        checked={settings.editorSpellCheck}
        onCheckedChange={(checked) => updateSettings({ editorSpellCheck: checked })}
      />

      <SettingsSwitchField
        legend={t('settings.editorSection.defaultBullet.legend')}
        description={t('settings.editorSection.defaultBullet.description')}
        checked={settings.editorDefaultBullet}
        onCheckedChange={(checked) => updateSettings({ editorDefaultBullet: checked })}
      />

      <SettingsSwitchField
        legend={t('settings.editorSection.bulletAfterHeading.legend')}
        description={t('settings.editorSection.bulletAfterHeading.description')}
        checked={settings.editorBulletAfterHeading}
        onCheckedChange={(checked) => updateSettings({ editorBulletAfterHeading: checked })}
      />

      <KeyboardShortcutsField />
    </SettingsSection>
  )
}
