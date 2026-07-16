import { afterEach, describe, expect, it } from 'vitest'
import type { ReconcileStop } from '@reflect/core'
import { changeLanguage, DEFAULT_LANGUAGE } from '@/lib/i18n'
import { reconcileStopMessage } from './reconcile-stop-message'

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE)
})

describe('reconcileStopMessage', () => {
  it.each([
    ['auth', 'Authentication failed. Check the relevant account or API key in Settings and try again.'],
    ['notFound', 'A required note or file is no longer available. Refresh and try again.'],
    ['noGraph', 'No graph is open.'],
    ['traversal', 'The requested path is not allowed.'],
    ['network', 'The service is unavailable. Check your connection and try again.'],
    ['config', 'Finish configuring this feature in Settings and try again.'],
    ['stale', 'The graph changed before the operation finished. Try again.'],
  ] as const)('localizes the %s product state', (reason, expected) => {
    expect(reconcileStopMessage({ reason, message: 'internal detail' })).toBe(expected)
  })

  it.each([
    ['io', 'A file operation failed: disk full'],
    ['parse', 'Some data could not be read: malformed response'],
    ['unknown', 'The operation failed: unexpected failure'],
  ] as const)('keeps %s diagnostics inside a localized shell', (reason, expected) => {
    const details: Record<typeof reason, string> = {
      io: 'disk full',
      parse: 'malformed response',
      unknown: 'unexpected failure',
    }
    expect(reconcileStopMessage({ reason, message: details[reason] })).toBe(expected)
  })

  it('renders known states in Simplified Chinese', async () => {
    await changeLanguage('zh-CN')

    expect(
      reconcileStopMessage({ reason: 'auth', message: 'openai rejected the API key (401)' }),
    ).toBe('身份验证失败。请在设置中检查相关账号或 API 密钥后重试。')
    expect(reconcileStopMessage({ reason: 'io', message: 'disk full' })).toBe(
      '文件操作失败：disk full',
    )
  })

  it('accepts every ReconcileStop reason', () => {
    const reasons: ReconcileStop['reason'][] = [
      'auth',
      'notFound',
      'noGraph',
      'traversal',
      'io',
      'parse',
      'unknown',
      'network',
      'config',
      'stale',
    ]

    expect(reasons.map((reason) => reconcileStopMessage({ reason, message: reason }))).toHaveLength(
      reasons.length,
    )
  })
})
