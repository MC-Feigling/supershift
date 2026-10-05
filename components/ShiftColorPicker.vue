<script setup lang="ts">
import { SHIFT_COLOR_SWATCHES } from '~/utils/shift-color'

const props = withDefaults(defineProps<{
  id: string
  modelValue: number
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const swatches = computed(() => SHIFT_COLOR_SWATCHES.map((swatch, index) => ({
  index,
  label: swatch.label,
  background: swatch.background,
  selected: index === props.modelValue,
  buttonId: `${props.id}-${index}`,
})))

function pick(index: number): void {
  if (props.disabled) return
  emit('update:modelValue', index)
}
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="label-meta mb-1.5">Farbe</legend>
    <div class="flex flex-wrap gap-2" role="list">
      <button
        v-for="swatch in swatches"
        :id="swatch.buttonId"
        :key="swatch.index"
        type="button"
        class="h-8 w-8 rounded-sm ring-offset-2 ring-offset-card transition focus-visible:outline-none disabled:opacity-50"
        :class="swatch.selected ? 'ring-2 ring-spruce' : 'ring-1 ring-ink/25 hover:ring-ink/50'"
        :style="{ backgroundColor: swatch.background }"
        :aria-pressed="swatch.selected"
        :aria-label="swatch.label"
        :disabled="disabled"
        @click="pick(swatch.index)"
      />
    </div>
  </fieldset>
</template>
