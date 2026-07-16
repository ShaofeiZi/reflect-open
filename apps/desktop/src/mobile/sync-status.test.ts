import { describe, expect, it } from 'vitest'
import type { BackupState } from '@/lib/backup-controller'
import { mobileSyncStatus } from './sync-status'

/**
 * The plain-language mapping (Plan 19, step 10): engine product states plus
 * the conflicted-note count become the words mobile shows — never git terms.
 */

function connected(status: Extract<BackupState, { phase: 'connected' }>['status']): BackupState {
  return {
    phase: 'connected',
    remoteUrl: 'https://github.com/alex/notes.git',
    repo: { owner: 'alex', name: 'notes' },
    status,
  }
}

function genericConnected(
  remoteUrl: string,
  status: Extract<BackupState, { phase: 'connected' }>['status'],
): BackupState {
  return { phase: 'connected', remoteUrl, repo: null, status }
}

describe('mobileSyncStatus', () => {
  it('has nothing to say without a configured backup', () => {
    expect(mobileSyncStatus({ phase: 'loading' }, 0)).toBeNull()
    expect(mobileSyncStatus({ phase: 'disconnected' }, 0)).toBeNull()
  })

  it('rests on Backed up — the quiet tone the pill hides on', () => {
    const status = mobileSyncStatus(connected({ state: 'idle' }), 0)
    expect(status).toEqual({ label: 'Backed up', tone: 'ok', detail: null })
  })

  it('shows Syncing while a cycle runs — even with conflicts pending', () => {
    const status = mobileSyncStatus(connected({ state: 'syncing' }), 2)
    expect(status?.label).toBe('Syncing')
    expect(status?.tone).toBe('active')
  })

  it('headlines Needs review while any note carries conflict markers', () => {
    const one = mobileSyncStatus(connected({ state: 'idle' }), 1)
    expect(one?.label).toBe('Needs review')
    expect(one?.tone).toBe('attention')
    expect(one?.detail).toMatch(/open it to choose what to keep/i)

    const many = mobileSyncStatus(connected({ state: 'idle' }), 3)
    expect(many?.detail).toMatch(/^3 notes/)
    expect(many?.detail).toMatch(/open them to choose what to keep/i)
  })

  it('conflicts outrank a failed cycle (the actionable state leads)', () => {
    const status = mobileSyncStatus(
      connected({ state: 'error', errorKind: 'other', message: 'boom' }),
      1,
    )
    expect(status?.label).toBe('Needs review')
  })

  it('maps GitHub auth errors to a localized reconnect instruction', () => {
    const status = mobileSyncStatus(
      connected({ state: 'error', errorKind: 'auth', message: 'Sign in again' }),
      0,
    )
    expect(status?.label).toBe('Needs attention')
    expect(status?.detail).toBe('Reconnect GitHub to resume syncing.')
  })

  it('maps a generic HTTPS remote rejection to a localized SSH instruction', () => {
    const status = mobileSyncStatus(
      genericConnected('https://gitlab.com/alex/notes.git', {
        state: 'error',
        errorKind: 'rejected',
        message: 'internal adoption detail',
      }),
      0,
    )
    expect(status?.detail).toBe('This host needs an SSH remote before it can sync.')
  })

  it('keeps unknown diagnostics inside a localized error template', () => {
    const status = mobileSyncStatus(
      genericConnected('git@gitlab.com:alex/notes.git', {
        state: 'error',
        errorKind: 'other',
        message: 'disk full',
      }),
      0,
    )
    expect(status?.detail).toBe('Sync failed: disk full')
  })

  it('surfaces offline plainly — changes are safe locally', () => {
    const status = mobileSyncStatus(
      connected({ state: 'offline', message: 'Offline — changes are saved locally' }),
      0,
    )
    expect(status?.label).toBe('Offline')
    expect(status?.tone).toBe('attention')
    expect(status?.detail).toBe('Changes are saved locally and will sync when you reconnect.')
  })
})
