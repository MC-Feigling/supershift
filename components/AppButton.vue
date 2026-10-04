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
  if (props.variant === 'secondary') return 'bg-card text-ink ring-1 ring-line hover:bg-sand hover:ring-ink/20'
  if (props.variant === 'danger') return 'bg-card text-clay ring-1 ring-clay/50 hover:bg-clay/10'
  if (props.variant === 'ghost') return 'bg-transparent text-ink hover:bg-sand'
  return 'bg-spruce text-paper hover:bg-spruce-deep'
})

const buttonClass = computed(() => [
  'inline-flex items-center justify-center rounded-sm px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-stencil transition disabled:cursor-not-allowed disabled:opacity-50',
  variantClass.value,
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button :type="type" :class="buttonClass" :disabled="disabled">
    <slot />
  </button>
</template>
