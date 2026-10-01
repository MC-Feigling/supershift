import { isIsoDate } from './dates'
import { isUuid } from './validation'

export function firstQueryValue(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : null
  }
  return null
}

export function parseAnchorDate(value: unknown, fallback: string): string {
  const raw = firstQueryValue(value)
  if (raw && isIsoDate(raw)) return raw
  return fallback
}

export function parseOwnerId(value: unknown): string | null {
  const raw = firstQueryValue(value)
  if (raw && isUuid(raw)) return raw
  return null
}
