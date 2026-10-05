<script setup lang="ts">
import { appleSignInError } from '~/utils/apple-auth'
import { APPLE_AUTH_FROM, APPLE_AUTH_QUERY, ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Registrieren' })

const route = useRoute()
const session = useSession()
const formError = ref('')
const appleError = ref(appleSignInError(route.query[APPLE_AUTH_QUERY.error]))
const info = ref('')
const pending = ref(false)

async function onSubmit(payload: { email: string, password: string }): Promise<void> {
  formError.value = ''
  appleError.value = ''
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
      :pending="pending"
      :form-error="formError"
      :apple-error="appleError"
      :apple-from="APPLE_AUTH_FROM.signUp"
      :info="info"
      :alternate-href="ROUTES.signIn"
      alternate-prompt="Schon ein Konto?"
      alternate-label="Anmelden"
      @submit="onSubmit"
    />
  </AuthShell>
</template>
