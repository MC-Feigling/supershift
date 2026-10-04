<script setup lang="ts">
import { ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'

const session = useSession()
const formError = ref('')
const info = ref('')
const pending = ref(false)

async function onSubmit(payload: { email: string, password: string }): Promise<void> {
  formError.value = ''
  info.value = ''
  pending.value = true
  try {
    const result = await session.signUp(payload.email, payload.password)
    if (result.needsConfirmation) {
      info.value = 'Konto angelegt. Bestätige die E-Mail.'
    }
  } catch (error) {
    formError.value = toGermanError(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthCard
    title="Konto anlegen"
    lead="E-Mail und Passwort. Danach gehört der Plan dir."
    submit-label="Konto erstellen"
    password-autocomplete="new-password"
    :pending="pending"
    :form-error="formError"
    :info="info"
    :alternate-href="ROUTES.signIn"
    alternate-prompt="Schon ein Konto?"
    alternate-label="Anmelden"
    @submit="onSubmit"
  />
</template>
