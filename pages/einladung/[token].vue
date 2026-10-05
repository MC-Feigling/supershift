<script setup lang="ts">
import { SHARE_STATUS } from '~/types/plan'
import { ROUTES } from '~/utils/constants'
import { toGermanError } from '~/utils/errors'
import { invitePath, isInviteToken, normalizeInviteToken, withInviteRedirect } from '~/utils/invite'
import { shareAccessLabel } from '~/utils/share-access'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Einladung' })

const route = useRoute()
const session = useSession()
const plan = usePlanStore()
const actionError = ref('')
const lookupError = ref('')
const pending = ref(false)

const token = computed(() => normalizeInviteToken(String(route.params.token ?? '')))
const tokenOk = computed(() => isInviteToken(token.value))
const isGuest = computed(() => session.user.value === null)
const inviteHref = computed(() => tokenOk.value ? invitePath(token.value) : null)
const signInHref = computed(() => withInviteRedirect(ROUTES.signIn, inviteHref.value))
const signUpHref = computed(() => withInviteRedirect(ROUTES.signUp, inviteHref.value))

const lookup = await useAsyncData(`invite-${token.value}`, async () => {
  lookupError.value = ''
  if (!session.user.value || !tokenOk.value) return null
  try {
    return await plan.lookupShareInvite(token.value)
  } catch (error) {
    lookupError.value = toGermanError(error)
    return null
  }
})

const invite = computed(() => lookup.data.value)
const loading = computed(() => lookup.status.value === 'pending')
const screenKind = computed(() => {
  if (!tokenOk.value) return 'invalid' as const
  if (isGuest.value) return 'guest' as const
  if (loading.value) return 'loading' as const
  if (lookupError.value) return 'error' as const
  if (!invite.value) return 'invalid' as const
  if (invite.value.status === SHARE_STATUS.revoked) return 'revoked' as const
  if (invite.value.isOwn) return 'own' as const
  if (invite.value.granteeIsSelf) return 'claimed' as const
  if (invite.value.status === SHARE_STATUS.active) return 'used' as const
  return 'ready' as const
})
const screenTitle = computed(() => {
  if (screenKind.value === 'guest') return 'Plan für dich'
  if (screenKind.value === 'loading') return 'Einladung wird geprüft'
  if (screenKind.value === 'error') return 'Einladung nicht prüfbar'
  if (screenKind.value === 'revoked') return 'Link ungültig'
  if (screenKind.value === 'own') return 'Das ist dein Link'
  if (screenKind.value === 'claimed') return 'Du kannst den Plan schon lesen'
  if (screenKind.value === 'used') return 'Link schon vergeben'
  if (screenKind.value === 'ready') return 'Plan öffnen'
  return 'Link ungültig'
})
const screenBody = computed(() => {
  if (screenKind.value === 'guest') {
    return 'Jemand hat einen Schichtplan mit dir geteilt. Melde dich an oder lege ein Konto an. Danach kannst du den Plan öffnen.'
  }
  if (screenKind.value === 'loading') return 'Einen Moment.'
  if (screenKind.value === 'error') return lookupError.value
  if (screenKind.value === 'revoked') return 'Dieser Link gilt nicht mehr.'
  if (screenKind.value === 'own') return 'Gib ihn weiter. Die andere Person muss angemeldet sein. Kopieren geht unter Teilen.'
  if (screenKind.value === 'claimed') return 'Im Kalender wechselst du auf den geteilten Plan.'
  if (screenKind.value === 'used') return 'Dieser Link gehört schon einer anderen Person.'
  if (screenKind.value === 'ready' && invite.value) {
    return `${invite.value.ownerEmail} teilt den Plan. Du kannst ${shareAccessLabel(invite.value.canWrite)}.`
  }
  return 'Dieser Link gilt nicht.'
})
const acceptLabel = computed(() => pending.value ? 'Wird geöffnet…' : 'Plan öffnen')
const showGuestActions = computed(() => screenKind.value === 'guest')
const showAccept = computed(() => screenKind.value === 'ready')
const showHome = computed(() => screenKind.value === 'claimed' || screenKind.value === 'own')
const homeLabel = computed(() => screenKind.value === 'own' ? 'Zu Teilen' : 'Zum Kalender')
const homeHref = computed(() => screenKind.value === 'own' ? ROUTES.share : ROUTES.home)

async function goSignIn(): Promise<void> {
  await navigateTo(signInHref.value)
}

async function goSignUp(): Promise<void> {
  await navigateTo(signUpHref.value)
}

async function accept(): Promise<void> {
  actionError.value = ''
  pending.value = true
  try {
    await plan.acceptInvite(token.value)
    await navigateTo(ROUTES.home)
  } catch (error) {
    actionError.value = toGermanError(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="panel">
      <h1 class="display-title text-4xl">{{ screenTitle }}</h1>
      <p class="mt-2 text-base leading-7 text-muted">{{ screenBody }}</p>
      <p v-if="actionError" class="mt-4 text-sm text-clay" role="alert">{{ actionError }}</p>
      <div v-if="showGuestActions" class="mt-8 flex flex-col gap-2 sm:flex-row">
        <AppButton @click="goSignIn">Anmelden</AppButton>
        <AppButton variant="secondary" @click="goSignUp">Registrieren</AppButton>
      </div>
      <div v-else-if="showAccept" class="mt-8">
        <AppButton :disabled="pending" @click="accept">{{ acceptLabel }}</AppButton>
      </div>
      <div v-else-if="showHome" class="mt-8">
        <NuxtLink :to="homeHref" class="font-semibold text-spruce underline underline-offset-2">
          {{ homeLabel }}
        </NuxtLink>
      </div>
    </div>
  </AuthShell>
</template>
