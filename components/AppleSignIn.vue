<script setup lang="ts">
import { appleStartPath } from '~/utils/apple-auth'

const props = defineProps<{
  disabled: boolean
  from: string
  error: string
}>()

const href = computed(() => appleStartPath(props.from))
const linkClass = computed(() => [
  'inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-coal transition hover:bg-workshop focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spruce',
  props.disabled ? 'pointer-events-none opacity-50' : '',
])
</script>

<template>
  <div class="mt-6">
    <div class="flex items-center gap-3">
      <span class="h-px flex-1 bg-line/70" aria-hidden="true" />
      <span class="font-mono text-[11px] uppercase tracking-stencil text-muted">oder</span>
      <span class="h-px flex-1 bg-line/70" aria-hidden="true" />
    </div>
    <a
      :href="href"
      :class="['mt-6', linkClass]"
      :aria-disabled="disabled"
      :tabindex="disabled ? -1 : undefined"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
      </svg>
      Mit Apple anmelden
    </a>
    <p v-if="error" class="mt-3 text-sm text-clay" role="alert">{{ error }}</p>
  </div>
</template>
