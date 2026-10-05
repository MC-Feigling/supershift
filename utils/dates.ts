import { DAYS_PER_WEEK, MONTH_GRID_LENGTH, MS_PER_DAY } from './constants'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })
const dayFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortFormatter = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  return toIsoDate(parseIsoDate(value)) === value
}

export function parseIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value)
  if (!match) return new Date(Number.NaN)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return new Date(year, month - 1, day)
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1)
}

export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % DAYS_PER_WEEK
}

export function dayDiff(laterIso: string, earlierIso: string): number {
  const later = parseIsoDate(laterIso)
  const earlier = parseIsoDate(earlierIso)
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY)
}

export function formatMonth(anchor: Date): string {
  return monthFormatter.format(anchor)
}

export function formatDay(iso: string): string {
  return dayFormatter.format(parseIsoDate(iso))
}

export function formatShortDay(iso: string): string {
  return shortFormatter.format(parseIsoDate(iso))
}

export interface MonthDay {
  iso: string
  dayNumber: number
  inMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

export function buildMonthDays(anchor: Date, today: string): MonthDay[] {
  const first = startOfMonth(anchor)
  const gridStart = addDays(first, -mondayIndex(first))
  return Array.from({ length: MONTH_GRID_LENGTH }, (_, index) => {
    const date = addDays(gridStart, index)
    const iso = toIsoDate(date)
    const weekday = date.getDay()
    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === anchor.getMonth() && date.getFullYear() === anchor.getFullYear(),
      isToday: iso === today,
      isWeekend: weekday === 0 || weekday === 6,
    }
  })
}
