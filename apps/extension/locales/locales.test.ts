import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1),
  placeholders: z.record(z.string(), z.object({ content: z.string().min(1) })).optional(),
})

const catalogSchema = z.record(z.string(), messageSchema)

function readCatalog(locale: 'en' | 'zh_CN') {
  const path = resolve(import.meta.dirname, '..', 'public', '_locales', locale, 'messages.json')
  return catalogSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
}

function placeholderNames(message: string): string[] {
  return [...message.matchAll(/\$([A-Z][A-Z0-9_]*)\$/g)]
    .map((match) => match[1]!)
    .sort()
}

describe('extension locales', () => {
  it('keeps English and Simplified Chinese messages structurally identical', () => {
    const english = readCatalog('en')
    const chinese = readCatalog('zh_CN')

    expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort())
    for (const key of Object.keys(english)) {
      expect(placeholderNames(chinese[key]!.message), key).toEqual(
        placeholderNames(english[key]!.message),
      )
      expect(Object.keys(chinese[key]!.placeholders ?? {}).sort(), key).toEqual(
        Object.keys(english[key]!.placeholders ?? {}).sort(),
      )
    }
  })

  it('localizes every manifest message reference', () => {
    const config = readFileSync(resolve(import.meta.dirname, '..', 'wxt.config.ts'), 'utf8')
    const references = [
      ...new Set(
        [...config.matchAll(/__MSG_([A-Za-z0-9_]+)__/g)].map((match) => match[1]!),
      ),
    ]
    const english = readCatalog('en')
    const chinese = readCatalog('zh_CN')

    expect(references).toEqual([
      'extensionName',
      'extensionDescription',
      'saveCurrentPageCommand',
    ])
    for (const key of references) {
      expect(english[key], `English ${key}`).toBeDefined()
      expect(chinese[key], `Simplified Chinese ${key}`).toBeDefined()
    }
  })

  it('keeps the catalogs in exact sync with manifest and popup usage', () => {
    const sources = [
      readFileSync(resolve(import.meta.dirname, '..', 'wxt.config.ts'), 'utf8'),
      readFileSync(resolve(import.meta.dirname, '..', 'entrypoints', 'popup', 'app.tsx'), 'utf8'),
      readFileSync(resolve(import.meta.dirname, '..', 'entrypoints', 'popup', 'main.tsx'), 'utf8'),
    ].join('\n')
    const manifestKeys = [...sources.matchAll(/__MSG_([A-Za-z0-9_]+)__/g)].map(
      (match) => match[1]!,
    )
    const helperKeys = [...sources.matchAll(/\bmessage\('([A-Za-z0-9_]+)'/g)].map(
      (match) => match[1]!,
    )
    const directKeys = [...sources.matchAll(/getMessage\('([A-Za-z0-9_]+)'/g)].map(
      (match) => match[1]!,
    )
    const used = [...new Set([...manifestKeys, ...helperKeys, ...directKeys])].sort()

    expect(used).toEqual(Object.keys(readCatalog('en')).sort())
    expect(used).toEqual(Object.keys(readCatalog('zh_CN')).sort())
  })
})
