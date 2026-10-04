<script setup lang="ts">
const props = withDefaults(defineProps<{ onDark?: boolean }>(), { onDark: false })

const tileFill = computed(() => props.onDark ? '#d4a24c' : '#23272e')
const plateStroke = computed(() => props.onDark ? '#1a1b1d' : '#d4a24c')
const barFill = computed(() => props.onDark ? '#1a1b1d' : '#ebe6dc')
const accentFill = computed(() => props.onDark ? '#1a1b1d' : '#d4a24c')
const rivetFill = computed(() => props.onDark ? '#1a1b1d' : '#d4a24c')
const wordClass = computed(() => props.onDark ? 'text-workshop' : 'text-ink')
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <svg viewBox="0 0 32 32" class="h-8 w-8" aria-hidden="true">
      <rect width="32" height="32" :fill="tileFill" />
      <rect x="1" y="1" width="30" height="30" fill="none" :stroke="plateStroke" stroke-width="1.5" />
      <circle cx="5" cy="5" r="1.2" :fill="rivetFill" />
      <circle cx="27" cy="5" r="1.2" :fill="rivetFill" />
      <circle cx="5" cy="27" r="1.2" :fill="rivetFill" />
      <circle cx="27" cy="27" r="1.2" :fill="rivetFill" />
      <rect x="7" y="8" width="18" height="3" :fill="barFill" />
      <rect x="7" y="14.5" width="12" height="3" :fill="barFill" />
      <rect x="7" y="21" width="18" height="3" :fill="accentFill" />
    </svg>
    <span class="font-display text-xl font-medium uppercase tracking-stencil" :class="wordClass">Schichtwerk</span>
  </span>
</template>
