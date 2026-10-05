import { describe, expect, it } from 'vitest'
import { SHARE_STATUS, type PlanShare } from '~/types/plan'
import { isReadOnlyView, noticeRecipientId } from '~/utils/share-access'

function share(overrides: Partial<PlanShare> = {}): PlanShare {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    ownerId: 'owner-id',
    ownerEmail: 'owner@example.com',
    granteeEmail: 'reader@example.com',
    granteeId: 'grantee-id',
    status: SHARE_STATUS.active,
    canWrite: false,
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
