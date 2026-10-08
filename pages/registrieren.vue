<script setup lang="ts">
import { ROUTES, WEITER_QUERY } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'
import { readInviteRedirect, withInviteRedirect } from '~/utils/invite'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Registrieren' })

const route = useRoute()
const session = useSession()
const formError = ref('')
const info = ref('')
const pending = ref(false)
const weiter = computed(() => readInviteRedirect(route.query[WEITER_QUERY]))
const signInHref = computed(() => withInviteRedirect(ROUTES.signIn, weiter.value))

async function onSubmit(payload: { email: string, password: string }): Promise<void> {
  formError.value = ''
  info.value = ''
  pending.value = true
  try {
    const result = await session.signUp(payload.email, payload.password)
    if (result.needsConfirmation) {
      info.value = 'Konto angelegt. Bestätige die E-Mail, danach kannst du dich anmelden.'
    }
  } catch (error) {
    formError.value = toGermanError(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell>
    <AuthCard
      title="Konto anlegen"
      lead="Dein Plan gehört dir. Du kannst ihn später mit einer Person teilen."
      submit-label="Konto erstellen"
      password-autocomplete="new-password"
      strict-password
      :pending="pending"
      :form-error="formError"
      :info="info"
      :alternate-href="signInHref"
      alternate-prompt="Schon ein Konto?"
      alternate-label="Anmelden"
      @submit="onSubmit"
    />
  </AuthShell>
</template>
