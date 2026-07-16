import { useState, type ReactElement } from 'react'
import { CHAT_SYSTEM_PROMPT_MAX_LENGTH, normalizeChatSystemPrompt } from '@reflect/core'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Textarea } from '@/components/ui/textarea'

interface ChatSystemPromptDrawerProps {
  value: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (value: string) => void
}

/** The mobile editor for the AI chat's user-configured system prompt. */
export function ChatSystemPromptDrawer({
  value,
  open,
  onOpenChange,
  onSave,
}: ChatSystemPromptDrawerProps): ReactElement {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-label={t('mobile.chat-system-prompt.aria')}>
        {open ? (
          <ChatSystemPromptSheet
            value={value}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

function ChatSystemPromptSheet({
  value,
  onSave,
  onClose,
}: {
  value: string
  onSave: (value: string) => void
  onClose: () => void
}): ReactElement {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  const [dirty, setDirty] = useState(false)
  const currentDraft = dirty ? draft : value

  return (
    <>
      <DrawerTitle className="px-4 pt-1">{t('mobile.chat-system-prompt.title')}</DrawerTitle>
      <div className="flex max-h-[75dvh] flex-col gap-4 overflow-y-auto px-4 pb-8 pt-3">
        <p className="text-sm text-text-muted">
          {t('mobile.chat-system-prompt.description', {
            count: CHAT_SYSTEM_PROMPT_MAX_LENGTH.toLocaleString(),
          })}
        </p>
        <Textarea
          aria-label={t('mobile.chat-system-prompt.instructions')}
          value={currentDraft}
          onChange={(event) => {
            setDirty(true)
            setDraft(event.target.value)
          }}
          maxLength={CHAT_SYSTEM_PROMPT_MAX_LENGTH}
          rows={8}
          autoFocus
          placeholder={t('mobile.chat-system-prompt.placeholder')}
          className="min-h-36 resize-y text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={normalizeChatSystemPrompt(currentDraft) === ''}
            onClick={() => {
              onSave('')
              onClose()
            }}
          >
            {t('mobile.chat-system-prompt.use-default')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(normalizeChatSystemPrompt(currentDraft))
              onClose()
            }}
          >
            {t('mobile.chat-system-prompt.save')}
          </Button>
        </div>
      </div>
    </>
  )
}
