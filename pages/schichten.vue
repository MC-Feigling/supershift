<script setup lang="ts">
import type { ShiftType } from '~/types/plan'
import { SHIFT_NAME_MAX_LENGTH } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'
import { shiftColor } from '~/utils/shift-color'

definePageMeta({ layout: 'default' })
useHead({ title: 'Schichten' })

const plan = await useLoadedPlan()
const name = ref('')
const formError = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')
const pendingDeleteId = ref<string | null>(null)

const showInitialLoading = computed(() => plan.status === 'loading' && !plan.hasLoaded)
const showBlockingError = computed(() => plan.status === 'error' && !plan.hasLoaded)
const blockingBody = computed(() => plan.errorMessage ?? '')
const isEmpty = computed(() => plan.hasLoaded && plan.shiftTypes.length === 0)
const rows = computed(() => plan.shiftTypes.map((shiftType: ShiftType) => {
  const color = shiftColor(shiftType.name)
  return {
    id: shiftType.id,
    name: shiftType.name,
    color: color.color,
    isEditing: shiftType.id === editingId.value,
    isConfirming: shiftType.id === pendingDeleteId.value,
  }
}))
const submitLabel = computed(() => plan.isSaving ? 'Speichern…' : 'Anlegen')

function onName(value: string): void {
  name.value = value
}

function startEdit(id: string, currentName: string): void {
  editingId.value = id
  editingName.value = currentName
  formError.value = ''
}

function cancelEdit(): void {
  editingId.value = null
  editingName.value = ''
}

function onEditName(value: string): void {
  editingName.value = value
}

async function createShift(): Promise<void> {
  formError.value = ''
  try {
    await plan.createShift(name.value)
    name.value = ''
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

async function saveEdit(): Promise<void> {
  if (!editingId.value) return
  formError.value = ''
  try {
    await plan.renameShift(editingId.value, editingName.value)
    cancelEdit()
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

function askDelete(id: string): void {
  pendingDeleteId.value = id
}

function cancelDelete(): void {
  pendingDeleteId.value = null
}

async function confirmDelete(): Promise<void> {
  if (!pendingDeleteId.value) return
  formError.value = ''
  try {
    await plan.removeShift(pendingDeleteId.value)
    pendingDeleteId.value = null
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

async function retry(): Promise<void> {
  await plan.load()
}
</script>

<template>
  <section class="mx-auto max-w-xl">
    <h1 class="font-display text-4xl font-medium tracking-tight">Schichten</h1>
    <p class="mt-2 text-base leading-7 text-muted">
      Nur der Name zählt. Die Farbe bleibt am Namen, damit Tage im Kalender unterscheidbar sind.
    </p>

    <StatusNote v-if="showInitialLoading" class="mt-6" tone="info" title="Schichten werden geladen" body="Einen Moment." />
    <StatusNote v-else-if="showBlockingError" class="mt-6" tone="error" title="Die Schichten sind nicht erreichbar" :body="blockingBody">
      <AppButton @click="retry">Erneut laden</AppButton>
    </StatusNote>

    <div v-else class="mt-6 space-y-4">
      <form class="rounded-[2rem] border border-line bg-card p-5 shadow-card" @submit.prevent="createShift">
        <TextField
          id="new-shift"
          label="Neue Schicht"
          :model-value="name"
          :maxlength="SHIFT_NAME_MAX_LENGTH"
          :disabled="plan.isSaving"
          @update:model-value="onName"
        />
        <p v-if="formError" class="mt-3 text-sm text-clay" role="alert">{{ formError }}</p>
        <div class="mt-4">
          <AppButton type="submit" :disabled="plan.isSaving">{{ submitLabel }}</AppButton>
        </div>
      </form>

      <StatusNote v-if="isEmpty" tone="empty" title="Noch keine Schichten" body="Zum Beispiel Früh, Spät oder Frei." />

      <ul v-else class="space-y-3">
        <li v-for="row in rows" :key="row.id" class="rounded-[1.5rem] border border-line bg-card p-4">
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: row.color }" />
            <p v-if="!row.isEditing" class="font-semibold">{{ row.name }}</p>
          </div>
          <div v-if="row.isEditing" class="mt-3 space-y-3">
            <TextField
              :id="`edit-${row.id}`"
              label="Name"
              :model-value="editingName"
              :maxlength="SHIFT_NAME_MAX_LENGTH"
              @update:model-value="onEditName"
            />
            <div class="flex gap-2">
              <AppButton :disabled="plan.isSaving" @click="saveEdit">Speichern</AppButton>
              <AppButton variant="ghost" @click="cancelEdit">Abbrechen</AppButton>
            </div>
          </div>
          <div v-else-if="row.isConfirming" class="mt-3">
            <p class="text-sm text-muted">Die Schicht und alle Einträge im Kalender werden gelöscht.</p>
            <div class="mt-3 flex gap-2">
              <AppButton variant="danger" :disabled="plan.isSaving" @click="confirmDelete">Löschen</AppButton>
              <AppButton variant="ghost" @click="cancelDelete">Abbrechen</AppButton>
            </div>
          </div>
          <div v-else class="mt-3 flex gap-2">
            <AppButton variant="secondary" @click="startEdit(row.id, row.name)">Umbenennen</AppButton>
            <AppButton variant="danger" @click="askDelete(row.id)">Löschen</AppButton>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
