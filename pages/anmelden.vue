<script setup lang="ts">
import { appleSignInError } from '~/utils/apple-auth'
import { APPLE_AUTH_FROM, APPLE_AUTH_QUERY, ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Anmelden' })

const route = useRoute()
const session = useSession()
const formError = ref('')
const appleError = ref(appleSignInError(route.query[APPLE_AUTH_QUERY.error]))
const pending = ref(false)

async function onSubmit(payload: { email: string, password: string }): Promise<void> {
  formError.value = ''
  appleError.value = ''
  pending.value = true
  try {
    await session.signIn(payload.email, payload.password)
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
      title="Willkommen zurück"
      lead="Melde dich mit E-Mail oder Apple-ID an, um deinen Schichtplan zu öffnen."
      submit-label="Anmelden"
      password-autocomplete="current-password"
      :pending="pending"
      :form-error="formError"
      :apple-error="appleError"
      :apple-from="APPLE_AUTH_FROM.signIn"
      info=""
      :alternate-href="ROUTES.signUp"
      alternate-prompt="Noch kein Konto?"
      alternate-label="Registrieren"
      @submit="onSubmit"
    />
  </AuthShell>
</template>
