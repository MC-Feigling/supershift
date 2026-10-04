<script setup lang="ts">
import type { DayEntry, PlacementDraft, ShiftOption } from '~/types/plan'
import { NOTE_MAX_LENGTH, ROUTES, SHIFT_NAME_MAX_LENGTH } from '~/utils/constants'

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
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)
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
const showForm = computed(() => !props.readOnly && !props.showShiftLink)
const shiftsLink = ROUTES.shifts
const nameMax = SHIFT_NAME_MAX_LENGTH
const noteMax = NOTE_MAX_LENGTH
const fieldClass = 'w-full border border-line bg-paper px-3 py-2.5 text-base text-ink outline-none focus:border-ink'

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

function requestClose(): void {
  dialog.value?.close()
  emit('close')
}

function onCancel(event: Event): void {
  event.preventDefault()
  requestClose()
}

function onBackdrop(event: MouseEvent): void {
  if (event.target === dialog.value) requestClose()
}

onMounted(() => {
  dialog.value?.showModal()
})
</script>

<template>
  <dialog
    ref="dialog"
    class="w-[min(32rem,calc(100%-2rem))] border border-ink bg-card p-0 text-ink backdrop:bg-ink/50"
    aria-labelledby="day-sheet-title"
    @cancel="onCancel"
    @click="onBackdrop"
  >
    <div class="border-b border-line px-4 py-3">
      <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Eintrag</p>
      <div class="mt-1 flex items-start justify-between gap-3">
        <h2 id="day-sheet-title" class="text-xl font-medium leading-tight tracking-tight">{{ dayLabel }}</h2>
        <button type="button" class="border border-line px-2 py-1 text-xs uppercase tracking-[0.14em]" @click="requestClose">
          Schließen
        </button>
      </div>
    </div>

    <div class="px-4 py-4">
      <p v-if="readOnly" class="border-l-2 border-accent px-3 py-2 text-sm">
        Nur lesen. Diesen Plan hat jemand mit dir geteilt.
      </p>

      <ul v-if="!isEmpty" class="mt-4 space-y-2">
        <li
          v-for="entry in entries"
          :key="entry.placementId"
          class="px-3 py-2"
          :style="{ backgroundColor: entry.background, color: entry.color }"
        >
          <p class="font-medium">{{ entry.name }}</p>
          <p v-if="entry.note" class="mt-1 text-sm">Notiz {{ entry.note }}</p>
          <p class="text-xs opacity-80">{{ entry.detail }}</p>
          <button
            v-if="!readOnly"
            type="button"
            class="mt-2 text-sm font-medium underline decoration-current/40 underline-offset-2"
            @click="askRemove(entry.placementId)"
          >
            {{ entry.removeLabel }}
          </button>
        </li>
      </ul>
      <p v-else class="mt-4 text-sm text-muted">Keine Schicht an diesem Tag.</p>

      <div v-if="pendingEntry" class="mt-4 border border-line px-3 py-3">
        <p class="text-sm font-medium">{{ confirmTitle }}</p>
        <p class="mt-1 text-sm text-muted">Der Eintrag verschwindet aus dem Plan. Eine Serie wird ganz entfernt.</p>
        <div class="mt-3 flex gap-2">
          <AppButton variant="danger" :disabled="saving" @click="confirmRemove">Entfernen</AppButton>
          <AppButton variant="ghost" @click="cancelRemove">Abbrechen</AppButton>
        </div>
      </div>

      <form v-if="showForm" class="mt-5 space-y-4" @submit.prevent="submit">
        <label class="block" for="shift-choice">
          <span class="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em]">Schicht</span>
          <select id="shift-choice" :value="shiftTypeId" :class="fieldClass" @change="onShiftChange">
            <option value="">Schicht wählen</option>
            <option v-for="option in shiftOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
          </select>
        </label>
        <TextField
          id="placement-note"
          label="Notiz"
          :model-value="note"
          :maxlength="noteMax"
          @update:model-value="onNote"
        />
        <label class="flex items-center gap-3 text-sm font-medium">
          <input :checked="repeatsWeekly" type="checkbox" class="h-4 w-4 accent-ink" @change="onToggleRepeat">
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
        <p v-if="visibleError" class="text-sm text-accent" role="alert">{{ visibleError }}</p>
        <AppButton type="submit" :disabled="saving" block>
          {{ saving ? 'Eintragen…' : 'Eintragen' }}
        </AppButton>
        <p class="text-xs text-muted">Namen sind höchstens {{ nameMax }} Zeichen lang. Notiz ist optional.</p>
      </form>

      <div v-if="showShiftLink" class="mt-5">
        <StatusNote tone="empty" title="Noch keine Schichten" body="Lege zuerst einen Namen an. Danach kannst du ihn auf Tage setzen.">
          <NuxtLink :to="shiftsLink" class="text-sm font-medium text-ink underline underline-offset-2">
            Schichten anlegen
          </NuxtLink>
        </StatusNote>
      </div>
    </div>
  </dialog>
</template>
