import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database'

declare module '#app' {
  interface NuxtApp {
    $supabase: SupabaseClient<Database> | null
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient<Database> | null
  }
}

export {}
