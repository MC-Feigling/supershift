<script setup lang="ts">
import type { Placement, PlanShare, ShiftType } from '~/types/plan'
import { PLAN_QUERY, PLAN_SOURCE, PRINT_VIEW, ROUTES, WEEKDAY_LABELS } from '~/utils/constants'
import { entriesForDay } from '~/utils/calendar'
import { buildMonthDays, formatDay, formatMonth, formatWeekSpan, parseIsoDate, startOfMonth, todayIso, weekIsoDates } from '~/utils/dates'
import { isPrintView } from '~/utils/print-href'
import { firstQueryValue, parseAnchorDate, parseOwnerId } from '~/utils/query'

definePageMeta({ layout: 'print' })

const route = useRoute()
const plan = await useLoadedPlan()
const session = useSession()

const viewParam = computed(() => {
  const param = route.params.ansicht
  return typeof param === 'string' ? param : ''
})
const validView = computed(() => isPrintView(viewParam.value))
const isWeek = computed(() => viewParam.value === PRINT_VIEW.week)
const sharedRequested = computed(() => firstQueryValue(route.query[PLAN_QUERY.plan]) === PLAN_SOURCE.shared)
const anchor = computed(() => parseAnchorDate(route.query[PLAN_QUERY.date], todayIso()))
const requestedOwnerId = computed(() => parseOwnerId(route.query[PLAN_QUERY.owner]))
const sourceShare = computed(() => {
  if (!sharedRequested.value) return null
  return plan.incomingShares.find((share: PlanShare) => share.ownerId === requestedOwnerId.value) ?? plan.incomingShares[0] ?? null
})
const missingShare = computed(() => sharedRequested.value && sourceShare.value === null && plan.hasLoaded)
const placements = computed(() => {
  if (!sharedRequested.value) return plan.placements
  const ownerId = sourceShare.value?.ownerId
  if (!ownerId) return []
  return plan.sharedPlacements.filter((placement: Placement) => placement.ownerId === ownerId)
})
const shiftTypes = computed(() => {
  if (!sharedRequested.value) return plan.shiftTypes
  const ownerId = sourceShare.value?.ownerId
  if (!ownerId) return []
  return plan.sharedShiftTypes.filter((shiftType: ShiftType) => shiftType.ownerId === ownerId)
})
const weekColumns = computed(() => weekIsoDates(anchor.value).map((iso) => {
  const entries = entriesForDay(iso, placements.value, shiftTypes.value)
  return { iso, label: formatDay(iso), entries, isEmpty: entries.length === 0 }
}))
const weekSpan = computed(() => formatWeekSpan(weekColumns.value.map((column: { iso: string }) => column.iso)))
const monthDate = computed(() => startOfMonth(parseIsoDate(anchor.value)))
const monthLabel = computed(() => formatMonth(monthDate.value))
const monthCells = computed(() => buildMonthDays(monthDate.value, todayIso()).map((day) => {
  const entries = entriesForDay(day.iso, placements.value, shiftTypes.value).map((entry) => ({
    placementId: entry.placementId,
    name: entry.name,
    background: entry.background,
    color: entry.color,
    note: entry.note,
  }))
  return { ...day, entries, isEmpty: entries.length === 0 }
}))
const periodLabel = computed(() => isWeek.value ? weekSpan.value : monthLabel.value)
const heading = computed(() => isWeek.value ? 'Woche' : 'Monat')
const personLabel = computed(() => {
  if (sharedRequested.value) return sourceShare.value?.ownerEmail ?? ''
  return session.user.value?.email ?? ''
})
const pageTitle = computed(() => validView.value ? heading.value : 'Druck')
const showInitialLoading = computed(() => plan.status === 'loading' && !plan.hasLoaded)
const showBlockingError = computed(() => plan.status === 'error' && !plan.hasLoaded)
const blockingBody = computed(() => plan.errorMessage ?? '')
const homePath = ROUTES.home
const weekdayLabels = WEEKDAY_LABELS

useHead({ title: pageTitle })

function printDocument(): void {
  window.print()
}

async function retry(): Promise<void> {
  await plan.load()
}
</script>

<template>
  <article class="mx-auto max-w-page px-4 py-8 sm:px-8">
    <div class="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
      <NuxtLink :to="homePath" class="text-sm font-medium text-ink underline underline-offset-2">
        Zurück zum Kalender
      </NuxtLink>
      <AppButton @click="printDocument">Drucken</AppButton>
    </div>

    <StatusNote v-if="!validView" tone="error" title="Diese Druckansicht gibt es nicht" body="Öffne Woche oder Monat aus dem Kalender." />
    <StatusNote v-else-if="showInitialLoading" tone="info" title="Druck wird vorbereitet" body="Einen Moment." />
    <StatusNote v-else-if="showBlockingError" tone="error" title="Der Plan ist nicht erreichbar" :body="blockingBody">
      <AppButton class="no-print" @click="retry">Erneut laden</AppButton>
    </StatusNote>
    <StatusNote v-else-if="missingShare" tone="empty" title="Kein geteilter Plan" body="Dir wurde gerade kein Plan zum Lesen freigegeben." />

    <div v-else>
      <header class="border-b border-line pb-4">
        <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Schichtwerk</p>
        <h1 class="mt-1 text-4xl font-medium tracking-tight">{{ heading }}</h1>
        <p class="mt-2 text-lg">{{ periodLabel }}</p>
        <p class="text-sm text-muted">{{ personLabel }}</p>
      </header>

      <div v-if="isWeek" class="mt-6 grid gap-3 sm:grid-cols-7">
        <section v-for="column in weekColumns" :key="column.iso" class="print-day border border-line p-3">
          <h2 class="text-sm font-medium">{{ column.label }}</h2>
          <p v-if="column.isEmpty" class="mt-3 text-sm text-muted">Keine Schicht</p>
          <ul v-else class="mt-3 space-y-2">
            <li
              v-for="entry in column.entries"
              :key="entry.placementId"
              class="px-2 py-1 text-sm font-medium"
              :style="{ backgroundColor: entry.background, color: entry.color }"
            >
              <span>{{ entry.name }}</span>
              <span v-if="entry.note" class="mt-1 block text-xs font-normal">Notiz {{ entry.note }}</span>
            </li>
          </ul>
        </section>
      </div>

      <div v-else class="mt-6">
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted">
          <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
        </div>
        <div class="mt-1 grid grid-cols-7 gap-1">
          <section
            v-for="cell in monthCells"
            :key="cell.iso"
            class="print-day min-h-24 border border-line p-1.5"
            :class="cell.inMonth ? 'bg-card' : 'bg-concrete'"
          >
            <p class="text-xs font-medium tabular-nums">{{ cell.dayNumber }}</p>
            <p
              v-for="entry in cell.entries"
              :key="entry.placementId"
              class="mt-1 px-1 text-[10px] font-medium"
              :style="{ backgroundColor: entry.background, color: entry.color }"
            >
              <span class="block truncate">{{ entry.name }}</span>
              <span v-if="entry.note" class="block truncate font-normal">Notiz {{ entry.note }}</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  </article>
</template>
