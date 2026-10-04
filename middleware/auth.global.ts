import { PUBLIC_PATHS, ROUTES, SESSION_STATE_KEY } from '~/utils/constants'
import { isSupabaseConfigured } from '~/utils/env'
import type { SessionUser } from '~/types/plan'

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const configured = isSupabaseConfigured(config.public.supabaseUrl, config.public.supabasePublishableKey)
  const user = useState<SessionUser | null>(SESSION_STATE_KEY)

  if (!configured) {
    if (to.path !== ROUTES.setup) return navigateTo(ROUTES.setup)
    return
  }

  if (to.path === ROUTES.setup) return navigateTo(ROUTES.home)
  if (to.path === ROUTES.signUp) return navigateTo(ROUTES.home)

  if (to.path === ROUTES.home) setPageLayout(user.value ? 'default' : 'auth')

  const isPublic = isGuestPath(to.path)
  if (!user.value && !isPublic) return navigateTo(ROUTES.signIn)
  if (user.value && to.path === ROUTES.signIn) return navigateTo(ROUTES.home)
})

function isGuestPath(path: string): boolean {
  if (PUBLIC_PATHS.includes(path as (typeof PUBLIC_PATHS)[number])) return true
  return path.startsWith(`${ROUTES.invite}/`)
}
