export const SHARE_STATUS = {
  pending: 'pending',
  active: 'active',
  revoked: 'revoked',
} as const

export type ShareStatus = (typeof SHARE_STATUS)[keyof typeof SHARE_STATUS]

export type PlanView = 'own' | 'shared'

export interface SessionUser {
  id: string
  email: string
}

export interface ShiftType {
  id: string
  ownerId: string
  name: string
  createdAt: string
}

export interface Placement {
  id: string
  ownerId: string
  shiftTypeId: string
  startsOn: string
  endsOn: string | null
  repeatsWeekly: boolean
  note: string | null
  createdAt: string
}

export interface PlanShare {
  id: string
  ownerId: string
  ownerEmail: string
  granteeEmail: string
  granteeId: string | null
  inviteToken: string | null
  status: ShareStatus
  createdAt: string
  revokedAt: string | null
}

export interface PlacementDraft {
  shiftTypeId: string
  startsOn: string
  repeatsWeekly: boolean
  endsOn: string | null
  note: string | null
}

export interface ShiftColor {
  background: string
  color: string
}

export interface DayChip {
  placementId: string
  name: string
  note: string | null
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
  name: string
  note: string | null
  background: string
  color: string
  detail: string
  removeLabel: string
}

export interface ShiftOption {
  id: string
  name: string
}
