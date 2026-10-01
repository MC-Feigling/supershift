import { buildCalendarCells, entriesForDay } from '~/utils/calendar'
import { formatDay, formatMonth, shiftMonth, startOfMonth, todayIso, toIsoDate } from '~/utils/dates'

export function useCalendar() {
  const plan = usePlanStore()
  const visibleMonth = ref(startOfMonth(new Date()))
  const selectedIso = ref(todayIso())

  const monthLabel = computed(() => formatMonth(visibleMonth.value))
  const anchorIso = computed(() => toIsoDate(visibleMonth.value))
  const selectedLabel = computed(() => formatDay(selectedIso.value))
  const cells = computed(() => buildCalendarCells(
    visibleMonth.value,
    todayIso(),
    selectedIso.value,
    plan.visiblePlacements,
    plan.visibleShiftTypes,
  ))
  const selectedEntries = computed(() => entriesForDay(
    selectedIso.value,
    plan.visiblePlacements,
    plan.visibleShiftTypes,
  ))

  function selectDay(iso: string): void {
    selectedIso.value = iso
  }

  function nextMonth(): void {
    visibleMonth.value = shiftMonth(visibleMonth.value, 1)
    selectedIso.value = toIsoDate(visibleMonth.value)
  }

  function previousMonth(): void {
    visibleMonth.value = shiftMonth(visibleMonth.value, -1)
    selectedIso.value = toIsoDate(visibleMonth.value)
  }

  function goToday(): void {
    const today = new Date()
    visibleMonth.value = startOfMonth(today)
    selectedIso.value = todayIso()
  }

  return {
    selectedIso,
    anchorIso,
    monthLabel,
    selectedLabel,
    cells,
    selectedEntries,
    selectDay,
    nextMonth,
    previousMonth,
    goToday,
  }
}
