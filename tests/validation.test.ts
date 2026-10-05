import { describe, expect, it } from 'vitest'
import { validateShiftColorIndex } from '~/utils/validation'
import { SHIFT_COLOR_SWATCHES } from '~/utils/shift-color'

describe('validateShiftColorIndex', () => {
  it('accepts every palette index', () => {
    SHIFT_COLOR_SWATCHES.forEach((_, index) => {
      expect(validateShiftColorIndex(index)).toBeNull()
    })
  })

  it('rejects values outside the palette', () => {
    expect(validateShiftColorIndex(-1)).toBe('Wähle eine Farbe.')
    expect(validateShiftColorIndex(SHIFT_COLOR_SWATCHES.length)).toBe('Wähle eine Farbe.')
    expect(validateShiftColorIndex(1.5)).toBe('Wähle eine Farbe.')
  })
})
