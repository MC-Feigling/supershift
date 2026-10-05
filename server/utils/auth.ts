import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { appendHeader, getHeader, setHeader } from 'h3'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database'

export function createEventSupabase(event: H3Event, url: string, key: string): SupabaseClient<Database> {
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(getHeader(event, 'cookie') ?? '')
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value, options }) => {
          appendHeader(event, 'set-cookie', serializeCookieHeader(name, value, options))
        })
        Object.entries(cacheHeaders).forEach(([header, value]) => {
          setHeader(event, header, value)
        })
      },
    },
  })
}

export async function requireApiUser(event: H3Event): Promise<{ id: string, client: SupabaseClient<Database> }> {
  const config = useRuntimeConfig(event)
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey
  if (!url || !key) throw createError({ statusCode: 503, statusMessage: 'Supabase fehlt.' })
  const client = createEventSupabase(event, url, key)
  const { data, error } = await client.auth.getClaims()
  if (error || !data?.claims.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet.' })
  }
  return { id: data.claims.sub, client }
}

export function requireVapid(event: H3Event): { publicKey: string, privateKey: string, subject: string } {
  const config = useRuntimeConfig(event)
  const publicKey = config.public.vapidPublicKey.trim()
  const privateKey = config.vapidPrivateKey.trim()
  const subject = config.vapidSubject.trim() || 'mailto:schichtwerk@localhost'
  if (publicKey.length < 80 || privateKey.length < 20) {
    throw createError({ statusCode: 503, statusMessage: 'Push ist nicht eingerichtet.' })
  }
  return { publicKey, privateKey, subject }
}
