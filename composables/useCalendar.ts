import { buildCalendarCells, entriesForDay } from '~/utils/calendar'
import { formatDay, formatMonth, shiftMonth, startOfMonth, todayIso, toIsoDate } from '~/utils/dates'

export function useCalendar() {
  const plan = usePlanStore()
  const visibleMonth = ref(startOfMonth(new Date()))
  const selectedIso = ref('')

  const monthLabel = computed(() => formatMonth(visibleMonth.value))
  const anchorIso = computed(() => toIsoDate(visibleMonth.value))
  const selectedLabel = computed(() => selectedIso.value ? formatDay(selectedIso.value) : '')
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

  function clearSelection(): void {
    selectedIso.value = ''
  }

  function nextMonth(): void {
    visibleMonth.value = shiftMonth(visibleMonth.value, 1)
  }

  function previousMonth(): void {
    visibleMonth.value = shiftMonth(visibleMonth.value, -1)
  }

  function goToday(): void {
    visibleMonth.value = startOfMonth(new Date())
  }

  return {
    selectedIso,
    anchorIso,
    monthLabel,
    selectedLabel,
    cells,
    selectedEntries,
    selectDay,
    clearSelection,
    nextMonth,
    previousMonth,
    goToday,
  }
}
