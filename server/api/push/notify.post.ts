import webpush from 'web-push'
import { SHARE_STATUS } from '~/types/plan'
import { TABLES } from '~/utils/constants'
import { noticeText, validatePlanNotice } from '~/utils/push'

export default defineEventHandler(async (event) => {
  const { id, client } = await requireApiUser(event)
  const vapid = requireVapid(event)
  const notice = validatePlanNotice(await readBody(event))
  if (!notice) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Meldung.' })
  }

  const { data: share, error: shareError } = await client
    .from(TABLES.planShares)
    .select('grantee_id')
    .eq('owner_id', id)
    .eq('status', SHARE_STATUS.active)
    .maybeSingle()

  if (shareError) throw createError({ statusCode: 500, statusMessage: shareError.message })
  const granteeId = share?.grantee_id
  if (!granteeId) return { sent: 0 }

  const { data: rows, error: subError } = await client
    .from(TABLES.pushSubscriptions)
    .select('endpoint, p256dh, auth')
    .eq('user_id', granteeId)

  if (subError) throw createError({ statusCode: 500, statusMessage: subError.message })
  const subscriptions = rows ?? []
  if (subscriptions.length === 0) return { sent: 0 }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)
  const payload = JSON.stringify({ ...noticeText(notice), url: '/' })
  let sent = 0

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
      )
      sent += 1
    } catch (error) {
      if (!isGone(error)) continue
      await client.from(TABLES.pushSubscriptions).delete().eq('endpoint', subscription.endpoint)
    }
  }

  return { sent }
})

function isGone(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return false
  const code = error.statusCode
  return code === 404 || code === 410
}
