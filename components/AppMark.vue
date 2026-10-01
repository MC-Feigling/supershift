<script setup lang="ts">
const props = withDefaults(defineProps<{ onDark?: boolean }>(), { onDark: false })

const tileFill = computed(() => props.onDark ? '#f3eee4' : '#1d4a38')
const barFill = computed(() => props.onDark ? '#1d4a38' : '#f3eee4')
const softFill = computed(() => props.onDark ? '#8d3b2c' : '#e4d9c8')
const wordClass = computed(() => props.onDark ? 'text-white' : 'text-ink')
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg viewBox="0 0 32 32" class="h-8 w-8" aria-hidden="true">
      <rect width="32" height="32" rx="8" :fill="tileFill" />
      <rect x="7" y="8" width="18" height="3" rx="1.5" :fill="barFill" />
      <rect x="7" y="14.5" width="12" height="3" rx="1.5" :fill="barFill" />
      <rect x="7" y="21" width="18" height="3" rx="1.5" :fill="softFill" />
    </svg>
    <span class="font-display text-xl font-medium tracking-tight" :class="wordClass">Schichtwerk</span>
  </span>
</template>
