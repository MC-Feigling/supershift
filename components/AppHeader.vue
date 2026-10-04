<script setup lang="ts">
import { ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'

const route = useRoute()
const session = useSession()
const signOutError = ref('')
const signingOut = ref(false)

const items = computed(() => [
  { to: ROUTES.home, label: 'Kalender', current: route.path === ROUTES.home },
  { to: ROUTES.shifts, label: 'Schichten', current: route.path === ROUTES.shifts },
  { to: ROUTES.share, label: 'Teilen', current: route.path === ROUTES.share },
])

const emailLabel = computed(() => session.user.value?.email ?? '')

async function onSignOut(): Promise<void> {
  signOutError.value = ''
  signingOut.value = true
  try {
    await session.signOut()
  } catch (error) {
    signOutError.value = toGermanError(error)
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <header class="border-b border-line bg-sand/90 backdrop-blur">
    <div class="mx-auto flex w-full max-w-page flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
      <NuxtLink :to="ROUTES.home" class="rounded-sm" aria-label="Schichtwerk">
        <AppMark />
      </NuxtLink>
      <nav class="flex items-center gap-1" aria-label="Hauptnavigation">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="rounded-sm px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-stencil text-muted hover:bg-card hover:text-ink"
          :class="item.current ? 'bg-card text-ink ring-1 ring-line' : ''"
          :aria-current="item.current ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="ml-auto flex items-center gap-3">
        <p class="hidden max-w-[14rem] truncate font-mono text-[11px] uppercase tracking-wide text-muted sm:block">{{ emailLabel }}</p>
        <AppButton variant="secondary" :disabled="signingOut" @click="onSignOut">
          Abmelden
        </AppButton>
      </div>
    </div>
    <p v-if="signOutError" class="mx-auto w-full max-w-page px-4 pb-3 text-sm text-clay sm:px-6" role="alert">
      {{ signOutError }}
    </p>
  </header>
</template>
