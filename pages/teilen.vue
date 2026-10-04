<script setup lang="ts">
import { SHARE_STATUS } from '~/types/plan'
import { ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'

interface MailResult {
  configured: boolean
  sent: boolean
}

definePageMeta({ layout: 'default' })
useHead({ title: 'Teilen' })

const plan = await useLoadedPlan()
const requestUrl = useRequestURL()
const email = ref('')
const formError = ref('')
const confirmingRevoke = ref(false)
const copyState = ref('')
const mailConfigured = ref<boolean | null>(null)
const mailNotice = ref('')

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
  if (share.status === SHARE_STATUS.active) {
    const who = share.granteeEmail || 'Die andere Person'
    return `${who} kann den Plan lesen, nichts ändern.`
  }
  if (share.granteeEmail) {
    return `Offen für ${share.granteeEmail}. Nur diese Adresse kann annehmen, sobald sie bestätigt ist.`
  }
  return 'Offen ohne Adresse. Die erste angemeldete Person, die den Link öffnet, nimmt an.'
})
const inviteLink = computed(() => {
  const token = openShare.value?.inviteToken
  if (!token) return ''
  return `${requestUrl.origin}${ROUTES.invite}/${token}`
})
const hasInviteLink = computed(() => inviteLink.value.length > 0)
const hasGranteeEmail = computed(() => (openShare.value?.granteeEmail ?? '').length > 0)
const mailStatus = computed(() => {
  if (mailNotice.value) return mailNotice.value
  if (mailConfigured.value === false) return 'Die Mail ist nicht eingerichtet. Der Link gilt trotzdem.'
  if (!hasGranteeEmail.value) return ''
  if (mailConfigured.value === true) return 'Der Versand ist eingerichtet. Die Mail geht nur an die eingetragene Adresse.'
  return ''
})
const showMailStatus = computed(() => mailStatus.value.length > 0)
const showSendMail = computed(() => hasOpenShare.value && hasGranteeEmail.value && hasInviteLink.value)
const submitLabel = computed(() => {
  if (plan.isSaving) return 'Wird gespeichert…'
  return email.value.trim() ? 'Einladen' : 'Link erzeugen'
})
const hasIncoming = computed(() => plan.incomingShares.length > 0)
const revokeLabel = computed(() => plan.isSaving ? 'Wird zurückgezogen…' : 'Zugriff entziehen')
const panelClass = 'border border-line bg-card p-5'

onMounted(() => {
  void loadMailConfig()
})

function onEmail(value: string): void {
  email.value = value
}

async function loadMailConfig(): Promise<void> {
  try {
    const result = await $fetch<MailResult>('/api/einladung')
    mailConfigured.value = result.configured
  } catch {
    mailConfigured.value = null
  }
}

async function invite(): Promise<void> {
  formError.value = ''
  mailNotice.value = ''
  copyState.value = ''
  try {
    await plan.invite(email.value)
    const token = plan.outgoingShare?.inviteToken
    email.value = ''
    if (plan.outgoingShare?.granteeEmail && token) await sendMail(token)
  } catch (error) {
    formError.value = toGermanError(error)
  }
}

async function sendCurrentMail(): Promise<void> {
  const token = openShare.value?.inviteToken
  if (!token) return
  formError.value = ''
  await sendMail(token)
}

async function sendMail(token: string): Promise<void> {
  try {
    const result = await $fetch<MailResult>('/api/einladung', {
      method: 'POST',
      body: { token },
    })
    mailConfigured.value = result.configured
    if (result.sent) mailNotice.value = 'E-Mail gesendet.'
    else if (!result.configured) mailNotice.value = 'Die Mail ist nicht eingerichtet. Der Link gilt trotzdem.'
    else mailNotice.value = 'Die E-Mail konnte nicht gesendet werden. Der Link gilt trotzdem.'
  } catch {
    mailNotice.value = 'Die E-Mail konnte nicht gesendet werden. Der Link gilt trotzdem.'
  }
}

