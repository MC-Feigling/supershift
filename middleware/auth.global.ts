import { PUBLIC_PATHS, ROUTES } from '~/utils/constants'
import { isSupabaseConfigured } from '~/utils/env'
import { SESSION_STATE_KEY } from '~/utils/constants'
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

  const isPublic = PUBLIC_PATHS.includes(to.path as (typeof PUBLIC_PATHS)[number])
  if (!user.value && !isPublic) return navigateTo(ROUTES.signIn)
  if (user.value && (to.path === ROUTES.signIn || to.path === ROUTES.signUp)) return navigateTo(ROUTES.home)
})
