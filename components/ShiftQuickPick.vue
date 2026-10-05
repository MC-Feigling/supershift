<script setup lang="ts">
import type { ShiftOption } from '~/types/plan'
import { SHIFT_QUICK_PICK_TITLE_ID } from '~/utils/constants'
import { shiftColorFromIndex } from '~/utils/shift-color'

interface QuickRow {
  id: string
  name: string
  background: string
  color: string
  taken: boolean
  disabled: boolean
  ariaLabel: string
}

const props = defineProps<{
  dayLabel: string
  shiftOptions: ShiftOption[]
  takenShiftTypeIds: readonly string[]
  saving: boolean
  actionError: string
}>()

const emit = defineEmits<{
  pick: [shiftTypeId: string]
}>()

const titleId = SHIFT_QUICK_PICK_TITLE_ID

const rows = computed<QuickRow[]>(() => props.shiftOptions.map((option: ShiftOption) => {
  const color = shiftColorFromIndex(option.colorIndex)
  const taken = props.takenShiftTypeIds.includes(option.id)
  return {
    id: option.id,
    name: option.name,
    background: color.background,
    color: color.color,
    taken,
    disabled: taken || props.saving,
    ariaLabel: taken ? `${option.name}, schon eingetragen` : option.name,
  }
}))

function pick(row: QuickRow): void {
  if (row.disabled) return
  emit('pick', row.id)
}
</script>

<template>
  <div class="panel">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="label-meta">Schnellwahl</p>
        <h2 :id="titleId" class="display-title mt-1 text-3xl leading-tight">{{ dayLabel }}</h2>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <p class="mt-3 text-sm leading-6 text-muted">Schicht antippen. Ohne Notiz, ohne Serie.</p>

    <ul class="mt-5 space-y-2" :aria-busy="saving">
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-3 text-left font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100"
          :style="{ backgroundColor: row.background, color: row.color }"
          :disabled="row.disabled"
          :aria-label="row.ariaLabel"
          @click="pick(row)"
        >
          <span>{{ row.name }}</span>
          <span v-if="row.taken" class="font-mono text-[11px] uppercase tracking-stencil opacity-80">
            Schon da
          </span>
        </button>
      </li>
    </ul>

    <p v-if="actionError" class="mt-4 text-sm text-clay" role="alert">{{ actionError }}</p>
  </div>
</template>
