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
  if (props.tone === 'error') return 'border-clay/40 bg-[#2a1a16] text-clay'
  if (props.tone === 'empty') return 'border-line bg-sand text-ink'
  return 'border-spruce/30 bg-spruce-soft text-spruce'
})

const liveRole = computed(() => props.tone === 'error' ? 'alert' : 'status')
</script>

<template>
  <div :class="['rounded-sm border px-5 py-4', toneClass]" :role="liveRole">
    <p class="font-display text-xl font-medium uppercase tracking-wide">{{ title }}</p>
    <p v-if="body" class="mt-1 text-sm leading-6 text-current/80">{{ body }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
