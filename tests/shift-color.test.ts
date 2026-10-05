import { describe, expect, it } from 'vitest'
import {
  hashShiftColorIndex,
  nextUnusedColorIndex,
  SHIFT_COLOR_SWATCHES,
  shiftColor,
  shiftColorFromIndex,
} from '~/utils/shift-color'

describe('shiftColor', () => {
  it('keeps the same palette color for the same name, ignoring case', () => {
    expect(shiftColor('Früh')).toEqual(shiftColor('früh'))
  })
})

describe('hashShiftColorIndex', () => {
  it('stays inside the palette', () => {
    const index = hashShiftColorIndex('Spät')
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(SHIFT_COLOR_SWATCHES.length)
  })

  it('matches shiftColor for existing names', () => {
    const names = ['Früh', 'Spät', 'Nacht', 'Frei']
    for (const name of names) {
      expect(shiftColorFromIndex(hashShiftColorIndex(name))).toEqual(shiftColor(name))
    }
  })
})

describe('shiftColorFromIndex', () => {
  it('returns the swatch at the chosen index', () => {
    const swatch = SHIFT_COLOR_SWATCHES[3]
    expect(swatch).toBeDefined()
    expect(shiftColorFromIndex(3)).toEqual({
      background: swatch?.background,
      color: swatch?.color,
    })
  })

  it('falls back to the first swatch for an invalid index', () => {
    const first = SHIFT_COLOR_SWATCHES[0]
    expect(shiftColorFromIndex(-1)).toEqual({
      background: first?.background,
      color: first?.color,
    })
    expect(shiftColorFromIndex(99)).toEqual({
      background: first?.background,
      color: first?.color,
    })
  })
})

describe('nextUnusedColorIndex', () => {
  it('picks the first free palette slot', () => {
    expect(nextUnusedColorIndex([])).toBe(0)
    expect(nextUnusedColorIndex([0, 2])).toBe(1)
  })

  it('wraps to the first slot when every color is used', () => {
    const used = SHIFT_COLOR_SWATCHES.map((_, index) => index)
    expect(nextUnusedColorIndex(used)).toBe(0)
  })
})
