import { APPLE_AUTH_ERROR, APPLE_AUTH_FROM_COOKIE, ROUTES } from '~/utils/constants'
import { appleErrorLocation, classifyAppleCallbackFailure, firstQueryValue } from '~/utils/apple-auth'
import { isSupabaseConfigured } from '~/utils/env'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const from = getCookie(event, APPLE_AUTH_FROM_COOKIE)
  deleteCookie(event, APPLE_AUTH_FROM_COOKIE, { path: '/' })
  const code = firstQueryValue(query.code)
  const providerError = `${firstQueryValue(query.error)} ${firstQueryValue(query.error_description)}`.trim()
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey

  if (!isSupabaseConfigured(url, key)) {
    return sendRedirect(event, ROUTES.setup, 303)
  }

  if (providerError) {
    return sendRedirect(event, appleErrorLocation(from, classifyAppleCallbackFailure(providerError)), 303)
  }

  if (!code) {
    return sendRedirect(event, appleErrorLocation(from, APPLE_AUTH_ERROR.failed), 303)
  }

  const client = createEventSupabase(event, url, key)
  const { error } = await client.auth.exchangeCodeForSession(code)
  if (error) {
    return sendRedirect(event, appleErrorLocation(from, classifyAppleCallbackFailure(error.message)), 303)
  }

  return sendRedirect(event, ROUTES.home, 303)
})
