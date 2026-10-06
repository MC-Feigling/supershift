import type { Placement, PlacementDraft } from '~/types/plan'
import { EMAIL_MAX_LENGTH, MIN_PASSWORD_LENGTH, NOTE_MAX_LENGTH, SERIES_MAX_DAYS, SHIFT_NAME_MAX_LENGTH } from './constants'
import { isShiftColorIndex } from './shift-color'
import { dayDiff, isIsoDate, parseIsoDate } from './dates'
import { occursOn } from './occurrences'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const LOWERCASE_PATTERN = /[a-z]/
const UPPERCASE_PATTERN = /[A-Z]/
const DIGIT_PATTERN = /[0-9]/
const SYMBOL_PATTERN = /[^A-Za-z0-9]/

export interface CredentialErrors {
  email: string | null
  password: string | null
}

export interface CredentialOptions {
  strictPassword?: boolean
}

export interface PasswordRequirement {
  id: 'length' | 'lower' | 'upper' | 'digit' | 'symbol'
  label: string
  missingLabel: string
  met: boolean
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeShiftName(value: string): string {
  return value.trim()
}

export function normalizeNote(value: string): string {
  return value.trim()
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

const STRONG_PASSWORD_RULES = [
  {
    id: 'length',
    label: `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`,
    missingLabel: `mindestens ${MIN_PASSWORD_LENGTH} Zeichen`,
    matches: (password: string) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: 'lower',
    label: 'Kleinbuchstabe',
    missingLabel: 'einen Kleinbuchstaben',
    matches: (password: string) => LOWERCASE_PATTERN.test(password),
  },
  {
    id: 'upper',
    label: 'Großbuchstabe',
    missingLabel: 'einen Großbuchstaben',
    matches: (password: string) => UPPERCASE_PATTERN.test(password),
  },
  {
    id: 'digit',
    label: 'Zahl',
    missingLabel: 'eine Zahl',
    matches: (password: string) => DIGIT_PATTERN.test(password),
  },
  {
    id: 'symbol',
    label: 'Sonderzeichen',
    missingLabel: 'ein Sonderzeichen',
    matches: (password: string) => SYMBOL_PATTERN.test(password),
  },
] as const

export function passwordRequirements(password: string): PasswordRequirement[] {
  return STRONG_PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    missingLabel: rule.missingLabel,
    met: rule.matches(password),
  }))
}

function joinLabels(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`
}

export function validatePassword(password: string, strict = false): string | null {
  if (!strict) {
    return password.length >= MIN_PASSWORD_LENGTH ? null : `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`
  }
  const missing = passwordRequirements(password).filter((rule) => !rule.met).map((rule) => rule.missingLabel)
  if (missing.length === 0) return null
  return `Das Passwort braucht ${joinLabels(missing)}.`
}

export function validateCredentials(
  email: string,
  password: string,
  options: CredentialOptions = {},
): CredentialErrors {
  return {
    email: validateEmail(email),
    password: validatePassword(password, options.strictPassword === true),
  }
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email)
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > EMAIL_MAX_LENGTH) {
    return 'Gib eine gültige E-Mail-Adresse ein.'
  }
  return null
}

export function validateShareEmail(email: string, ownEmail: string): string | null {
  const emailError = validateEmail(email)
  if (emailError) return emailError
  if (normalizeEmail(email) === normalizeEmail(ownEmail)) {
    return 'Du kannst den Plan nicht mit dir selbst teilen.'
  }
  return null
}

export function validateShiftName(name: string): string | null {
  const normalized = normalizeShiftName(name)
  if (normalized.length === 0) return 'Gib einen Namen ein.'
  if (normalized.length > SHIFT_NAME_MAX_LENGTH) {
    return `Höchstens ${SHIFT_NAME_MAX_LENGTH} Zeichen.`
  }
  return null
}

export function validateShiftColorIndex(index: number): string | null {
  if (!isShiftColorIndex(index)) return 'Wähle eine Farbe.'
  return null
}

export function validateNote(note: string): string | null {
  if (note.length > NOTE_MAX_LENGTH) {
    return `Höchstens ${NOTE_MAX_LENGTH} Zeichen.`
  }
  return null
}

export function validatePlacement(draft: PlacementDraft, knownShiftIds: readonly string[]): string | null {
  if (!isUuid(draft.shiftTypeId) || !knownShiftIds.includes(draft.shiftTypeId)) {
    return 'Wähle eine Schicht.'
  }
  if (!isIsoDate(draft.startsOn)) return 'Das Datum ist ungültig.'
  const noteError = validateNote(draft.note)
  if (noteError) return noteError
  if (!draft.repeatsWeekly) return null
  if (!draft.endsOn || !isIsoDate(draft.endsOn)) return 'Wähle das Enddatum der Serie.'
  if (draft.endsOn < draft.startsOn) return 'Das Enddatum liegt vor dem Start.'
  if (dayDiff(draft.endsOn, draft.startsOn) > SERIES_MAX_DAYS) {
    return 'Das Enddatum liegt zu weit in der Zukunft. Höchstens zwei Jahre.'
  }
  return null
}

export function placementsConflict(existing: readonly Placement[], draft: PlacementDraft): boolean {
  return existing.some((placement) => placement.shiftTypeId === draft.shiftTypeId && rangesConflict(placement, draft))
}

function rangesConflict(placement: Placement, draft: PlacementDraft): boolean {
  const placementEnd = placement.repeatsWeekly ? placement.endsOn ?? placement.startsOn : placement.startsOn
  const draftEnd = draft.repeatsWeekly ? draft.endsOn ?? draft.startsOn : draft.startsOn
  if (placement.startsOn > draftEnd || draft.startsOn > placementEnd) return false
  if (!placement.repeatsWeekly && !draft.repeatsWeekly) return placement.startsOn === draft.startsOn
  if (!placement.repeatsWeekly) return occursOn(draft, placement.startsOn)
  if (!draft.repeatsWeekly) return occursOn(placement, draft.startsOn)
  return parseWeekday(placement.startsOn) === parseWeekday(draft.startsOn)
}

function parseWeekday(iso: string): number {
  return parseIsoDate(iso).getDay()
}
