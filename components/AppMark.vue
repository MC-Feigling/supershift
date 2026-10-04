<script setup lang="ts">
const props = withDefaults(defineProps<{ onDark?: boolean }>(), { onDark: false })

const tileFill = computed(() => props.onDark ? '#e4e1da' : '#141311')
const barFill = computed(() => props.onDark ? '#141311' : '#e4e1da')
const accentFill = '#b8432f'
const wordClass = computed(() => props.onDark ? 'text-paper' : 'text-ink')
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg viewBox="0 0 32 32" class="h-8 w-8" aria-hidden="true">
      <rect width="32" height="32" :fill="tileFill" />
      <rect x="6" y="7" width="20" height="2" :fill="barFill" />
      <rect x="6" y="13" width="14" height="2" :fill="barFill" />
      <rect x="6" y="19" width="20" height="2" :fill="accentFill" />
      <rect x="6" y="25" width="8" height="2" :fill="barFill" />
    </svg>
    <span class="text-sm font-medium uppercase tracking-[0.18em]" :class="wordClass">Schichtwerk</span>
  </span>
</template>
