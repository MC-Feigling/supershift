import { DAYS_PER_WEEK } from './constants'
import { dayDiff } from './dates'

export interface OccurrenceSource {
  startsOn: string
  endsOn: string | null
  repeatsWeekly: boolean
}

export function occursOn(source: OccurrenceSource, iso: string): boolean {
  if (iso < source.startsOn) return false
  if (!source.repeatsWeekly) return iso === source.startsOn
  if (!source.endsOn || iso > source.endsOn) return false
  return dayDiff(iso, source.startsOn) % DAYS_PER_WEEK === 0
}
