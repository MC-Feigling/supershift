<script setup lang="ts">
import { ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Anmelden' })

const session = useSession()
const formError = ref('')
const pending = ref(false)

async function onSubmit(payload: { email: string, password: string }): Promise<void> {
  formError.value = ''
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
      lead="Melde dich an, um deinen Schichtplan zu öffnen."
      submit-label="Anmelden"
      password-autocomplete="current-password"
      :pending="pending"
      :form-error="formError"
      info=""
      :alternate-href="ROUTES.signUp"
      alternate-prompt="Noch kein Konto?"
      alternate-label="Registrieren"
      @submit="onSubmit"
    />
  </AuthShell>
</template>
