<script setup lang="ts">
import type { ShiftType } from '~/types/plan'
import { SHIFT_NAME_MAX_LENGTH } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'
import { nextUnusedColorIndex, shiftColorFromIndex } from '~/utils/shift-color'

definePageMeta({ layout: 'default' })
useHead({ title: 'Schichten' })

const plan = await useLoadedPlan()
const name = ref('')
const colorIndex = ref(0)
const formError = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')
const editingColorIndex = ref(0)
const pendingDeleteId = ref<string | null>(null)

const showInitialLoading = computed(() => plan.status === 'loading' && !plan.hasLoaded)
const showBlockingError = computed(() => plan.status === 'error' && !plan.hasLoaded)
const blockingBody = computed(() => plan.errorMessage ?? '')
const isEmpty = computed(() => plan.hasLoaded && plan.shiftTypes.length === 0)
const rows = computed(() => plan.shiftTypes.map((shiftType: ShiftType) => {
  const color = shiftColorFromIndex(shiftType.colorIndex)
  return {
    id: shiftType.id,
    name: shiftType.name,
    colorIndex: shiftType.colorIndex,
    color: color.color,
    isEditing: shiftType.id === editingId.value,
    isConfirming: shiftType.id === pendingDeleteId.value,
  }
}))
const submitLabel = computed(() => plan.isSaving ? 'Speichern…' : 'Anlegen')

function unusedColor(): number {
  return nextUnusedColorIndex(plan.shiftTypes.map((shiftType: ShiftType) => shiftType.colorIndex))
}

function onName(value: string): void {
  name.value = value
}

function onColor(value: number): void {
  colorIndex.value = value
}

function startEdit(id: string, currentName: string, currentColor: number): void {
  editingId.value = id
  editingName.value = currentName
  editingColorIndex.value = currentColor
  formError.value = ''
}

function cancelEdit(): void {
  editingId.value = null
  editingName.value = ''
}

function onEditName(value: string): void {
  editingName.value = value
}

function onEditColor(value: number): void {
  editingColorIndex.value = value
}

async function createShift(): Promise<void> {
  formError.value = ''
  try {
    await plan.createShift(name.value, colorIndex.value)
    name.value = ''
    colorIndex.value = unusedColor()
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

async function saveEdit(): Promise<void> {
  if (!editingId.value) return
  formError.value = ''
  try {
    await plan.saveShift(editingId.value, editingName.value, editingColorIndex.value)
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
    if (!editingId.value) colorIndex.value = unusedColor()
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

async function retry(): Promise<void> {
  await plan.load()
}

watch(
  () => plan.shiftTypes.map((shiftType: ShiftType) => shiftType.colorIndex).join(','),
  () => {
    if (editingId.value) return
    colorIndex.value = unusedColor()
  },
  { immediate: true },
)
</script>

<template>
  <section class="mx-auto max-w-xl">
    <h1 class="display-title text-4xl">Schichten</h1>
    <p class="mt-2 text-base leading-7 text-muted">
      Name und Farbe. Die Farbe bleibt an der Schicht, damit Tage im Kalender unterscheidbar sind.
    </p>

    <StatusNote v-if="showInitialLoading" class="mt-6" tone="info" title="Schichten werden geladen" body="Einen Moment." />
    <StatusNote v-else-if="showBlockingError" class="mt-6" tone="error" title="Die Schichten sind nicht erreichbar" :body="blockingBody">
      <AppButton @click="retry">Erneut laden</AppButton>
    </StatusNote>

    <div v-else class="mt-6 space-y-4">
      <form class="panel space-y-4" @submit.prevent="createShift">
        <TextField
          id="new-shift"
          label="Neue Schicht"
          :model-value="name"
          :maxlength="SHIFT_NAME_MAX_LENGTH"
          :disabled="plan.isSaving"
          @update:model-value="onName"
        />
        <ShiftColorPicker id="new-shift-color" :model-value="colorIndex" :disabled="plan.isSaving" @update:model-value="onColor" />
        <p v-if="formError" class="text-sm text-clay" role="alert">{{ formError }}</p>
        <div>
          <AppButton type="submit" :disabled="plan.isSaving">{{ submitLabel }}</AppButton>
        </div>
      </form>

      <StatusNote v-if="isEmpty" tone="empty" title="Noch keine Schichten" body="Zum Beispiel Früh, Spät oder Frei." />

      <ul v-else class="space-y-3">
        <li v-for="row in rows" :key="row.id" class="rounded-sm border border-line bg-card p-4">
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-sm" :style="{ backgroundColor: row.color }" />
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
            <ShiftColorPicker
              :id="`edit-color-${row.id}`"
              :model-value="editingColorIndex"
              :disabled="plan.isSaving"
              @update:model-value="onEditColor"
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
            <AppButton variant="secondary" @click="startEdit(row.id, row.name, row.colorIndex)">Bearbeiten</AppButton>
            <AppButton variant="danger" @click="askDelete(row.id)">Löschen</AppButton>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
