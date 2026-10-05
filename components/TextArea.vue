<script setup lang="ts">
const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string
  error?: string
  maxlength?: number
  disabled?: boolean
  rows?: number
}>(), {
  error: '',
  maxlength: undefined,
  disabled: false,
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const errorId = computed(() => props.error ? `${props.id}-error` : undefined)
const invalid = computed(() => props.error.length > 0)

function onInput(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLTextAreaElement)) return
  emit('update:modelValue', target.value)
}
</script>

<template>
  <label class="block" :for="id">
    <span class="label-meta mb-1.5 block">{{ label }}</span>
    <textarea
      :id="id"
      :value="modelValue"
      :maxlength="maxlength"
      :disabled="disabled"
      :rows="rows"
      :aria-invalid="invalid"
      :aria-describedby="errorId"
      class="w-full resize-y rounded-sm border border-line bg-paper px-3.5 py-3 text-base text-ink outline-none ring-spruce placeholder:text-muted focus:border-spruce focus:ring-2 disabled:opacity-60"
      @input="onInput"
    />
    <span v-if="error" :id="errorId" class="mt-1.5 block text-sm text-clay">{{ error }}</span>
  </label>
</template>
