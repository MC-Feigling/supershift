<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
  block?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  disabled: false,
  block: false,
})

const variantClass = computed(() => {
  if (props.variant === 'secondary') return 'border-line bg-card text-ink hover:border-ink'
  if (props.variant === 'danger') return 'border-accent bg-card text-accent hover:bg-accent hover:text-paper'
  if (props.variant === 'ghost') return 'border-transparent bg-transparent text-ink hover:border-line'
  return 'border-ink bg-ink text-paper hover:bg-steel'
})

const buttonClass = computed(() => [
  'inline-flex items-center justify-center border px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-40',
  variantClass.value,
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button :type="type" :class="buttonClass" :disabled="disabled">
    <slot />
  </button>
</template>