async function copyLink(): Promise<void> {
  if (!inviteLink.value) return
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copyState.value = 'Link kopiert.'
  } catch {
    copyState.value = 'Link konnte nicht kopiert werden. Markiere ihn und kopiere ihn von Hand.'
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
    copyState.value = ''
    mailNotice.value = ''
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
    <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Freigabe</p>
    <h1 class="mt-2 text-4xl font-medium tracking-tight">Teilen</h1>
    <p class="mt-3 text-sm leading-6 text-muted">
      Eine Person kann deinen Plan lesen. Eine offene Freigabe. Link, optional E-Mail. Widerruf macht den Link ungültig.
    </p>

    <StatusNote v-if="showInitialLoading" class="mt-6" tone="info" title="Freigabe wird geladen" body="Einen Moment." />
    <StatusNote v-else-if="showBlockingError" class="mt-6" tone="error" title="Die Freigabe ist nicht erreichbar" :body="blockingBody">
      <AppButton @click="retry">Erneut laden</AppButton>
    </StatusNote>

    <div v-else class="mt-6 space-y-4">
      <article v-if="hasOpenShare" :class="panelClass">
        <h2 class="text-2xl font-medium tracking-tight">{{ shareTitle }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted">{{ shareBody }}</p>
        <div v-if="hasInviteLink" class="mt-4">
          <label class="block text-[11px] font-medium uppercase tracking-[0.16em]" for="invite-link">Link</label>
          <input
            id="invite-link"
            :value="inviteLink"
            readonly
            class="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
          >
          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton variant="secondary" @click="copyLink">Link kopieren</AppButton>
            <AppButton v-if="showSendMail" variant="secondary" :disabled="plan.isSaving" @click="sendCurrentMail">
              E-Mail senden
            </AppButton>
          </div>
          <p v-if="copyState" class="mt-2 text-sm" role="status">{{ copyState }}</p>
        </div>
        <p v-if="showMailStatus" class="mt-3 text-sm text-muted" role="status">{{ mailStatus }}</p>
        <p v-if="formError" class="mt-3 text-sm text-accent" role="alert">{{ formError }}</p>
        <div v-if="confirmingRevoke" class="mt-4">
          <p class="text-sm font-medium">Zugriff wirklich entziehen?</p>
          <div class="mt-3 flex gap-2">
            <AppButton variant="danger" :disabled="plan.isSaving" @click="confirmRevoke">{{ revokeLabel }}</AppButton>
            <AppButton variant="ghost" @click="cancelRevoke">Abbrechen</AppButton>
          </div>
        </div>
        <div v-else class="mt-4">
          <AppButton variant="danger" @click="askRevoke">Zugriff entziehen</AppButton>
        </div>
      </article>

      <form v-else :class="panelClass" @submit.prevent="invite">
        <h2 class="text-2xl font-medium tracking-tight">Mit einer Person teilen</h2>
        <p class="mt-2 text-sm leading-6 text-muted">
          E-Mail ist optional. Mit Adresse kann nur diese Person annehmen. Ohne Adresse nimmt die erste angemeldete Person den Link an.
        </p>
        <div class="mt-4">
          <TextField
            id="share-email"
            label="E-Mail, optional"
            type="email"
            autocomplete="email"
            :model-value="email"
            :disabled="plan.isSaving"
            @update:model-value="onEmail"
          />
        </div>
        <p v-if="formError" class="mt-3 text-sm text-accent" role="alert">{{ formError }}</p>
        <p v-if="showMailStatus" class="mt-3 text-sm text-muted" role="status">{{ mailStatus }}</p>
        <div class="mt-4">
          <AppButton type="submit" :disabled="plan.isSaving">{{ submitLabel }}</AppButton>
        </div>
      </form>

      <article v-if="hasIncoming" :class="panelClass">
        <h2 class="text-2xl font-medium tracking-tight">Mit dir geteilt</h2>
        <ul class="mt-3 space-y-2">
          <li v-for="share in plan.incomingShares" :key="share.id" class="border-b border-line py-2 text-sm text-muted last:border-b-0">
            {{ share.ownerEmail }}
          </li>
        </ul>
        <p class="mt-3 text-sm text-muted">Im Kalender wechselst du auf den geteilten Plan. Dort kannst du nur lesen und drucken.</p>
      </article>
    </div>
  </section>
</template>
