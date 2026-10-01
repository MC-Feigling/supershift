import { createBrowserClient, createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { appendHeader, getHeader, setHeader } from 'h3'
import type { Database } from '~/types/database'
import type { SessionUser } from '~/types/plan'
import { SESSION_STATE_KEY } from '~/utils/constants'
import { isSupabaseConfigured } from '~/utils/env'

export default defineNuxtPlugin<{ supabase: SupabaseClient<Database> | null }>(async () => {
  const config = useRuntimeConfig()
  const sessionUser = useState<SessionUser | null>(SESSION_STATE_KEY, () => null)
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey
  let supabase: SupabaseClient<Database> | null = null

  if (!isSupabaseConfigured(url, key)) {
    sessionUser.value = null
    return { provide: { supabase } }
  }

  supabase = import.meta.server
    ? createServerSupabase(url, key)
    : createBrowserClient<Database>(url, key)

  if (!supabase) {
    sessionUser.value = null
    return { provide: { supabase } }
  }

  try {
    sessionUser.value = await readVerifiedUser(supabase)
  } catch {
    sessionUser.value = null
  }

  return { provide: { supabase } }
})

function createServerSupabase(url: string, key: string): SupabaseClient<Database> | null {
  const event = useRequestEvent()
  if (!event) return null

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

async function readVerifiedUser(supabase: SupabaseClient<Database>): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims.sub) return null
  return {
    id: data.claims.sub,
    email: data.claims.email ?? '',
  }
}
