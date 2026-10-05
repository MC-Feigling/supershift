import { deletePushSubscription, savePushSubscription } from '~/utils/plan-api'
import { SERVICE_WORKER_PATH } from '~/utils/constants'
import { AppError, toGermanError } from '~/utils/errors'
import { isVapidPublicKey, urlBase64ToUint8Array } from '~/utils/push'

export type PushStatus = 'loading' | 'unconfigured' | 'unsupported' | 'denied' | 'off' | 'on' | 'busy'

export function usePush() {
  const config = useRuntimeConfig()
  const session = useSession()
  const status = ref<PushStatus>('loading')
  const errorMessage = ref('')

  const vapidKey = computed(() => config.public.vapidPublicKey)

  async function refresh(): Promise<void> {
    errorMessage.value = ''
    if (!isVapidPublicKey(vapidKey.value)) {
      status.value = 'unconfigured'
      return
    }
    if (!supportsPush()) {
      status.value = 'unsupported'
      return
    }
    if (Notification.permission === 'denied') {
      status.value = 'denied'
      return
    }
    try {
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH)
      const subscription = await registration.pushManager.getSubscription()
      status.value = subscription ? 'on' : 'off'
    } catch {
      status.value = 'unsupported'
    }
  }

  async function enable(): Promise<void> {
    if (status.value !== 'off') return
    const user = session.user.value
    const client = useNuxtApp().$supabase
    if (!user || !client) {
      errorMessage.value = 'Nicht angemeldet.'
      return
    }
    status.value = 'busy'
    errorMessage.value = ''
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        status.value = permission === 'denied' ? 'denied' : 'off'
        return
      }
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH)
      await registration.update()
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.value) as BufferSource,
      })
      const json = subscription.toJSON()
      const keys = json.keys
      if (!json.endpoint || !keys?.p256dh || !keys.auth) {
        throw new AppError('Dieses Gerät liefert keine gültige Push-Adresse.')
      }
      await savePushSubscription(client, user.id, {
        endpoint: json.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      status.value = 'on'
    } catch (error) {
      status.value = 'off'
      errorMessage.value = toGermanError(error)
    }
  }

  async function disable(): Promise<void> {
    if (status.value !== 'on') return
    const user = session.user.value
    const client = useNuxtApp().$supabase
    if (!user || !client) {
      errorMessage.value = 'Nicht angemeldet.'
      return
    }
    status.value = 'busy'
    errorMessage.value = ''
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await deletePushSubscription(client, user.id, subscription.endpoint)
        await subscription.unsubscribe()
      }
      status.value = 'off'
    } catch (error) {
      status.value = 'on'
      errorMessage.value = toGermanError(error)
    }
  }

  onMounted(() => {
    void refresh()
  })

  return {
    status,
    errorMessage,
    enable,
    disable,
  }
}

function supportsPush(): boolean {
  return Boolean(
    import.meta.client
    && window.isSecureContext
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window,
  )
}
