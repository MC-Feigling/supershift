import { formatShortDay, isIsoDate } from './dates'
import { isUuid, validateShiftName } from './validation'

export const PLAN_NOTICE_KIND = {
  created: 'created',
  removed: 'removed',
} as const

export type PlanNoticeKind = (typeof PLAN_NOTICE_KIND)[keyof typeof PLAN_NOTICE_KIND]

export interface PlanNotice {
  kind: PlanNoticeKind
  shiftName: string
  startsOn: string
  repeatsWeekly: boolean
  endsOn: string | null
  planOwnerId: string
}

export interface PushKeys {
  endpoint: string
  p256dh: string
  auth: string
}

const VAPID_PLACEHOLDERS = ['YOUR_VAPID', 'replace-with'] as const

export function isVapidPublicKey(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 80) return false
  return !VAPID_PLACEHOLDERS.some((marker) => trimmed.includes(marker))
}

export function validatePlanNotice(value: unknown): PlanNotice | null {
  if (!isRecord(value)) return null
  if (value.kind !== PLAN_NOTICE_KIND.created && value.kind !== PLAN_NOTICE_KIND.removed) return null
  if (typeof value.shiftName !== 'string') return null
  if (typeof value.startsOn !== 'string' || !isIsoDate(value.startsOn)) return null
  if (typeof value.repeatsWeekly !== 'boolean') return null
  if (value.endsOn !== null && typeof value.endsOn !== 'string') return null
  if (value.repeatsWeekly && (typeof value.endsOn !== 'string' || !isIsoDate(value.endsOn))) return null
  if (validateShiftName(value.shiftName)) return null
  if (typeof value.planOwnerId !== 'string' || !isUuid(value.planOwnerId)) return null
  return {
    kind: value.kind,
    shiftName: value.shiftName.trim(),
    startsOn: value.startsOn,
    repeatsWeekly: value.repeatsWeekly,
    endsOn: value.repeatsWeekly ? value.endsOn : null,
    planOwnerId: value.planOwnerId,
  }
}

export function noticeText(notice: PlanNotice): { title: string, body: string } {
  const verb = notice.kind === PLAN_NOTICE_KIND.created ? 'eingetragen' : 'entfernt'
  const body = notice.repeatsWeekly && notice.endsOn
    ? `${notice.shiftName} wöchentlich bis ${formatShortDay(notice.endsOn)} ${verb}.`
    : `${notice.shiftName} am ${formatShortDay(notice.startsOn)} ${verb}.`
  return { title: 'Schichtwerk', body }
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index)
  }
  return output
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
