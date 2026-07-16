import { afterEach, describe, expect, it } from 'vitest'
import { changeLanguage, DEFAULT_LANGUAGE } from '@/lib/i18n'
import { userErrorMessage } from './user-error-message'

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE)
})

describe('userErrorMessage', () => {
  it.each([
    ['auth', 'Authentication failed. Check the relevant account or API key in Settings and try again.'],
    ['notFound', 'A required note or file is no longer available. Refresh and try again.'],
    ['noGraph', 'No graph is open.'],
    ['traversal', 'The requested path is not allowed.'],
    ['network', 'The service is unavailable. Check your connection and try again.'],
  ] as const)('localizes the %s product state', (kind, expected) => {
    expect(userErrorMessage({ kind, message: 'internal detail' })).toBe(expected)
  })

  it.each([
    ['io', 'A file operation failed: disk full'],
    ['parse', 'Some data could not be read: malformed response'],
    ['unknown', 'The operation failed: unexpected failure'],
  ] as const)('keeps %s diagnostics inside a localized shell', (kind, expected) => {
    expect(userErrorMessage({ kind, message: expected.split(': ')[1] })).toBe(expected)
  })

  it('renders structured errors in Simplified Chinese', async () => {
    await changeLanguage('zh-CN')

    expect(userErrorMessage({ kind: 'auth', message: 'token rejected' })).toBe(
      '身份验证失败。请在设置中检查相关账号或 API 密钥后重试。',
    )
    expect(userErrorMessage({ kind: 'io', message: 'disk full' })).toBe('文件操作失败：disk full')
  })

  it('keeps foreign error diagnostics inside the localized fallback', () => {
    expect(userErrorMessage(new Error('provider-specific failure'))).toBe(
      'The operation failed: provider-specific failure',
    )
  })
})
