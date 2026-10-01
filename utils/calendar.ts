import type { CalendarCell, DayChip, DayEntry, Placement, ShiftType } from '~/types/plan'
import { MAX_VISIBLE_DAY_CHIPS } from './constants'
import { buildMonthDays, formatDay, formatShortDay } from './dates'
import { occursOn } from './occurrences'
import { shiftColor } from './shift-color'

export function buildCalendarCells(
  anchor: Date,
  today: string,
  selectedIso: string,
  placements: readonly Placement[],
  shiftTypes: readonly ShiftType[],
): CalendarCell[] {
  return buildMonthDays(anchor, today).map((day) => {
    const chips = chipsForDay(day.iso, placements, shiftTypes)
    const visible = chips.slice(0, MAX_VISIBLE_DAY_CHIPS)
    const hidden = chips.length - visible.length
    const names = chips.map((chip) => chip.name).join(', ')
    return {
      iso: day.iso,
      dayNumber: day.dayNumber,
      inMonth: day.inMonth,
      isToday: day.isToday,
      isWeekend: day.isWeekend,
      isSelected: day.iso === selectedIso,
      label: names.length > 0 ? `${formatDay(day.iso)}: ${names}` : formatDay(day.iso),
      chips: visible,
      hiddenChipLabel: hidden > 0 ? `+${hidden}` : null,
    }
  })
}

export function entriesForDay(
  iso: string,
  placements: readonly Placement[],
  shiftTypes: readonly ShiftType[],
): DayEntry[] {
  const names = new Map(shiftTypes.map((shiftType) => [shiftType.id, shiftType.name]))
  const entries: DayEntry[] = []
  for (const placement of placements) {
    if (!occursOn(placement, iso)) continue
    const name = names.get(placement.shiftTypeId)
    if (!name) continue
    const color = shiftColor(name)
    entries.push({
      placementId: placement.id,
      name,
      background: color.background,
      color: color.color,
      detail: placementDetail(placement),
      removeLabel: placement.repeatsWeekly ? 'Serie entfernen' : 'Eintrag entfernen',
    })
  }
  return entries.sort((left, right) => left.name.localeCompare(right.name, 'de'))
}

function chipsForDay(iso: string, placements: readonly Placement[], shiftTypes: readonly ShiftType[]): DayChip[] {
  return entriesForDay(iso, placements, shiftTypes).map((entry) => ({
    placementId: entry.placementId,
    name: entry.name,
    background: entry.background,
    color: entry.color,
  }))
}

function placementDetail(placement: Placement): string {
  if (!placement.repeatsWeekly || !placement.endsOn) return 'Einzeltag'
  return `Wöchentlich bis ${formatShortDay(placement.endsOn)}`
}
