<script setup lang="ts">
import { passwordRequirements, validateCredentials } from '~/utils/validation'

const PASSWORD_RULES_ID = 'password-rules'

const props = defineProps<{
  title: string
  lead: string
  submitLabel: string
  pending: boolean
  formError: string
  info: string
  alternateHref: string
  alternatePrompt: string
  alternateLabel: string
  passwordAutocomplete: string
  strictPassword?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { email: string, password: string }]
}>()

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const pendingLabel = computed(() => props.pending ? 'Bitte warten…' : props.submitLabel)
const passwordDescribedBy = computed(() => props.strictPassword ? PASSWORD_RULES_ID : '')
const passwordRules = computed(() => {
  if (!props.strictPassword) return []
  return passwordRequirements(password.value).map((rule) => ({
    id: rule.id,
    label: rule.label,
    toneClass: rule.met ? 'text-spruce' : 'text-muted',
    mark: rule.met ? '✓' : '○',
    status: rule.met ? 'Erfüllt' : 'Fehlt',
  }))
})

function onEmail(value: string): void {
  email.value = value
  emailError.value = ''
}

function onPassword(value: string): void {
  password.value = value
  passwordError.value = ''
}

function submit(): void {
  const errors = validateCredentials(email.value, password.value, { strictPassword: props.strictPassword === true })
  emailError.value = errors.email ?? ''
  passwordError.value = errors.password ?? ''
  if (errors.email || errors.password) return
  emit('submit', { email: email.value, password: password.value })
}
</script>

<template>
  <div class="panel">
    <h1 class="display-title text-4xl">{{ title }}</h1>
    <p class="mt-2 text-base leading-7 text-muted">{{ lead }}</p>
    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <TextField
        id="email"
        label="E-Mail"
        type="email"
        autocomplete="email"
        :model-value="email"
        :error="emailError"
        :disabled="pending"
        @update:model-value="onEmail"
      />
      <div>
        <TextField
          id="password"
          label="Passwort"
          type="password"
          :autocomplete="passwordAutocomplete"
          :model-value="password"
          :error="passwordError"
          :disabled="pending"
          :described-by="passwordDescribedBy"
          @update:model-value="onPassword"
        />
        <ul
          v-if="strictPassword"
          :id="PASSWORD_RULES_ID"
          class="mt-2 space-y-1"
          aria-label="Passwortregeln"
        >
          <li
            v-for="rule in passwordRules"
            :key="rule.id"
            class="flex items-center gap-2 text-sm"
            :class="rule.toneClass"
          >
            <span aria-hidden="true" class="w-3 text-center">{{ rule.mark }}</span>
            <span class="sr-only">{{ rule.status }}: </span>
            <span>{{ rule.label }}</span>
          </li>
        </ul>
      </div>
      <p v-if="formError" class="text-sm text-clay" role="alert">{{ formError }}</p>
      <p v-if="info" class="text-sm text-spruce" role="status">{{ info }}</p>
      <AppButton type="submit" :disabled="pending" block>{{ pendingLabel }}</AppButton>
    </form>
    <p class="mt-6 text-sm text-muted">
      {{ alternatePrompt }}
      <NuxtLink :to="alternateHref" class="font-semibold text-spruce underline underline-offset-2">
        {{ alternateLabel }}
      </NuxtLink>
    </p>
  </div>
</template>
