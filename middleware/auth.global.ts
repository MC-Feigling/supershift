import { PUBLIC_PATHS, ROUTES, SESSION_STATE_KEY, WEITER_QUERY } from '~/utils/constants'
import { isSupabaseConfigured } from '~/utils/env'
import { isInviteRoute, readInviteRedirect } from '~/utils/invite'
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

  const isPublic = (PUBLIC_PATHS as readonly string[]).includes(to.path) || isInviteRoute(to.path)
  if (!user.value && !isPublic) return navigateTo(ROUTES.signIn)
  if (user.value && (to.path === ROUTES.signIn || to.path === ROUTES.signUp)) {
    const next = readInviteRedirect(to.query[WEITER_QUERY])
    return navigateTo(next ?? ROUTES.home)
  }
})
