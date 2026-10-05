import { describe, expect, it } from 'vitest'
import { INVITE_TOKEN_LENGTH, ROUTES, WEITER_QUERY } from '~/utils/constants'
import {
  invitePath,
  isInvitePath,
  isInviteRoute,
  isInviteToken,
  normalizeInviteToken,
  readInviteRedirect,
  withInviteRedirect,
} from '~/utils/invite'

const token = 'a'.repeat(INVITE_TOKEN_LENGTH)
const path = `${ROUTES.invite}/${token}`

describe('invite helpers', () => {
  it('accepts a 64-character hex token', () => {
    expect(isInviteToken(token)).toBe(true)
    expect(isInviteToken(token.toUpperCase())).toBe(true)
    expect(isInviteToken('not-a-token')).toBe(false)
    expect(isInviteToken(`${token}a`)).toBe(false)
  })

  it('builds and recognizes an invite path', () => {
    expect(invitePath(token.toUpperCase())).toBe(path)
    expect(isInvitePath(path)).toBe(true)
    expect(isInvitePath(`${ROUTES.invite}/../anmelden`)).toBe(false)
    expect(isInvitePath(`https://evil.example${path}`)).toBe(false)
    expect(isInviteRoute(`${ROUTES.invite}/broken`)).toBe(true)
    expect(isInviteRoute(ROUTES.share)).toBe(false)
  })

  it('keeps only safe weiter targets', () => {
    expect(readInviteRedirect(path)).toBe(path)
    expect(readInviteRedirect('https://evil.example')).toBeNull()
    expect(readInviteRedirect(`//evil.example${path}`)).toBeNull()
    expect(withInviteRedirect(ROUTES.signIn, path)).toBe(
      `${ROUTES.signIn}?${WEITER_QUERY}=${encodeURIComponent(path)}`,
    )
    expect(withInviteRedirect(ROUTES.signIn, '/kalender')).toBe(ROUTES.signIn)
  })

  it('normalizes tokens to lowercase', () => {
    expect(normalizeInviteToken(`  ${token.toUpperCase()}  `)).toBe(token)
  })
})
