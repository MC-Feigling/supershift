<script setup lang="ts">
import { SHARE_STATUS } from '~/types/plan'
import { toGermanError } from '~/utils/errors'
import { shareAccessLabel } from '~/utils/share-access'

definePageMeta({ layout: 'default' })
useHead({ title: 'Teilen' })

const plan = await useLoadedPlan()
const email = ref('')
const canWrite = ref(false)
const formError = ref('')
const confirmingRevoke = ref(false)

const showInitialLoading = computed(() => plan.status === 'loading' && !plan.hasLoaded)
const showBlockingError = computed(() => plan.status === 'error' && !plan.hasLoaded)
const blockingBody = computed(() => plan.errorMessage ?? '')
const openShare = computed(() => plan.outgoingShare)
const hasOpenShare = computed(() => openShare.value !== null)
const shareTitle = computed(() => {
  if (openShare.value?.status === SHARE_STATUS.pending) return 'Einladung offen'
  if (openShare.value?.status === SHARE_STATUS.active) return 'Plan ist geteilt'
  return ''
})
const shareBody = computed(() => {
  const share = openShare.value
  if (!share) return ''
  const access = shareAccessLabel(share.canWrite)
  if (share.status === SHARE_STATUS.pending) {
    return `${share.granteeEmail} hat noch kein Konto. Sobald die Person sich mit dieser E-Mail registriert, kann sie den Plan ${access}.`
  }
  if (share.canWrite) {
    return `${share.granteeEmail} kann den Plan ${access}. Bei Änderungen bekommt die andere Person eine Push-Meldung, wenn sie das eingeschaltet hat.`
  }
  return `${share.granteeEmail} kann den Plan ${access}, nichts ändern. Bei Eintrag oder Entfernen bekommt sie eine Push-Meldung, wenn sie das eingeschaltet hat.`
})
const hasIncoming = computed(() => plan.incomingShares.length > 0)
const incomingRows = computed(() => plan.incomingShares.map((share) => ({
  id: share.id,
  ownerEmail: share.ownerEmail,
  access: shareAccessLabel(share.canWrite),
})))
const revokeLabel = computed(() => plan.isSaving ? 'Wird zurückgezogen…' : 'Zugriff entziehen')
const incomingHint = computed(() => {
  const shares = plan.incomingShares
  if (shares.length === 1 && shares[0]?.canWrite) {
    return 'Im Kalender wechselst du auf den geteilten Plan. Dort kannst du eintragen und entfernen.'
  }
  if (shares.some((share) => share.canWrite)) {
    return 'Im Kalender wechselst du auf den geteilten Plan. Schreiben gilt nur, wenn die Freigabe das erlaubt.'
  }
  return 'Im Kalender wechselst du auf den geteilten Plan. Dort kannst du nur lesen.'
})

function onEmail(value: string): void {
  email.value = value
}

function onAccess(value: boolean): void {
  canWrite.value = value
}

async function invite(): Promise<void> {
  formError.value = ''
  try {
    await plan.invite(email.value, canWrite.value)
    email.value = ''
    canWrite.value = false
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

function askRevoke(): void {
  confirmingRevoke.value = true
}

function cancelRevoke(): void {
  confirmingRevoke.value = false
}

async function confirmRevoke(): Promise<void> {
  formError.value = ''
  try {
    await plan.revoke()
    confirmingRevoke.value = false
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

async function retry(): Promise<void> {
  await plan.load()
}
</script>

<template>
  <section class="mx-auto max-w-xl">
    <h1 class="display-title text-4xl">Teilen</h1>
    <p class="mt-2 text-base leading-7 text-muted">
      Eine Person. Du wählst, ob sie nur liest oder auch einträgt. Es gibt keine Gruppe und keine weitere Freigabe.
    </p>

    <StatusNote v-if="showInitialLoading" class="mt-6" tone="info" title="Freigabe wird geladen" body="Einen Moment." />
    <StatusNote v-else-if="showBlockingError" class="mt-6" tone="error" title="Die Freigabe ist nicht erreichbar" :body="blockingBody">
      <AppButton @click="retry">Erneut laden</AppButton>
    </StatusNote>

    <div v-else class="mt-6 space-y-4">
      <article v-if="hasOpenShare" class="panel">
        <h2 class="display-title text-2xl">{{ shareTitle }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted">{{ shareBody }}</p>
        <div v-if="confirmingRevoke" class="mt-4">
          <p class="text-sm font-semibold">Zugriff wirklich entziehen?</p>
          <div class="mt-3 flex gap-2">
            <AppButton variant="danger" :disabled="plan.isSaving" @click="confirmRevoke">{{ revokeLabel }}</AppButton>
            <AppButton variant="ghost" @click="cancelRevoke">Abbrechen</AppButton>
          </div>
        </div>
        <div v-else class="mt-4">
          <AppButton variant="danger" @click="askRevoke">Zugriff entziehen</AppButton>
        </div>
      </article>

      <form v-else class="panel" @submit.prevent="invite">
        <h2 class="display-title text-2xl">Mit einer Person teilen</h2>
        <p class="mt-2 text-sm leading-6 text-muted">
          Hat die Person schon ein Konto, sieht sie den Plan beim nächsten Öffnen. Sonst bleibt die Einladung offen, bis sie sich registriert.
        </p>
        <div class="mt-4">
          <TextField
            id="share-email"
            label="E-Mail der Person"
            type="email"
            autocomplete="email"
            :model-value="email"
            :disabled="plan.isSaving"
            @update:model-value="onEmail"
          />
        </div>
        <div class="mt-4">
          <ShareAccessField :model-value="canWrite" :disabled="plan.isSaving" @update:model-value="onAccess" />
        </div>
        <p v-if="formError" class="mt-3 text-sm text-clay" role="alert">{{ formError }}</p>
        <div class="mt-4">
          <AppButton type="submit" :disabled="plan.isSaving">Einladen</AppButton>
        </div>
      </form>

      <PushOptIn />

      <article v-if="hasIncoming" class="panel">
        <h2 class="display-title text-2xl">Mit dir geteilt</h2>
        <ul class="mt-3 space-y-2">
          <li v-for="row in incomingRows" :key="row.id" class="text-sm text-muted">
            {{ row.ownerEmail }} · {{ row.access }}
          </li>
        </ul>
        <p class="mt-3 text-sm text-muted">{{ incomingHint }}</p>
      </article>
    </div>
  </section>
</template>
