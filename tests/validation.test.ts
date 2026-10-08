import { describe, expect, it } from 'vitest'
import { passwordRequirements, validateCredentials, validatePassword, validateShiftColorIndex } from '~/utils/validation'
import { SHIFT_COLOR_SWATCHES } from '~/utils/shift-color'

const STRONG_PASSWORD = 'Schicht1!'

describe('validatePassword', () => {
  it('accepts a sign-in password that only meets the length', () => {
    expect(validatePassword('schichtplan')).toBeNull()
  })

  it('rejects a short sign-in password', () => {
    expect(validatePassword('kurz')).toBe('Mindestens 8 Zeichen.')
  })

  it('accepts a sign-up password with length, case, digit, and symbol', () => {
    expect(validatePassword(STRONG_PASSWORD, true)).toBeNull()
    expect(passwordRequirements(STRONG_PASSWORD).every((rule) => rule.met)).toBe(true)
  })

  it('names every missing sign-up rule', () => {
    expect(validatePassword('', true)).toBe(
      'Das Passwort braucht mindestens 8 Zeichen, einen Kleinbuchstaben, einen Großbuchstaben, eine Zahl und ein Sonderzeichen.',
    )
  })

  it('names only the missing sign-up rules', () => {
    expect(validatePassword('Schicht12', true)).toBe('Das Passwort braucht ein Sonderzeichen.')
    expect(validatePassword('schicht1!', true)).toBe('Das Passwort braucht einen Großbuchstaben.')
    expect(validatePassword('SCHICHT1!', true)).toBe('Das Passwort braucht einen Kleinbuchstaben.')
    expect(validatePassword('Schicht!!', true)).toBe('Das Passwort braucht eine Zahl.')
  })

  it('keeps sign-in validation independent from the sign-up rules', () => {
    expect(validateCredentials('ada@example.com', 'schichtplan').password).toBeNull()
    expect(validateCredentials('ada@example.com', 'schichtplan', { strictPassword: true }).password).toBe(
      'Das Passwort braucht einen Großbuchstaben, eine Zahl und ein Sonderzeichen.',
    )
  })
})

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
