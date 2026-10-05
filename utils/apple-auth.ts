import { APPLE_AUTH_ERROR, APPLE_AUTH_FROM, APPLE_AUTH_QUERY, ROUTES } from './constants'

export function appleReturnPath(from: unknown): string {
  return from === APPLE_AUTH_FROM.signUp ? ROUTES.signUp : ROUTES.signIn
}

export function appleStartPath(from: string): string {
  if (from === APPLE_AUTH_FROM.signUp) {
    return `${ROUTES.apple}?${APPLE_AUTH_QUERY.from}=${APPLE_AUTH_FROM.signUp}`
  }
  return ROUTES.apple
}

export function appleErrorLocation(from: unknown, code: string): string {
  return `${appleReturnPath(from)}?${APPLE_AUTH_QUERY.error}=${encodeURIComponent(code)}`
}

export function appleSignInError(code: unknown): string {
  if (code === APPLE_AUTH_ERROR.cancelled) return 'Anmeldung mit Apple abgebrochen.'
  if (code === APPLE_AUTH_ERROR.unavailable) return 'Anmeldung mit Apple ist noch nicht eingerichtet.'
  if (code === APPLE_AUTH_ERROR.failed) return 'Anmeldung mit Apple ist fehlgeschlagen. Versuch es noch einmal.'
  return ''
}

export function classifyAppleStartFailure(message: string): (typeof APPLE_AUTH_ERROR)[keyof typeof APPLE_AUTH_ERROR] {
  const normalized = message.toLowerCase()
  if (
    normalized.includes('not enabled')
    || normalized.includes('unsupported provider')
    || normalized.includes('redirect')
  ) {
    return APPLE_AUTH_ERROR.unavailable
  }
  return APPLE_AUTH_ERROR.failed
}

export function classifyAppleCallbackFailure(message: string): (typeof APPLE_AUTH_ERROR)[keyof typeof APPLE_AUTH_ERROR] {
  const normalized = message.toLowerCase()
  if (
    normalized.includes('access_denied')
    || normalized.includes('user_cancelled')
    || normalized.includes('user cancelled')
    || normalized.includes('user canceled')
  ) {
    return APPLE_AUTH_ERROR.cancelled
  }
  if (normalized.includes('not enabled') || normalized.includes('unsupported provider') || normalized.includes('redirect')) {
    return APPLE_AUTH_ERROR.unavailable
  }
  return APPLE_AUTH_ERROR.failed
}

export function firstQueryValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return ''
}
