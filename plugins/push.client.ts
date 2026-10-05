import { SERVICE_WORKER_PATH } from '~/utils/constants'
import { isVapidPublicKey } from '~/utils/push'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  if (!isVapidPublicKey(config.public.vapidPublicKey)) return
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register(SERVICE_WORKER_PATH)
})
