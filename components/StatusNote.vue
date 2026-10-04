<script setup lang="ts">
const props = withDefaults(defineProps<{
  tone?: 'error' | 'info' | 'empty'
  title: string
  body?: string
}>(), {
  tone: 'info',
  body: '',
})

const toneClass = computed(() => {
  if (props.tone === 'error') return 'border-accent bg-card text-ink'
  if (props.tone === 'empty') return 'border-line bg-paper text-ink'
  return 'border-line bg-card text-ink'
})

const liveRole = computed(() => props.tone === 'error' ? 'alert' : 'status')
</script>

<template>
  <div :class="['border border-l-2 px-4 py-3', toneClass]" :role="liveRole">
    <p class="text-base font-medium tracking-tight">{{ title }}</p>
    <p v-if="body" class="mt-1 text-sm leading-6 text-muted">{{ body }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
