<script setup lang="ts">
import type { CalendarCell } from '~/types/plan'
import { WEEKDAY_LABELS } from '~/utils/constants'

defineProps<{
  monthLabel: string
  cells: CalendarCell[]
}>()

const emit = defineEmits<{
  select: [iso: string]
  previous: []
  next: []
  today: []
}>()

const weekdayLabels = WEEKDAY_LABELS

function cellClass(cell: CalendarCell): string {
  const tone = cell.inMonth ? 'bg-card text-ink' : 'bg-paper text-muted'
  const weekend = cell.isWeekend && cell.inMonth ? 'bg-concrete' : ''
  const selected = cell.isSelected ? 'outline outline-1 outline-accent' : ''
  return [tone, weekend, selected].filter(Boolean).join(' ')
}
</script>

<template>
  <section class="border border-line bg-card">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-3 sm:px-4">
      <h1 class="text-2xl font-medium capitalize tracking-tight sm:text-3xl">{{ monthLabel }}</h1>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" @click="emit('previous')">Zurück</AppButton>
        <AppButton variant="secondary" @click="emit('today')">Heute</AppButton>
        <AppButton variant="secondary" @click="emit('next')">Weiter</AppButton>
      </div>
    </div>
    <div class="grid grid-cols-7 border-b border-line text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      <span v-for="label in weekdayLabels" :key="label" class="border-r border-line py-2 last:border-r-0">{{ label }}</span>
    </div>
    <div class="grid grid-cols-7">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        :aria-label="cell.label"
        :aria-pressed="cell.isSelected"
        class="flex min-h-24 flex-col border-b border-r border-line px-1.5 py-1.5 text-left sm:min-h-32"
        :class="cellClass(cell)"
        @click="emit('select', cell.iso)"
      >
        <span
          class="mb-1 text-xs font-medium tabular-nums"
          :class="cell.isToday ? 'text-accent' : ''"
        >
          {{ cell.dayNumber }}
        </span>
        <span
          v-for="chip in cell.chips"
          :key="chip.placementId"
          class="mb-1 block px-1 py-0.5 text-[11px] font-medium leading-4"
          :style="{ backgroundColor: chip.background, color: chip.color }"
        >
          <span class="block truncate">{{ chip.name }}</span>
          <span v-if="chip.note" class="block truncate font-normal">Notiz {{ chip.note }}</span>
        </span>
        <span v-if="cell.hiddenChipLabel" class="text-[11px] font-medium text-muted">{{ cell.hiddenChipLabel }}</span>
      </button>
    </div>
  </section>
</template>
