<script setup lang="ts">
import type { PlacementDraft, ShiftOption, ShiftType } from '~/types/plan'
import { todayIso } from '~/utils/dates'
import { toGermanError } from '~/utils/errors'
import { printHref } from '~/utils/print-href'

const plan = await useLoadedPlan()
const {
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
} = useCalendar()
const actionError = ref('')
const sheetOpen = ref(false)

const showInitialLoading = computed(() => plan.status === 'loading' && !plan.hasLoaded)
const showBlockingError = computed(() => plan.status === 'error' && !plan.hasLoaded)
const blockingBody = computed(() => plan.errorMessage ?? '')
const inlineError = computed(() => plan.hasLoaded ? plan.errorMessage ?? '' : '')
const shiftOptions = computed<ShiftOption[]>(() => plan.shiftTypes.map((shiftType: ShiftType) => ({
  id: shiftType.id,
  name: shiftType.name,
})))
const showShiftLink = computed(() => !plan.readOnly && plan.shiftTypes.length === 0)
const isSelectedEmpty = computed(() => selectedEntries.value.length === 0)
const showSharedSwitch = computed(() => plan.incomingShares.length > 0)
const sharedButtonLabel = computed(() => plan.activeIncoming ? `Plan von ${plan.activeIncoming.ownerEmail}` : 'Geteilter Plan')
const ownPressed = computed(() => plan.view === 'own')
const sharedPressed = computed(() => plan.view === 'shared')
const ownVariant = computed(() => ownPressed.value ? 'primary' : 'secondary')
const sharedVariant = computed(() => sharedPressed.value ? 'primary' : 'secondary')
const showIncomingPicker = computed(() => plan.view === 'shared' && plan.incomingShares.length > 1)
const selectedOwnerValue = computed(() => plan.selectedIncomingOwnerId ?? '')
const weekIso = computed(() => {
  const today = todayIso()
  return today.slice(0, 7) === anchorIso.value.slice(0, 7) ? today : anchorIso.value
})
const weekHref = computed(() => printHref('week', weekIso.value, plan.readOnly, plan.activeIncoming?.ownerId ?? null))
const monthHref = computed(() => printHref('month', anchorIso.value, plan.readOnly, plan.activeIncoming?.ownerId ?? null))
const printLinkClass = 'inline-flex items-center border border-line bg-card px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-ink hover:border-ink'

function openDay(iso: string): void {
  actionError.value = ''
  selectDay(iso)
  sheetOpen.value = true
}

function closeSheet(): void {
  sheetOpen.value = false
  clearSelection()
}

function onOwnerChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  plan.showSharedPlan(target.value)
}

function changeMonth(direction: 'previous' | 'next' | 'today'): void {
  closeSheet()
  if (direction === 'previous') previousMonth()
  else if (direction === 'next') nextMonth()
  else goToday()
}

async function onCreate(draft: PlacementDraft): Promise<void> {
  actionError.value = ''
  try {
    await plan.createPlacement(draft)
    closeSheet()
  } catch (error) {
    actionError.value = toGermanError(error)
  }
}

async function onRemove(placementId: string): Promise<void> {
  actionError.value = ''
  try {
    await plan.removePlacement(placementId)
  } catch (error) {
    actionError.value = toGermanError(error)
  }
}

async function retry(): Promise<void> {
  await plan.load()
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppButton v-if="showSharedSwitch" :variant="ownVariant" :aria-pressed="ownPressed" @click="plan.showOwnPlan()">
          Mein Plan
        </AppButton>
        <AppButton v-if="showSharedSwitch" :variant="sharedVariant" :aria-pressed="sharedPressed" @click="plan.showSharedPlan()">
          {{ sharedButtonLabel }}
        </AppButton>
        <label v-if="showIncomingPicker" class="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          <span class="sr-only">Geteilter Plan</span>
          <select
            :value="selectedOwnerValue"
            class="border border-line bg-card px-2 py-2 text-sm normal-case tracking-normal text-ink"
            @change="onOwnerChange"
          >
            <option v-for="share in plan.incomingShares" :key="share.id" :value="share.ownerId">
              {{ share.ownerEmail }}
            </option>
          </select>
        </label>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="weekHref" :class="printLinkClass">Woche drucken</NuxtLink>
        <NuxtLink :to="monthHref" :class="printLinkClass">Monat drucken</NuxtLink>
      </div>
    </div>

    <StatusNote
      v-if="showInitialLoading"
      tone="info"
      title="Plan wird geladen"
      body="Einen Moment."
    />
    <StatusNote
      v-else-if="showBlockingError"
      tone="error"
      title="Der Plan ist nicht erreichbar"
      :body="blockingBody"
    >
      <AppButton @click="retry">Erneut laden</AppButton>
    </StatusNote>
    <div v-else>
      <p v-if="inlineError" class="mb-4 text-sm text-accent" role="alert">{{ inlineError }}</p>
      <MonthCalendar
        :month-label="monthLabel"
        :cells="cells"
        @select="openDay"
        @previous="changeMonth('previous')"
        @next="changeMonth('next')"
        @today="changeMonth('today')"
      />
      <DaySheet
        v-if="sheetOpen"
        :key="selectedIso"
        :iso="selectedIso"
        :day-label="selectedLabel"
        :entries="selectedEntries"
        :shift-options="shiftOptions"
        :read-only="plan.readOnly"
        :saving="plan.isSaving"
        :action-error="actionError"
        :show-shift-link="showShiftLink"
        :is-empty="isSelectedEmpty"
        @create="onCreate"
        @remove="onRemove"
        @close="closeSheet"
      />
    </div>
  </div>
</template>
