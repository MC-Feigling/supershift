import { isVapidPublicKey, type PlanNotice } from './push'

export function queuePlanNotice(notice: PlanNotice): void {
  if (!isVapidPublicKey(useRuntimeConfig().public.vapidPublicKey)) return
  void $fetch('/api/push/notify', { method: 'POST', body: notice }).catch(() => undefined)
}
