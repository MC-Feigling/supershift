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
  <section class="panel p-3 sm:p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
      <h1 class="font-display text-3xl font-medium uppercase tracking-wide sm:text-4xl">{{ monthLabel }}</h1>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" @click="emit('previous')">Zurück</AppButton>
        <AppButton variant="secondary" @click="emit('today')">Heute</AppButton>
        <AppButton variant="secondary" @click="emit('next')">Weiter</AppButton>
      </div>
    </div>
    <div class="overflow-hidden rounded-sm border border-line">
    <div class="grid grid-cols-7 gap-px bg-line text-center">
      <span v-for="label in weekdayLabels" :key="label" class="label-meta bg-sand py-2">{{ label }}</span>
    </div>
    <div class="grid grid-cols-7 gap-px bg-line">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        :aria-label="cell.label"
        :aria-pressed="cell.isSelected"
        class="flex min-h-24 flex-col bg-card px-1.5 py-1.5 text-left transition sm:min-h-32 sm:px-2"
        :class="[
          cell.isWeekend ? 'bg-sand' : 'bg-card',
          cell.inMonth ? '' : 'opacity-40',
          cell.isSelected ? 'ring-2 ring-inset ring-spruce' : 'hover:bg-sand',
        ]"
        @click="emit('select', cell.iso)"
      >
        <span
          class="mb-1 inline-flex h-6 w-6 items-center justify-center font-mono text-xs font-medium"
          :class="cell.isToday ? 'bg-spruce text-paper' : 'text-ink'"
        >
          {{ cell.dayNumber }}
        </span>
        <span
          v-for="chip in cell.chips"
          :key="chip.placementId"
          class="mb-1 truncate rounded-sm px-1.5 py-0.5 text-[11px] font-semibold leading-4"
          :style="{ backgroundColor: chip.background, color: chip.color }"
        >
          {{ chip.name }}
        </span>
        <span v-if="cell.hiddenChipLabel" class="font-mono text-[11px] text-muted">{{ cell.hiddenChipLabel }}</span>
      </button>
    </div>
    </div>
  </section>
</template>
