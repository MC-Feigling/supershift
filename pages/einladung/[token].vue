<script setup lang="ts">
import { INVITE_PREVIEW, ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'
import { rememberInviteToken } from '~/utils/invite-storage'
import { isInviteToken } from '~/utils/validation'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Einladung' })

const route = useRoute()
const session = useSession()
const token = computed(() => {
  const value = route.params.token
  return typeof value === 'string' ? value : ''
})
const preview = ref<'loading' | 'open' | 'yours' | 'closed' | 'error'>('loading')
const mode = ref<'register' | 'sign-in'>('register')
const formError = ref('')
const info = ref('')
const pending = ref(false)
const claimed = ref(false)

const loggedIn = computed(() => session.user.value !== null)
const showAuth = computed(() => preview.value === 'open' && !loggedIn.value && !claimed.value)
const isRegister = computed(() => mode.value === 'register')
const cardTitle = computed(() => isRegister.value ? 'Registrieren' : 'Anmelden')
const cardLead = computed(() => isRegister.value
  ? 'E-Mail und Passwort. Danach nimmst du die Einladung an.'
  : 'Melde dich an, um die Einladung anzunehmen.')
const submitLabel = computed(() => isRegister.value ? 'Konto erstellen' : 'Anmelden')
const passwordAutocomplete = computed(() => isRegister.value ? 'new-password' : 'current-password')
const alternatePrompt = computed(() => isRegister.value ? 'Schon ein Konto?' : 'Noch kein Konto?')
const alternateLabel = computed(() => isRegister.value ? 'Anmelden' : 'Registrieren')
const homePath = ROUTES.home
const showClosed = computed(() => preview.value === 'closed')
const showError = computed(() => preview.value === 'error')
const showYours = computed(() => preview.value === 'yours' || claimed.value)
const showWorking = computed(() => preview.value === 'loading' || (preview.value === 'open' && loggedIn.value && !formError.value))

await loadPreview()
if (preview.value === 'open' && loggedIn.value) await claim()

function switchMode(): void {
  mode.value = isRegister.value ? 'sign-in' : 'register'
  formError.value = ''
  info.value = ''
}

async function loadPreview(): Promise<void> {
  if (!isInviteToken(token.value)) {
    preview.value = 'closed'
    return
  }
  const supabase = useNuxtApp().$supabase
  if (!supabase) {
    preview.value = 'error'
    return
  }
  const { data, error } = await supabase.rpc('preview_invite', { p_token: token.value })
  if (error) {
    preview.value = 'error'
    return
  }
  if (data === INVITE_PREVIEW.open || data === INVITE_PREVIEW.yours || data === INVITE_PREVIEW.closed) {
    preview.value = data
    return
  }
  preview.value = 'error'
}

async function claim(): Promise<void> {
  const supabase = useNuxtApp().$supabase
  if (!supabase) {
    formError.value = 'Supabase ist nicht eingerichtet.'
    return
  }
  const { error } = await supabase.rpc('claim_plan_share', { p_token: token.value })
  if (error) {
    formError.value = toGermanError(error)
    return
  }
  claimed.value = true
  await navigateTo(homePath)
}

async function onSubmit(payload: { email: string, password: string }): Promise<void> {
  formError.value = ''
  info.value = ''
  pending.value = true
  try {
    if (!isRegister.value) {
      await session.signIn(payload.email, payload.password, { redirect: false })
      await claim()
      return
    }
    const result = await session.signUp(payload.email, payload.password, { redirect: false })
    if (result.needsConfirmation) {
      rememberInviteToken(token.value)
      info.value = 'Konto angelegt. Bestätige die E-Mail. Danach öffnet sich der Plan.'
      return
    }
    await claim()
  } catch (error) {
    formError.value = toGermanError(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell>
  <section>
    <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Freigabe</p>
    <h1 class="mt-2 text-4xl font-medium tracking-tight">Einladung</h1>
    <p class="mt-3 text-sm leading-6 text-muted">
      Jemand teilt einen Schichtplan mit dir. Du kannst ihn lesen, nichts ändern.
    </p>

    <StatusNote v-if="showWorking" class="mt-6" tone="info" title="Einladung wird geprüft" body="Einen Moment." />
    <StatusNote
      v-else-if="showClosed"
      class="mt-6"
      tone="error"
      title="Einladung geschlossen"
      body="Der Link ist ungültig, zurückgezogen oder schon vergeben."
    />
    <StatusNote
      v-else-if="showError"
      class="mt-6"
      tone="error"
      title="Einladung nicht erreichbar"
      body="Prüfe die Verbindung und öffne den Link erneut."
    />
    <div v-else-if="showYours" class="mt-6">
      <StatusNote tone="info" title="Plan schon bei dir" body="Du kannst ihn im Kalender lesen." />
      <p class="mt-4">
        <NuxtLink :to="homePath" class="text-sm font-medium underline underline-offset-2">Zum Kalender</NuxtLink>
      </p>
    </div>

    <div v-if="showAuth" class="mt-8">
      <AuthCard
        :title="cardTitle"
        :lead="cardLead"
        :submit-label="submitLabel"
        :password-autocomplete="passwordAutocomplete"
        :pending="pending"
        :form-error="formError"
        :info="info"
        alternate-href="/"
        alternate-as-button
        :alternate-prompt="alternatePrompt"
        :alternate-label="alternateLabel"
        @alternate="switchMode"
        @submit="onSubmit"
      />
    </div>
    <div v-else-if="formError" class="mt-4">
      <p class="text-sm text-accent" role="alert">{{ formError }}</p>
      <p v-if="loggedIn" class="mt-3">
        <NuxtLink :to="homePath" class="text-sm font-medium underline underline-offset-2">Zum Kalender</NuxtLink>
      </p>
    </div>
  </section>
  </AuthShell>
</template>
