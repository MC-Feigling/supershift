import { describe, expect, it } from 'vitest'
import { SHARE_CHANNEL, SHARE_STATUS, type PlanShare } from '~/types/plan'
import { isReadOnlyView, noticeRecipientId, preferredSharedOwnerId } from '~/utils/share-access'

function share(overrides: Partial<PlanShare> = {}): PlanShare {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    ownerId: 'owner-id',
    ownerEmail: 'owner@example.com',
    granteeEmail: 'reader@example.com',
    granteeId: 'grantee-id',
    status: SHARE_STATUS.active,
    canWrite: false,
    inviteChannel: SHARE_CHANNEL.email,
    inviteToken: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    revokedAt: null,
    ...overrides,
  }
}

describe('isReadOnlyView', () => {
  it('lets the owner write the own plan', () => {
    expect(isReadOnlyView('own', null)).toBe(false)
  })

  it('keeps a shared plan read-only without write access', () => {
    expect(isReadOnlyView('shared', share({ canWrite: false }))).toBe(true)
  })

  it('opens a shared plan when write access is granted', () => {
    expect(isReadOnlyView('shared', share({ canWrite: true }))).toBe(false)
  })
})

describe('noticeRecipientId', () => {
  it('notifies the grantee when the owner writes', () => {
    expect(noticeRecipientId('owner-id', share({ canWrite: false }))).toBe('grantee-id')
  })

  it('notifies the owner when a writer grantee writes', () => {
    expect(noticeRecipientId('grantee-id', share({ canWrite: true }))).toBe('owner-id')
  })

  it('notifies nobody when a reader spoofs a write notice', () => {
    expect(noticeRecipientId('grantee-id', share({ canWrite: false }))).toBeNull()
  })
})

describe('preferredSharedOwnerId', () => {
  it('keeps the owner on their own plan', () => {
    expect(preferredSharedOwnerId(share(), [share({ ownerId: 'other' })])).toBeNull()
  })

  it('opens the writable shared plan for a partner without an own share', () => {
    const incoming = [
      share({ ownerId: 'read-owner', canWrite: false }),
      share({ ownerId: 'write-owner', canWrite: true }),
    ]
    expect(preferredSharedOwnerId(null, incoming)).toBe('write-owner')
  })

  it('opens a read-only shared plan when that is the only access', () => {
    expect(preferredSharedOwnerId(null, [share({ ownerId: 'read-owner', canWrite: false })])).toBe('read-owner')
  })
})
