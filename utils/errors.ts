import { AuthError, type PostgrestError } from '@supabase/supabase-js'
import { CONSTRAINTS, DB_ERROR, POSTGRES_ERROR, POSTGREST_ERROR } from './constants'

export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function toGermanError(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (isPostgrestError(error)) return mapPostgrestError(error)
  if (isAuthError(error)) return mapAuthError(error.message)
  if (error instanceof Error && error.message === 'Failed to fetch') {
    return 'Keine Verbindung zu Supabase. Prüfe die Adresse in der .env.'
  }
  return 'Das hat nicht geklappt. Versuch es noch einmal.'
}

export function isSessionExpired(error: unknown): boolean {
  return isPostgrestError(error) && error.code === POSTGREST_ERROR.jwt
}

function mapPostgrestError(error: PostgrestError): string {
  if (
    error.code === POSTGRES_ERROR.undefinedTable
    || error.code === POSTGRES_ERROR.undefinedColumn
    || error.code === POSTGREST_ERROR.schemaCache
    || error.code === POSTGREST_ERROR.functionNotFound
  ) {
    return 'Die Tabellen fehlen noch. Spiele die Migration aus supabase/migrations ein.'
  }
  if (error.code === POSTGRES_ERROR.insufficientPrivilege) return 'Dafür fehlt die Berechtigung.'
  if (error.code === POSTGREST_ERROR.jwt) return 'Die Sitzung ist abgelaufen. Melde dich erneut an.'
  const detail = `${error.message} ${error.details}`
  if (detail.includes(DB_ERROR.selfShare)) return 'Du kannst den Plan nicht mit dir selbst teilen.'
  if (detail.includes(DB_ERROR.onlyRevoke)) return 'Eine Freigabe kann nur zurückgezogen werden.'
  if (detail.includes(DB_ERROR.shiftTypeMismatch)) return 'Die Schicht gehört nicht zu diesem Plan.'
  if (detail.includes(DB_ERROR.seriesEnd)) return 'Das Enddatum der Serie ist ungültig.'
  if (detail.includes(DB_ERROR.inviteRevoked)) return 'Die Einladung wurde zurückgezogen.'
  if (detail.includes(DB_ERROR.inviteTaken)) return 'Die Einladung wurde schon angenommen.'
  if (detail.includes(DB_ERROR.inviteEmail)) return 'Diese Einladung gilt für eine andere E-Mail-Adresse.'
  if (detail.includes(DB_ERROR.inviteUnconfirmed)) return 'Bestätige zuerst die E-Mail, dann öffne den Link erneut.'
  if (detail.includes(DB_ERROR.inviteInvalid)) return 'Der Link ist ungültig.'
  if (detail.includes(DB_ERROR.notAuthenticated)) return 'Melde dich an, um die Einladung anzunehmen.'
  if (error.code === POSTGRES_ERROR.uniqueViolation) {
    if (detail.includes(CONSTRAINTS.shiftName)) return 'Diesen Namen gibt es schon.'
    if (detail.includes(CONSTRAINTS.oneShare)) {
      return 'Es gibt schon eine offene Freigabe. Zieh sie zuerst zurück.'
    }
    return 'Dieser Eintrag existiert schon.'
  }
  return 'Das hat nicht geklappt. Versuch es noch einmal.'
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login')) return 'E-Mail oder Passwort ist falsch.'
  if (normalized.includes('email not confirmed')) return 'Bestätige zuerst die E-Mail, dann melde dich an.'
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Zu dieser E-Mail gibt es schon ein Konto.'
  }
  if (normalized.includes('password')) return `Das Passwort ist zu kurz oder zu schwach.`
  return 'Die Anmeldung ist fehlgeschlagen. Versuch es noch einmal.'
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error && 'details' in error
}

function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}
