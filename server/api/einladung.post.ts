import { createError, getRequestURL, readBody } from 'h3'
import { SHARE_STATUS } from '~/types/plan'
import { isInviteToken } from '~/utils/validation'
import { readSmtp, sendInviteMail } from '../utils/smtp'
import { createUserClient } from '../utils/user-supabase'

interface InviteBody {
  token?: unknown
}

export default defineEventHandler(async (event) => {
  const client = createUserClient(event)
  if (!client) {
    throw createError({ statusCode: 503, statusMessage: 'Supabase ist nicht eingerichtet.' })
  }

  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet.' })
  }

  const body = await readBody<InviteBody>(event)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!isInviteToken(token)) {
    throw createError({ statusCode: 400, statusMessage: 'Der Link ist ungültig.' })
  }

  const { data, error } = await client
    .from('plan_shares')
    .select('grantee_email, status')
    .eq('owner_id', userData.user.id)
    .eq('invite_token', token)
    .in('status', [SHARE_STATUS.pending, SHARE_STATUS.active])
    .maybeSingle()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Die Freigabe fehlt.' })
  }

  const configured = readSmtp() !== null
  if (!data.grantee_email) return { configured, sent: false }

  const smtp = readSmtp()
  if (!smtp) return { configured: false, sent: false }

  const link = `${getRequestURL(event).origin}/einladung/${token}`
  try {
    await sendInviteMail(smtp, data.grantee_email, link)
  } catch {
    return { configured: true, sent: false }
  }

  return { configured: true, sent: true }
})
