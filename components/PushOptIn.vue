<script setup lang="ts">
const { status, errorMessage, enable, disable } = usePush()

const title = computed(() => {
  if (status.value === 'on') return 'Benachrichtigungen an'
  if (status.value === 'denied') return 'Benachrichtigungen blockiert'
  if (status.value === 'unsupported') return 'Benachrichtigungen nicht möglich'
  if (status.value === 'unconfigured') return 'Benachrichtigungen fehlen'
  return 'Benachrichtigungen'
})

const body = computed(() => {
  if (status.value === 'on') {
    return 'Dieses Gerät bekommt eine Meldung, wenn im geteilten Plan etwas eingetragen oder entfernt wird.'
  }
  if (status.value === 'denied') {
    return 'Der Browser blockiert Meldungen. Erlaube sie in den Einstellungen, dann schalte hier wieder ein.'
  }
  if (status.value === 'unsupported') {
    return 'Dieser Browser oder dieses Gerät kann keine Push-Meldungen. Am Handy oft nur nach „Zum Home-Bildschirm“.'
  }
  if (status.value === 'unconfigured') {
    return 'VAPID-Schlüssel fehlen in der Umgebung. Ohne sie gibt es keine Meldungen.'
  }
  return 'Die Person mit Leserecht bekommt eine Meldung, sobald du etwas einträgst oder entfernst. Dafür muss sie das hier auf ihrem Gerät einschalten.'
})

const actionLabel = computed(() => {
  if (status.value === 'busy') return 'Bitte warten…'
  if (status.value === 'on') return 'Ausschalten'
  return 'Einschalten'
})

const showAction = computed(() => {
  return status.value === 'off' || status.value === 'on' || status.value === 'busy'
})

const actionVariant = computed(() => status.value === 'on' || status.value === 'busy' ? 'secondary' : 'primary')

function onAction(): void {
  if (status.value === 'on') {
    void disable()
    return
  }
  void enable()
}
</script>

<template>
  <article class="panel">
    <h2 class="display-title text-2xl">{{ title }}</h2>
    <p class="mt-2 text-sm leading-6 text-muted">{{ body }}</p>
    <p v-if="errorMessage" class="mt-3 text-sm text-clay" role="alert">{{ errorMessage }}</p>
    <div v-if="showAction" class="mt-4">
      <AppButton :variant="actionVariant" :disabled="status === 'busy'" @click="onAction">
        {{ actionLabel }}
      </AppButton>
    </div>
  </article>
</template>
