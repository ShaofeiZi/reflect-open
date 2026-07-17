import { act, renderHook } from '@testing-library/react'
import { DEFAULT_EDITOR_MESSAGES } from '@meowdown/react'
import { afterEach, describe, expect, it } from 'vitest'
import { changeLanguage, DEFAULT_LANGUAGE } from '@/lib/i18n'
import { useEditorMessages } from './use-editor-messages'

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE)
})

function materializeMessages(messages: ReturnType<typeof useEditorMessages>): object {
  return {
    ...messages,
    codeBlock: {
      ...messages.codeBlock,
      languageLabel: messages.codeBlock.languageLabel('Plain text', ''),
      customLanguage: messages.codeBlock.customLanguage('C++'),
    },
    mermaid: {
      ...messages.mermaid,
      renderError: messages.mermaid.renderError('unsupported'),
    },
    math: {
      ...messages.math,
      renderError: messages.math.renderError('invalid'),
    },
  }
}

describe('useEditorMessages', () => {
  it('maps the default English editor controls without changing existing copy', () => {
    const { result } = renderHook(() => useEditorMessages())

    expect(materializeMessages(result.current)).toEqual(materializeMessages(DEFAULT_EDITOR_MESSAGES))
    expect(result.current.slashMenu.heading1).toBe('Heading 1')
    expect(result.current.link.paste).toBe('Paste link...')
    expect(result.current.table.alignLeft).toBe('Align Left')
    expect(result.current.codeBlock.languageLabel('Plain text', '')).toBe('Plain text')
    expect(result.current.codeBlock.customLanguage('C++')).toBe('Use "C++"')
  })

  it('switches every dynamic editor boundary to Simplified Chinese', async () => {
    const { result } = renderHook(() => useEditorMessages())

    await act(async () => {
      await changeLanguage('zh-CN')
    })

    expect(result.current.copy.copied).toBe('已复制')
    expect(result.current.slashMenu.heading1).toBe('一级标题')
    expect(result.current.tagMenu.noTags).toBe('未找到标签')
    expect(result.current.wikilinkMenu.noNotes).toBe('未找到笔记')
    expect(result.current.codeBlock.languageLabel('Plain text', '')).toBe('纯文本')
    expect(result.current.codeBlock.languageLabel('Math', 'math')).toBe('数学')
    expect(result.current.codeBlock.languageLabel('TypeScript', 'typescript')).toBe('TypeScript')
    expect(result.current.codeBlock.customLanguage('C++')).toBe('使用“C++”')
    expect(result.current.mermaid.renderError('unsupported')).toBe('无法渲染图表：unsupported')
    expect(result.current.math.renderError('invalid')).toBe('无法渲染公式：invalid')
    expect(result.current.embed.youtubeVideo).toBe('YouTube 视频')
  })
})
