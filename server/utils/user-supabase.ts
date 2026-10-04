import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { appendHeader, getHeader, setHeader } from 'h3'
import type { Database } from '~/types/database'
import { isSupabaseConfigured } from '~/utils/env'

export function createUserClient(event: H3Event): SupabaseClient<Database> | null {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey
  if (!isSupabaseConfigured(url, key)) return null

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(getHeader(event, 'cookie') ?? '')
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value, options }) => {
          appendHeader(event, 'set-cookie', serializeCookieHeader(name, value, options))
        })
        Object.entries(cacheHeaders).forEach(([header, headerValue]) => {
          setHeader(event, header, headerValue)
        })
      },
    },
  })
}
