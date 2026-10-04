<script setup lang="ts">
import type { EmailOtpType } from '@supabase/supabase-js'
import { ROUTES } from '~/utils/constants'
import { forgetInviteToken, readInviteToken } from '~/utils/invite-storage'
import { isInviteToken } from '~/utils/validation'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Bestätigen' })

const OTP_TYPES: readonly EmailOtpType[] = ['signup', 'email', 'invite', 'magiclink', 'recovery', 'email_change']

const route = useRoute()
const session = useSession()
const phase = ref<'working' | 'done' | 'error'>('working')
const message = ref('Bestätigung wird geprüft.')
const homePath = ROUTES.home

const code = computed(() => firstQuery(route.query.code))
const tokenHash = computed(() => firstQuery(route.query.token_hash))
const otpType = computed(() => readOtpType(firstQuery(route.query.type)))
const showHome = computed(() => phase.value === 'done')

function firstQuery(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return ''
}

function readOtpType(value: string): EmailOtpType {
  if (OTP_TYPES.includes(value as EmailOtpType)) return value as EmailOtpType
  return 'signup'
}

onMounted(() => {
  void confirmLink()
})

async function confirmLink(): Promise<void> {
  const supabase = useNuxtApp().$supabase
  if (!supabase) {
    phase.value = 'error'
    message.value = 'Supabase ist nicht eingerichtet.'
    return
  }

  try {
    if (code.value) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code.value)
      if (error) throw error
      applyUser(data.user?.id, data.user?.email)
    } else if (tokenHash.value) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash.value,
        type: otpType.value,
      })
      if (error) throw error
      applyUser(data.user?.id, data.user?.email)
    } else {
      phase.value = 'error'
      message.value = 'Der Link ist ungültig.'
      return
    }

    const pendingInvite = readInviteToken()
    if (pendingInvite && isInviteToken(pendingInvite)) {
      const { error } = await supabase.rpc('claim_plan_share', { p_token: pendingInvite })
      if (error) {
        phase.value = 'done'
        message.value = 'E-Mail bestätigt. Die Einladung konnte nicht angenommen werden. Öffne den Link erneut.'
        return
      }
      forgetInviteToken()
    }

    phase.value = 'done'
    message.value = 'E-Mail bestätigt. Der Kalender öffnet sich.'
    await navigateTo(homePath)
  } catch {
    phase.value = 'error'
    message.value = 'Der Link ist ungültig oder abgelaufen.'
  }
}

function applyUser(id: string | undefined, email: string | undefined): void {
  if (!id) return
  session.user.value = { id, email: email ?? '' }
}
</script>

<template>
  <AuthShell>
  <section>
    <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">E-Mail</p>
    <h1 class="mt-2 text-4xl font-medium tracking-tight">Bestätigen</h1>
    <p class="mt-4 text-sm leading-6" :role="phase === 'error' ? 'alert' : 'status'">{{ message }}</p>
    <p v-if="showHome" class="mt-6">
      <NuxtLink :to="homePath" class="text-sm font-medium text-ink underline underline-offset-2">Zum Kalender</NuxtLink>
    </p>
  </section>
  </AuthShell>
</template>
