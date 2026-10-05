import { describe, expect, it } from 'vitest'
import { PLAN_NOTICE_KIND, validatePlanNotice } from '~/utils/push'

const validBase = {
  kind: PLAN_NOTICE_KIND.created,
  shiftName: 'Früh',
  startsOn: '2026-10-05',
  repeatsWeekly: false,
  endsOn: null,
}

describe('validatePlanNotice', () => {
  it('rejects a notice without the plan owner', () => {
    expect(validatePlanNotice(validBase)).toBeNull()
  })

  it('accepts a notice with a plan owner id', () => {
    const notice = validatePlanNotice({
      ...validBase,
      planOwnerId: '55555555-5555-4555-8555-555555555555',
    })
    expect(notice?.planOwnerId).toBe('55555555-5555-4555-8555-555555555555')
  })
})
