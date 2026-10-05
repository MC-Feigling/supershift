<script setup lang="ts">
import { COPY_FEEDBACK_MS } from '~/utils/constants'

const props = withDefaults(defineProps<{
  url: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const copied = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const copyLabel = computed(() => copied.value ? 'Kopiert' : 'Kopieren')

function onFocus(event: FocusEvent): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  target.select()
}

async function copy(): Promise<void> {
  if (props.disabled || props.url.length === 0) return
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, COPY_FEEDBACK_MS)
  } catch {
    inputRef.value?.focus()
    inputRef.value?.select()
  }
}

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div>
    <p class="label-meta mb-1.5">Link zum Kopieren</p>
    <div class="flex flex-col gap-2 sm:flex-row">
      <input
        ref="inputRef"
        :value="url"
        readonly
        aria-label="Freigabelink"
        class="w-full rounded-sm border border-line bg-paper px-3.5 py-3 font-mono text-sm text-ink outline-none ring-spruce focus:border-spruce focus:ring-2"
        @focus="onFocus"
      >
      <AppButton variant="secondary" :disabled="disabled" @click="copy">{{ copyLabel }}</AppButton>
    </div>
  </div>
</template>
