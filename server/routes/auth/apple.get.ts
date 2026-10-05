import { APPLE_AUTH_ERROR, APPLE_AUTH_FROM, APPLE_AUTH_FROM_COOKIE, APPLE_AUTH_FROM_MAX_AGE_SECONDS, APPLE_AUTH_QUERY, ROUTES } from '~/utils/constants'
import { appleErrorLocation, classifyAppleStartFailure, firstQueryValue } from '~/utils/apple-auth'
import { isSupabaseConfigured } from '~/utils/env'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const from = firstQueryValue(getQuery(event)[APPLE_AUTH_QUERY.from])
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey

  if (!isSupabaseConfigured(url, key)) {
    return sendRedirect(event, ROUTES.setup, 303)
  }

  const origin = getRequestURL(event).origin
  const client = createEventSupabase(event, url, key)
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${origin}${ROUTES.authCallback}`,
      scopes: 'name email',
    },
  })

  if (error || !data.url) {
    const code = error ? classifyAppleStartFailure(error.message) : APPLE_AUTH_ERROR.failed
    return sendRedirect(event, appleErrorLocation(from, code), 303)
  }

  const returnFrom = from === APPLE_AUTH_FROM.signUp ? APPLE_AUTH_FROM.signUp : APPLE_AUTH_FROM.signIn
  setCookie(event, APPLE_AUTH_FROM_COOKIE, returnFrom, {
    httpOnly: true,
    sameSite: 'lax',
    secure: origin.startsWith('https:'),
    path: '/',
    maxAge: APPLE_AUTH_FROM_MAX_AGE_SECONDS,
  })

  return sendRedirect(event, data.url, 303)
})
