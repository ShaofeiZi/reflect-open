import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  changeLanguage,
  DEFAULT_LANGUAGE,
  initI18n,
  RESOURCES,
  translate,
} from '@/lib/i18n'

const SOURCE_ROOT = resolve(import.meta.dirname, '..')

const INTENTIONALLY_SHARED_VALUES = new Set([
  'menu.app',
  'mobile.graph-chooser.icloud-title',
  'mobile.settings-screen.ai',
  'mobile.settings-screen.github',
  'mobile.settings-screen.language-en',
  'mobile.settings-screen.language-zh-CN',
  'settings.aboutSection.appName',
  'settings.importSection.reflectV1.legend',
  'settings.languageSection.en',
  'settings.languageSection.zh-CN',
  'settings.modelCombobox.emptyKey',
  'settings.updateSection.downloadingPercent',
])

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? leafKeys(child, path)
      : [path]
  })
}

function flattenedResources(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const path = prefix === '' ? key : `${prefix}.${key}`
      return child !== null && typeof child === 'object' && !Array.isArray(child)
        ? Object.entries(flattenedResources(child, path))
        : [[path, String(child)]]
    }),
  )
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(path)
    }
    return /\.[jt]sx?$/.test(entry.name) && !/\.(?:test|spec)\.[jt]sx?$/.test(entry.name)
      ? [path]
      : []
  })
}

function staticTranslationKeys(): string[] {
  const patterns = [
    /\b(?:t|translate)\(\s*['"`]([^'"`]+)['"`]/g,
    /\btitleKey\s*:\s*['"`]([^'"`]+)['"`]/g,
    /\bi18nKey\s*=\s*['"]([^'"]+)['"]/g,
  ]
  return [
    ...new Set(
      sourceFiles(SOURCE_ROOT).flatMap((path) => {
        const source = readFileSync(path, 'utf8')
        return patterns.flatMap((pattern) =>
          [...source.matchAll(pattern)].map((match) => match[1]!),
        )
      }),
    ),
  ].sort()
}

function interpolationNames(value: string): string[] {
  return [...value.matchAll(/\{\{\s*([^},\s]+)[^}]*\}\}/g)]
    .map((match) => match[1]!)
    .sort()
}

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE)
})

describe('desktop locales', () => {
  it('keeps English and Simplified Chinese resources structurally identical', () => {
    expect(leafKeys(RESOURCES['zh-CN'].translation).sort()).toEqual(
      leafKeys(RESOURCES.en.translation).sort(),
    )
  })

  it('defines every statically referenced translation key in both locales', () => {
    const english = flattenedResources(RESOURCES.en.translation)
    const chinese = flattenedResources(RESOURCES['zh-CN'].translation)

    for (const key of staticTranslationKeys()) {
      expect(english[key], `English ${key}`).toBeDefined()
      expect(chinese[key], `Simplified Chinese ${key}`).toBeDefined()
    }
  })

  it('keeps interpolation variables identical between locales', () => {
    const english = flattenedResources(RESOURCES.en.translation)
    const chinese = flattenedResources(RESOURCES['zh-CN'].translation)

    for (const [key, value] of Object.entries(english)) {
      expect(interpolationNames(chinese[key]!), key).toEqual(interpolationNames(value))
    }
  })

  it('only shares reviewed language-neutral values with English', () => {
    const english = flattenedResources(RESOURCES.en.translation)
    const chinese = flattenedResources(RESOURCES['zh-CN'].translation)
    const shared = Object.keys(english)
      .filter((key) => english[key] === chinese[key])
      .sort()

    expect(shared).toEqual([...INTENTIONALLY_SHARED_VALUES].sort())
  })

  it('uses Simplified Chinese punctuation in Chinese copy', () => {
    const chinese = flattenedResources(RESOURCES['zh-CN'].translation)

    for (const [key, value] of Object.entries(chinese)) {
      if (!/[\u3400-\u9fff]/u.test(value)) {
        continue
      }
      expect(value, `${key} uses an ASCII comma`).not.toContain(',')
      expect(value, `${key} uses three periods instead of an ellipsis`).not.toContain('...')
      expect(value, `${key} uses an ASCII colon before interpolation`).not.toMatch(/:\s*\{\{/u)
      expect(value, `${key} uses ASCII parentheses around Chinese copy`).not.toMatch(
        /[\u3400-\u9fff]\s*\(|\)[\u3400-\u9fff]/u,
      )
      expect(value, `${key} uses a spaced Western dash`).not.toContain(' — ')
    }
  })

  it('switches non-React product feedback at runtime', async () => {
    initI18n()

    expect(translate('operations.links.opening')).toBe('Opening link')
    await changeLanguage('zh-CN')
    expect(translate('operations.links.opening')).toBe('正在打开链接')
  })

  it('keeps the document language metadata in sync', async () => {
    expect(document.documentElement.lang).toBe('en')

    await changeLanguage('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')

    await changeLanguage('fr')
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})
