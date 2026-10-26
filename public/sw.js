self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const PLAN_CHANGED = 'plan-changed'

function notifyOpenClients() {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    windows.forEach((client) => client.postMessage({ type: PLAN_CHANGED }))
  })
}

self.addEventListener('push', (event) => {
  const fallback = { title: 'Schichtwerk', body: 'Der Plan hat sich geändert.', url: '/' }
  let payload = fallback
  try {
    payload = event.data ? { ...fallback, ...event.data.json() } : fallback
  } catch {
    payload = fallback
  }
  event.waitUntil(Promise.all([
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url || '/' },
    }),
    notifyOpenClients(),
  ]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data && event.notification.data.url ? event.notification.data.url : '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => 'focus' in client)
      if (existing) {
        existing.navigate(target)
        return existing.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
