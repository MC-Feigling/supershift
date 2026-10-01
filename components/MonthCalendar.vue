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
</script>

<template>
  <section class="rounded-[2rem] border border-line bg-card p-3 shadow-card sm:p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
      <h1 class="font-display text-3xl font-medium capitalize tracking-tight sm:text-4xl">{{ monthLabel }}</h1>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" @click="emit('previous')">Zurück</AppButton>
        <AppButton variant="secondary" @click="emit('today')">Heute</AppButton>
        <AppButton variant="secondary" @click="emit('next')">Weiter</AppButton>
      </div>
    </div>
    <div class="grid grid-cols-7 gap-1 px-1 text-center text-xs font-semibold uppercase tracking-wide text-muted">
      <span v-for="label in weekdayLabels" :key="label" class="py-2">{{ label }}</span>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        :aria-label="cell.label"
        :aria-pressed="cell.isSelected"
        class="flex min-h-24 flex-col rounded-2xl border px-1.5 py-1.5 text-left transition sm:min-h-32 sm:px-2"
        :class="[
          cell.isWeekend ? 'bg-sand/80' : 'bg-paper/40',
          cell.inMonth ? '' : 'opacity-45',
          cell.isSelected ? 'border-spruce ring-2 ring-spruce' : 'border-transparent hover:border-line',
        ]"
        @click="emit('select', cell.iso)"
      >
        <span
          class="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
          :class="cell.isToday ? 'bg-spruce text-white' : 'text-ink'"
        >
          {{ cell.dayNumber }}
        </span>
        <span
          v-for="chip in cell.chips"
          :key="chip.placementId"
          class="mb-1 truncate rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-4"
          :style="{ backgroundColor: chip.background, color: chip.color }"
        >
          {{ chip.name }}
        </span>
        <span v-if="cell.hiddenChipLabel" class="text-[11px] font-semibold text-muted">{{ cell.hiddenChipLabel }}</span>
      </button>
    </div>
  </section>
</template>
