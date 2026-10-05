<script setup lang="ts">
import type { PlacementDraft, ShiftOption, ShiftType } from '~/types/plan'
import { toGermanError } from '~/utils/errors'

definePageMeta({ layout: 'default' })
useHead({ title: 'Kalender' })

const plan = await useLoadedPlan()
const { status: pushStatus, enable: enablePush } = usePush()
const {
  selectedIso,
  monthLabel,
  selectedLabel,
  cells,
  selectedEntries,
  selectDay: setSelectedDay,
  nextMonth,
  previousMonth,
  goToday,
} = useCalendar()
const actionError = ref('')

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
const showPushHint = computed(() => plan.incomingShares.length > 0 && pushStatus.value === 'off')

function selectDay(iso: string): void {
  actionError.value = ''
  setSelectedDay(iso)
}

function onOwnerChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  plan.showSharedPlan(target.value)
}

async function onCreate(draft: PlacementDraft): Promise<void> {
  actionError.value = ''
  try {
    await plan.createPlacement(draft)
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
    <div v-if="showSharedSwitch" class="mb-5 flex flex-wrap items-center gap-2">
      <AppButton :variant="ownVariant" :aria-pressed="ownPressed" @click="plan.showOwnPlan()">
        Mein Plan
      </AppButton>
      <AppButton :variant="sharedVariant" :aria-pressed="sharedPressed" @click="plan.showSharedPlan()">
        {{ sharedButtonLabel }}
      </AppButton>
      <label v-if="showIncomingPicker" class="text-sm font-semibold text-muted">
        <span class="sr-only">Geteilter Plan</span>
        <select
          :value="selectedOwnerValue"
          class="rounded-sm border border-line bg-card px-3 py-2"
          @change="onOwnerChange"
        >
          <option v-for="share in plan.incomingShares" :key="share.id" :value="share.ownerId">
            {{ share.ownerEmail }}
          </option>
        </select>
      </label>
    </div>

    <StatusNote
      v-if="showPushHint"
      class="mb-5"
      tone="info"
      title="Meldungen für den geteilten Plan"
      body="Wenn jemand etwas einträgt oder entfernt, kann dieses Gerät Bescheid sagen."
    >
      <AppButton @click="enablePush">Einschalten</AppButton>
    </StatusNote>

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
    <div v-else class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <p v-if="inlineError" class="mb-4 text-sm text-clay" role="alert">{{ inlineError }}</p>
        <MonthCalendar
          :month-label="monthLabel"
          :cells="cells"
          @select="selectDay"
          @previous="previousMonth"
          @next="nextMonth"
          @today="goToday"
        />
      </div>
      <DayPanel
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
      />
    </div>
  </div>
</template>
