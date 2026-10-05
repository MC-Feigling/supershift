import { describe, expect, it } from 'vitest'
import type { Placement, ShiftType } from '~/types/plan'
import { entriesForDay } from '~/utils/calendar'
import { SHIFT_COLOR_SWATCHES, shiftColor, shiftColorFromIndex } from '~/utils/shift-color'

function shiftType(overrides: Partial<ShiftType> & Pick<ShiftType, 'colorIndex'>): ShiftType {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    ownerId: '22222222-2222-4222-8222-222222222222',
    name: 'Früh',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function placement(): Placement {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    ownerId: '22222222-2222-4222-8222-222222222222',
    shiftTypeId: '11111111-1111-4111-8111-111111111111',
    startsOn: '2026-10-05',
    endsOn: null,
    repeatsWeekly: false,
    note: '',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('entriesForDay colors', () => {
  it('uses the stored color index, not the name hash', () => {
    const nameColor = shiftColor('Früh')
    const chosenIndex = SHIFT_COLOR_SWATCHES.findIndex((swatch) => swatch.background !== nameColor.background)
    expect(chosenIndex).toBeGreaterThanOrEqual(0)
    const entries = entriesForDay('2026-10-05', [placement()], [shiftType({ colorIndex: chosenIndex })])
    expect(entries).toHaveLength(1)
    expect(entries[0]?.background).toBe(shiftColorFromIndex(chosenIndex).background)
    expect(entries[0]?.background).not.toBe(nameColor.background)
  })
})
