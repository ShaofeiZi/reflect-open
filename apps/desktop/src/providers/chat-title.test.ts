import { describe, expect, it } from 'vitest'
import { conversationTitle } from './chat-title'

describe('conversationTitle', () => {
  it('uses the caller-provided localized title for an attachment-only conversation', () => {
    expect(conversationTitle('', '新建对话')).toBe('新建对话')
  })

  it('derives a normalized title from user text regardless of the empty fallback', () => {
    expect(conversationTitle('  Project   update  ', '新建对话')).toBe('Project update')
  })
})
