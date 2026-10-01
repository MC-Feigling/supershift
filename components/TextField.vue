<script setup lang="ts">
const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string
  type?: 'text' | 'email' | 'password' | 'date'
  error?: string
  autocomplete?: string
  maxlength?: number
  disabled?: boolean
}>(), {
  type: 'text',
  error: '',
  autocomplete: undefined,
  maxlength: undefined,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const errorId = computed(() => props.error ? `${props.id}-error` : undefined)
const invalid = computed(() => props.error.length > 0)

function onInput(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  emit('update:modelValue', target.value)
}
</script>

<template>
  <label class="block" :for="id">
    <span class="mb-1.5 block text-sm font-semibold text-ink">{{ label }}</span>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
      :disabled="disabled"
      :aria-invalid="invalid"
      :aria-describedby="errorId"
      class="w-full rounded-2xl border border-line bg-card px-3.5 py-3 text-base text-ink outline-none ring-spruce placeholder:text-muted focus:border-spruce focus:ring-2 disabled:opacity-60"
      @input="onInput"
    >
    <span v-if="error" :id="errorId" class="mt-1.5 block text-sm text-clay">{{ error }}</span>
  </label>
</template>
