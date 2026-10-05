<script setup lang="ts">
import type { DayEntry, PlacementDraft, ShiftOption } from '~/types/plan'
import { DAY_PANEL_TITLE_ID, NOTE_MAX_LENGTH, ROUTES, SHIFT_NAME_MAX_LENGTH } from '~/utils/constants'

const props = defineProps<{
  iso: string
  dayLabel: string
  entries: DayEntry[]
  shiftOptions: ShiftOption[]
  readOnly: boolean
  saving: boolean
  actionError: string
  showShiftLink: boolean
  isEmpty: boolean
}>()

const emit = defineEmits<{
  create: [draft: PlacementDraft]
  remove: [placementId: string]
}>()

const shiftTypeId = ref('')
const repeatsWeekly = ref(false)
const endsOn = ref('')
const note = ref('')
const localError = ref('')
const pendingDeleteId = ref<string | null>(null)

const visibleError = computed(() => localError.value || props.actionError)
const showSeriesEnd = computed(() => repeatsWeekly.value)
const pendingEntry = computed(() => props.entries.find((entry) => entry.placementId === pendingDeleteId.value) ?? null)
const confirmTitle = computed(() => pendingEntry.value ? `${pendingEntry.value.name} entfernen?` : '')
const shiftsLink = ROUTES.shifts
const nameMax = SHIFT_NAME_MAX_LENGTH
const noteMax = NOTE_MAX_LENGTH
const titleId = DAY_PANEL_TITLE_ID

function onShiftChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  shiftTypeId.value = target.value
  localError.value = ''
}

function onToggleRepeat(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  repeatsWeekly.value = target.checked
  localError.value = ''
}

function onEndsOn(value: string): void {
  endsOn.value = value
  localError.value = ''
}

function onNote(value: string): void {
  note.value = value
  localError.value = ''
}

function submit(): void {
  localError.value = ''
  emit('create', {
    shiftTypeId: shiftTypeId.value,
    startsOn: props.iso,
    repeatsWeekly: repeatsWeekly.value,
    endsOn: repeatsWeekly.value ? endsOn.value : null,
    note: note.value,
  })
}

function askRemove(placementId: string): void {
  pendingDeleteId.value = placementId
}

function cancelRemove(): void {
  pendingDeleteId.value = null
}

function confirmRemove(): void {
  if (!pendingDeleteId.value) return
  emit('remove', pendingDeleteId.value)
  pendingDeleteId.value = null
}

watch(() => props.entries.map((entry) => entry.placementId), (ids: string[], previous: string[] | undefined) => {
  if (!previous) return
  if (ids.some((id) => !previous.includes(id))) note.value = ''
})
</script>

<template>
  <div class="panel">
    <div class="flex items-start justify-between gap-3">
      <h2 :id="titleId" class="display-title text-3xl leading-tight">{{ dayLabel }}</h2>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <p v-if="readOnly" class="mt-4 rounded-sm bg-spruce-soft px-3 py-2 text-sm text-spruce">
      Nur lesen. Diesen Plan hat jemand mit dir geteilt.
    </p>

    <ul v-if="!isEmpty" class="mt-5 space-y-2">
      <li
        v-for="entry in entries"
        :key="entry.placementId"
        class="rounded-sm px-3 py-3"
        :style="{ backgroundColor: entry.background, color: entry.color }"
      >
        <p class="font-semibold">{{ entry.name }}</p>
        <p class="text-sm opacity-80">{{ entry.detail }}</p>
        <p v-if="entry.note" class="mt-1 text-sm leading-5 opacity-90">{{ entry.note }}</p>
        <button
          v-if="!readOnly"
          type="button"
          class="mt-2 text-sm font-semibold underline decoration-current/40 underline-offset-2"
          @click="askRemove(entry.placementId)"
        >
          {{ entry.removeLabel }}
        </button>
      </li>
    </ul>
    <p v-else class="mt-5 text-sm text-muted">Keine Schicht an diesem Tag.</p>

    <div v-if="pendingEntry" class="mt-4 rounded-sm bg-sand px-3 py-3">
      <p class="text-sm font-semibold">{{ confirmTitle }}</p>
      <p class="mt-1 text-sm text-muted">Der Eintrag verschwindet aus dem Plan. Eine Serie wird ganz entfernt.</p>
      <div class="mt-3 flex gap-2">
        <AppButton variant="danger" :disabled="saving" @click="confirmRemove">Entfernen</AppButton>
        <AppButton variant="ghost" @click="cancelRemove">Abbrechen</AppButton>
      </div>
    </div>

    <form v-if="!readOnly && !showShiftLink" class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block" for="shift-choice">
        <span class="label-meta mb-1.5 block">Schicht</span>
        <select
          id="shift-choice"
          :value="shiftTypeId"
          class="w-full rounded-sm border border-line bg-paper px-3.5 py-3 text-base"
          @change="onShiftChange"
        >
          <option value="">Schicht wählen</option>
          <option v-for="option in shiftOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
        </select>
      </label>
      <label class="flex items-center gap-3 text-sm font-semibold">
        <input :checked="repeatsWeekly" type="checkbox" class="h-4 w-4 accent-spruce" @change="onToggleRepeat">
        Jede Woche wiederholen
      </label>
      <TextField
        v-if="showSeriesEnd"
        id="series-end"
        label="Bis einschließlich"
        type="date"
        :model-value="endsOn"
        @update:model-value="onEndsOn"
      />
      <TextArea
        id="placement-note"
        label="Notiz (optional)"
        :model-value="note"
        :maxlength="noteMax"
        :disabled="saving"
        @update:model-value="onNote"
      />
      <p v-if="visibleError" class="text-sm text-clay" role="alert">{{ visibleError }}</p>
      <AppButton type="submit" :disabled="saving" block>
        {{ saving ? 'Eintragen…' : 'Eintragen' }}
      </AppButton>
      <p class="text-xs text-muted">Namen sind höchstens {{ nameMax }} Zeichen lang. Die Farbe kommt vom Namen.</p>
    </form>

    <div v-if="showShiftLink" class="mt-6">
      <StatusNote tone="empty" title="Noch keine Schichten" body="Lege zuerst einen Namen an. Danach kannst du ihn auf Tage setzen.">
        <NuxtLink :to="shiftsLink" class="text-sm font-semibold text-spruce underline underline-offset-2">
          Schichten anlegen
        </NuxtLink>
      </StatusNote>
    </div>
  </div>
</template>
