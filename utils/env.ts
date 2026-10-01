import { MIN_SUPABASE_KEY_LENGTH, PLACEHOLDER_MARKERS } from './constants'

export function isSupabaseConfigured(url: string, key: string): boolean {
  const trimmedUrl = url.trim()
  const trimmedKey = key.trim()
  if (trimmedUrl.length === 0 || trimmedKey.length < MIN_SUPABASE_KEY_LENGTH) return false
  if (PLACEHOLDER_MARKERS.some((marker) => trimmedUrl.includes(marker) || trimmedKey.includes(marker))) {
    return false
  }
  try {
    const parsed = new URL(trimmedUrl)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
