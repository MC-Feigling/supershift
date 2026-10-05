import { INVITE_TOKEN_LENGTH, ROUTES, WEITER_QUERY } from './constants'

const TOKEN_PATTERN = new RegExp(`^[0-9a-f]{${INVITE_TOKEN_LENGTH}}$`)

export function normalizeInviteToken(value: string): string {
  return value.trim().toLowerCase()
}

export function isInviteToken(value: string): boolean {
  return TOKEN_PATTERN.test(normalizeInviteToken(value))
}

export function invitePath(token: string): string {
  return `${ROUTES.invite}/${normalizeInviteToken(token)}`
}

export function isInviteRoute(path: string): boolean {
  return path.startsWith(`${ROUTES.invite}/`)
}

export function isInvitePath(path: string): boolean {
  if (!path.startsWith(`${ROUTES.invite}/`)) return false
  const token = path.slice(ROUTES.invite.length + 1)
  return isInviteToken(token) && !token.includes('/')
}

export function readInviteRedirect(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return isInvitePath(value) ? value : null
}

export function withInviteRedirect(path: string, weiter: string | null): string {
  if (!weiter || !isInvitePath(weiter)) return path
  return `${path}?${WEITER_QUERY}=${encodeURIComponent(weiter)}`
}
