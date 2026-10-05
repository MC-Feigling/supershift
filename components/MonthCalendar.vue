<script setup lang="ts">
import type { CalendarCell } from '~/types/plan'
import { WEEKDAY_LABELS } from '~/utils/constants'

defineProps<{
  monthLabel: string
  cells: CalendarCell[]
  canQuickPick: boolean
}>()

const emit = defineEmits<{
  select: [iso: string]
  quick: [iso: string]
  previous: []
  next: []
  today: []
}>()

const weekdayLabels = WEEKDAY_LABELS
const gridRef = ref<HTMLElement | null>(null)

const press = usePressHold<string>({
  onTap: (iso: string) => emit('select', iso),
  onHold: (iso: string) => emit('quick', iso),
})

function isoFromEvent(event: Event): string | null {
  const target = event.target
  const origin = target instanceof Element
    ? target
    : target instanceof Node
      ? target.parentElement
      : null
  if (!origin) return null
  const cell = origin.closest('[data-iso]')
  if (!(cell instanceof HTMLElement)) return null
  return cell.dataset.iso ?? null
}

watch(gridRef, (el: HTMLElement | null) => {
  press.detach()
  if (el) press.attach(el, isoFromEvent)
}, { flush: 'post' })
</script>

<template>
  <section class="panel p-3 sm:p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
      <h1 class="display-title text-3xl capitalize sm:text-4xl">{{ monthLabel }}</h1>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" @click="emit('previous')">Zurück</AppButton>
        <AppButton variant="secondary" @click="emit('today')">Heute</AppButton>
        <AppButton variant="secondary" @click="emit('next')">Weiter</AppButton>
      </div>
    </div>
    <p v-if="canQuickPick" class="label-meta mb-3 px-1">Gedrückt halten setzt eine Schicht direkt.</p>
    <div class="overflow-hidden rounded-sm border border-ink/20">
    <div class="grid grid-cols-7 border-b border-ink/20 text-center">
      <span v-for="label in weekdayLabels" :key="label" class="label-meta border-r border-ink/20 py-2 last:border-r-0">{{ label }}</span>
    </div>
    <div ref="gridRef" class="grid grid-cols-7">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        draggable="false"
        :data-iso="cell.iso"
        :aria-label="cell.label"
        :aria-pressed="cell.isSelected"
        :aria-haspopup="canQuickPick ? 'dialog' : undefined"
        class="calendar-day flex min-h-24 flex-col border-b border-r border-ink/20 px-1.5 py-1.5 text-left transition sm:min-h-32 sm:px-2 [&:nth-child(7n)]:border-r-0"
        :class="[
          cell.isWeekend ? 'bg-sand' : 'bg-card',
          cell.inMonth ? '' : 'opacity-40',
          cell.isSelected ? 'ring-2 ring-inset ring-spruce' : 'hover:bg-sand',
        ]"
        @pointerdown="press.onPointerDown(cell.iso, $event)"
        @pointermove="press.onPointerMove($event)"
        @pointerup="press.onPointerUp($event)"
        @pointercancel="press.onPointerCancel($event)"
        @click="press.onClick(cell.iso, $event)"
        @contextmenu="press.onContextMenu(cell.iso, $event)"
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
