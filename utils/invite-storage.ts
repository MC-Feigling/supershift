import { INVITE_TOKEN_STORAGE } from './constants'
import { isInviteToken } from './validation'

export function rememberInviteToken(token: string): void {
  if (!import.meta.client || !isInviteToken(token)) return
  sessionStorage.setItem(INVITE_TOKEN_STORAGE, token)
}

export function readInviteToken(): string | null {
  if (!import.meta.client) return null
  const value = sessionStorage.getItem(INVITE_TOKEN_STORAGE)
  if (!value || !isInviteToken(value)) return null
  return value
}

export function forgetInviteToken(): void {
  if (!import.meta.client) return
  sessionStorage.removeItem(INVITE_TOKEN_STORAGE)
}
