import { afterEach, describe, expect, it } from 'vitest'
import {
  changeLanguage,
  DEFAULT_LANGUAGE,
  initI18n,
  RESOURCES,
  translate,
} from '@/lib/i18n'

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return child !== null && typeof child === 'object' && !Array.isArray(child)
      ? leafKeys(child, path)
      : [path]
  })
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

  it('switches non-React product feedback at runtime', async () => {
    initI18n()

    expect(translate('operations.links.opening')).toBe('Opening link')
    await changeLanguage('zh-CN')
    expect(translate('operations.links.opening')).toBe('正在打开链接')
  })
})
