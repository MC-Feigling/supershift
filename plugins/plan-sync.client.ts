import type { SessionUser } from '~/types/plan'
import { PLAN_SYNC_MESSAGE, SESSION_STATE_KEY } from '~/utils/constants'

export default defineNuxtPlugin(() => {
  const plan = usePlanStore()
  const user = useState<SessionUser | null>(SESSION_STATE_KEY)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    if (!user.value) return
    plan.noteRemoteChange()
  })

  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (!user.value) return
    if (!isPlanSyncMessage(event.data)) return
    plan.noteRemoteChange()
  })
})

function isPlanSyncMessage(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  return 'type' in value && value.type === PLAN_SYNC_MESSAGE
}
