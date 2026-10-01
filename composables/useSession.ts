import type { SessionUser } from '~/types/plan'
import { ROUTES, SESSION_STATE_KEY } from '~/utils/constants'
import { AppError, toGermanError } from '~/utils/errors'
import { normalizeEmail, validateCredentials } from '~/utils/validation'

export interface AuthResult {
  needsConfirmation: boolean
}

export function useSession() {
  const user = useState<SessionUser | null>(SESSION_STATE_KEY, () => null)
  const requestUrl = useRequestURL()

  async function signIn(email: string, password: string): Promise<void> {
    const errors = validateCredentials(email, password)
    if (errors.email || errors.password) throw new AppError(errors.email ?? errors.password ?? 'Eingabe prüfen.')
    const supabase = requireSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    })
    if (error) throw new AppError(toGermanError(error))
    if (!data.user) throw new AppError('Die Anmeldung ist fehlgeschlagen. Versuch es noch einmal.')
    user.value = { id: data.user.id, email: data.user.email ?? normalizeEmail(email) }
    await navigateTo(ROUTES.home)
  }

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const errors = validateCredentials(email, password)
    if (errors.email || errors.password) throw new AppError(errors.email ?? errors.password ?? 'Eingabe prüfen.')
    const supabase = requireSupabase()
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { emailRedirectTo: `${requestUrl.origin}${ROUTES.signIn}` },
    })
    if (error) throw new AppError(toGermanError(error))
    if (!data.user) throw new AppError('Das Konto konnte nicht angelegt werden.')
    if (!data.session) return { needsConfirmation: true }
    user.value = { id: data.user.id, email: data.user.email ?? normalizeEmail(email) }
    await navigateTo(ROUTES.home)
    return { needsConfirmation: false }
  }

  async function signOut(): Promise<void> {
    const supabase = useNuxtApp().$supabase
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw new AppError(toGermanError(error))
    }
    user.value = null
    await navigateTo(ROUTES.signIn)
  }

  return { user, signIn, signUp, signOut }
}

function requireSupabase() {
  const client = useNuxtApp().$supabase
  if (!client) throw new AppError('Supabase ist nicht eingerichtet.')
  return client
}
