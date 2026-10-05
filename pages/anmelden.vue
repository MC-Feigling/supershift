<script setup lang="ts">
import { ROUTES, WEITER_QUERY } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'
import { readInviteRedirect, withInviteRedirect } from '~/utils/invite'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Anmelden' })

const route = useRoute()
const session = useSession()
const formError = ref('')
const pending = ref(false)
const weiter = computed(() => readInviteRedirect(route.query[WEITER_QUERY]))
const signUpHref = computed(() => withInviteRedirect(ROUTES.signUp, weiter.value))

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
      :alternate-href="signUpHref"
      alternate-prompt="Noch kein Konto?"
      alternate-label="Registrieren"
      @submit="onSubmit"
    />
  </AuthShell>
</template>
