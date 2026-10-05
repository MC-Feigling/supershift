<script setup lang="ts">
import type { DayEntry, PlacementDraft, ShiftOption, ShiftType } from '~/types/plan'
import { DAY_PANEL_TITLE_ID, SHIFT_QUICK_PICK_TITLE_ID } from '~/utils/constants'
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
const editorOpen = ref(false)
const editorRef = ref<HTMLDialogElement | null>(null)
const quickOpen = ref(false)
const quickRef = ref<HTMLDialogElement | null>(null)
const dayPanelTitleId = DAY_PANEL_TITLE_ID
const quickPickTitleId = SHIFT_QUICK_PICK_TITLE_ID

const showInitialLoading = computed(() => plan.status === 'loading' && !plan.hasLoaded)
const showBlockingError = computed(() => plan.status === 'error' && !plan.hasLoaded)
const blockingBody = computed(() => plan.errorMessage ?? '')
const inlineError = computed(() => plan.hasLoaded ? plan.errorMessage ?? '' : '')
const shiftOptions = computed<ShiftOption[]>(() => plan.visibleShiftTypes.map((shiftType: ShiftType) => ({
  id: shiftType.id,
  name: shiftType.name,
  colorIndex: shiftType.colorIndex,
})))
const catalogEmpty = computed(() => !plan.readOnly && plan.visibleShiftTypes.length === 0)
const showShiftLink = computed(() => catalogEmpty.value && plan.view === 'own')
const canQuickPick = computed(() => !plan.readOnly && plan.visibleShiftTypes.length > 0)
const isSelectedEmpty = computed(() => selectedEntries.value.length === 0)
const takenShiftTypeIds = computed(() => selectedEntries.value.map((entry: DayEntry) => entry.shiftTypeId))
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
  quickOpen.value = false
  editorOpen.value = true
}

function openQuickPick(iso: string): void {
  actionError.value = ''
  setSelectedDay(iso)
  editorOpen.value = false
  if (!canQuickPick.value) {
    editorOpen.value = true
    return
  }
  quickOpen.value = true
}

function closeEditor(): void {
  editorRef.value?.close()
}

function closeQuickPick(): void {
  quickRef.value?.close()
}

function onDialogClose(): void {
  editorOpen.value = false
}

function onQuickDialogClose(): void {
  quickOpen.value = false
}

function onDialogClick(event: MouseEvent): void {
  if (event.target === editorRef.value) closeEditor()
}

function onQuickDialogClick(event: MouseEvent): void {
  if (event.target === quickRef.value) closeQuickPick()
}

watch(editorOpen, async (open: boolean) => {
  const dialog = editorRef.value
  if (!open) {
    if (dialog?.open) dialog.close()
    return
  }
  await nextTick()
  if (dialog && !dialog.open) dialog.showModal()
})

watch(quickOpen, async (open: boolean) => {
  const dialog = quickRef.value
  if (!open) {
    if (dialog?.open) dialog.close()
    return
  }
  await nextTick()
  if (dialog && !dialog.open) dialog.showModal()
})

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

async function onQuickPick(shiftTypeId: string): Promise<void> {
  actionError.value = ''
  try {
    await plan.createPlacement({
      shiftTypeId,
      startsOn: selectedIso.value,
      repeatsWeekly: false,
      endsOn: null,
      note: '',
    })
    closeQuickPick()
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
    <div v-else>
      <p v-if="inlineError" class="mb-4 text-sm text-clay" role="alert">{{ inlineError }}</p>
      <MonthCalendar
        :month-label="monthLabel"
        :cells="cells"
        :can-quick-pick="canQuickPick"
        @select="selectDay"
        @quick="openQuickPick"
        @previous="previousMonth"
        @next="nextMonth"
        @today="goToday"
      />
      <dialog
        ref="quickRef"
        class="day-dialog"
        :aria-labelledby="quickPickTitleId"
        @close="onQuickDialogClose"
        @click="onQuickDialogClick"
      >
        <ShiftQuickPick
          :key="selectedIso"
          :day-label="selectedLabel"
          :shift-options="shiftOptions"
          :taken-shift-type-ids="takenShiftTypeIds"
          :saving="plan.isSaving"
          :action-error="actionError"
          @pick="onQuickPick"
        >
          <template #actions>
            <AppButton variant="ghost" @click="closeQuickPick">Schließen</AppButton>
          </template>
        </ShiftQuickPick>
      </dialog>
      <dialog
        ref="editorRef"
        class="day-dialog"
        :aria-labelledby="dayPanelTitleId"
        @close="onDialogClose"
        @click="onDialogClick"
      >
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
          :catalog-empty="catalogEmpty"
          :is-empty="isSelectedEmpty"
          @create="onCreate"
          @remove="onRemove"
        >
          <template #actions>
            <AppButton variant="ghost" @click="closeEditor">Schließen</AppButton>
          </template>
        </DayPanel>
      </dialog>
    </div>
  </div>
</template>
