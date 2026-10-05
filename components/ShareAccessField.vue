<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const options = computed(() => [
  {
    canWrite: false,
    title: 'Nur lesen',
    body: 'Sie sieht den Plan, ändert nichts.',
    pressed: !props.modelValue,
  },
  {
    canWrite: true,
    title: 'Lesen und schreiben',
    body: 'Sie trägt ein und entfernt.',
    pressed: props.modelValue,
  },
])

function choose(canWrite: boolean): void {
  if (props.disabled) return
  emit('update:modelValue', canWrite)
}
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="label-meta mb-2">Zugriff</legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <button
        v-for="option in options"
        :key="option.title"
        type="button"
        class="rounded-sm px-3 py-3 text-left ring-1 transition disabled:opacity-50"
        :class="option.pressed ? 'bg-spruce text-paper ring-spruce' : 'bg-paper text-ink ring-line hover:bg-sand'"
        :aria-pressed="option.pressed"
        :disabled="disabled"
        @click="choose(option.canWrite)"
      >
        <span class="block font-mono text-[11px] font-medium uppercase tracking-stencil">{{ option.title }}</span>
        <span class="mt-1 block text-sm leading-5" :class="option.pressed ? 'text-paper/80' : 'text-muted'">
          {{ option.body }}
        </span>
      </button>
    </div>
  </fieldset>
</template>
