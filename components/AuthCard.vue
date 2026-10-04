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
  alternateAsButton?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { email: string, password: string }]
  alternate: []
}>()

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const pendingLabel = computed(() => props.pending ? 'Bitte warten…' : props.submitLabel)
const useAlternateButton = computed(() => props.alternateAsButton === true)

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
    <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Zugang</p>
    <h1 class="mt-2 text-4xl font-medium tracking-tight">{{ title }}</h1>
    <p class="mt-3 text-sm leading-6 text-muted">{{ lead }}</p>
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
      <p v-if="formError" class="text-sm text-accent" role="alert">{{ formError }}</p>
      <p v-if="info" class="border-l-2 border-accent px-3 py-2 text-sm" role="status">{{ info }}</p>
      <AppButton type="submit" :disabled="pending" block>{{ pendingLabel }}</AppButton>
    </form>
    <p class="mt-6 text-sm text-muted">
      {{ alternatePrompt }}
      <button
        v-if="useAlternateButton"
        type="button"
        class="font-medium text-ink underline underline-offset-2"
        @click="emit('alternate')"
      >
        {{ alternateLabel }}
      </button>
      <NuxtLink v-else :to="alternateHref" class="font-medium text-ink underline underline-offset-2">
        {{ alternateLabel }}
      </NuxtLink>
    </p>
  </div>
</template>
