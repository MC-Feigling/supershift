export const SHARE_STATUS = {
  pending: 'pending',
  active: 'active',
  revoked: 'revoked',
} as const

export type ShareStatus = (typeof SHARE_STATUS)[keyof typeof SHARE_STATUS]

export const SHARE_CHANNEL = {
  email: 'email',
  link: 'link',
} as const

export type ShareChannel = (typeof SHARE_CHANNEL)[keyof typeof SHARE_CHANNEL]

export type PlanView = 'own' | 'shared'

export interface SessionUser {
  id: string
  email: string
}

export interface ShiftType {
  id: string
  ownerId: string
  name: string
  colorIndex: number
  createdAt: string
}

export interface Placement {
  id: string
  ownerId: string
  shiftTypeId: string
  startsOn: string
  endsOn: string | null
  repeatsWeekly: boolean
  note: string
  createdAt: string
}

export interface PlanShare {
  id: string
  ownerId: string
  ownerEmail: string
  granteeEmail: string | null
  granteeId: string | null
  status: ShareStatus
  canWrite: boolean
  inviteChannel: ShareChannel
  inviteToken: string | null
  createdAt: string
  revokedAt: string | null
}

export interface InviteLookup {
  ownerEmail: string
  status: ShareStatus
  isOwn: boolean
  granteeIsSelf: boolean
  canWrite: boolean
}

export interface PlacementDraft {
  shiftTypeId: string
  startsOn: string
  repeatsWeekly: boolean
  endsOn: string | null
  note: string
}

export interface ShiftColor {
  background: string
  color: string
}

export interface DayChip {
  placementId: string
  name: string
  background: string
  color: string
}

export interface CalendarCell {
  iso: string
  dayNumber: number
  inMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isSelected: boolean
  label: string
  chips: DayChip[]
  hiddenChipLabel: string | null
}

export interface DayEntry {
  placementId: string
  shiftTypeId: string
  name: string
  background: string
  color: string
  detail: string
  note: string
  removeLabel: string
}

export interface ShiftOption {
  id: string
  name: string
  colorIndex: number
}
