<script setup lang="ts">
import { validateCredentials } from '~/utils/validation'

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
}>()

const emit = defineEmits<{
  submit: [payload: { email: string, password: string }]
}>()

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const pendingLabel = computed(() => props.pending ? 'Bitte warten…' : props.submitLabel)

function onEmail(value: string): void {
  email.value = value
  emailError.value = ''
}

function onPassword(value: string): void {
  password.value = value
  passwordError.value = ''
}

function submit(): void {
  const errors = validateCredentials(email.value, password.value)
  emailError.value = errors.email ?? ''
  passwordError.value = errors.password ?? ''
  if (errors.email || errors.password) return
  emit('submit', { email: email.value, password: password.value })
}
</script>

<template>
  <div>
    <h1 class="font-display text-4xl font-medium uppercase tracking-wide">{{ title }}</h1>
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
      <TextField
        id="password"
        label="Passwort"
        type="password"
        :autocomplete="passwordAutocomplete"
        :model-value="password"
        :error="passwordError"
        :disabled="pending"
        @update:model-value="onPassword"
      />
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
