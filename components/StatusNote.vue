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
  if (props.tone === 'error') return 'border-clay/40 border-l-clay bg-[#2a1a16] text-clay'
  if (props.tone === 'empty') return 'border-line border-l-line bg-card text-ink'
  return 'border-spruce/30 border-l-spruce bg-spruce-soft text-spruce'
})

const liveRole = computed(() => props.tone === 'error' ? 'alert' : 'status')
</script>

<template>
  <div :class="['rounded-sm border border-l-4 px-5 py-4', toneClass]" :role="liveRole">
    <p class="display-title text-xl uppercase tracking-wide">{{ title }}</p>
    <p v-if="body" class="mt-1 text-sm leading-6 text-current/80">{{ body }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
