import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'
import type { Placement, PlacementDraft, PlanShare, ShiftType } from '~/types/plan'
import { SHARE_STATUS } from '~/types/plan'
import { TABLES } from './constants'
import { AppError } from './errors'

type Client = SupabaseClient<Database>

export async function fetchShiftTypes(client: Client, ownerId: string): Promise<ShiftType[]> {
  const { data, error } = await client
    .from(TABLES.shiftTypes)
    .select('id, owner_id, name, created_at')
    .eq('owner_id', ownerId)

  if (error) throw error
  return (data ?? []).map(mapShiftType).sort((left, right) => left.name.localeCompare(right.name, 'de'))
}

export async function fetchShiftTypesForOwners(client: Client, ownerIds: readonly string[]): Promise<ShiftType[]> {
  if (ownerIds.length === 0) return []
  const { data, error } = await client
    .from(TABLES.shiftTypes)
    .select('id, owner_id, name, created_at')
    .in('owner_id', [...ownerIds])

  if (error) throw error
  return (data ?? []).map(mapShiftType).sort((left, right) => left.name.localeCompare(right.name, 'de'))
}

export async function insertShiftType(client: Client, ownerId: string, name: string): Promise<void> {
  const { error } = await client.from(TABLES.shiftTypes).insert({ owner_id: ownerId, name })
  if (error) throw error
}

export async function updateShiftType(client: Client, shiftTypeId: string, name: string): Promise<void> {
  const { error } = await client.from(TABLES.shiftTypes).update({ name }).eq('id', shiftTypeId)
  if (error) throw error
}

export async function deleteShiftType(client: Client, shiftTypeId: string): Promise<void> {
  const { error } = await client.from(TABLES.shiftTypes).delete().eq('id', shiftTypeId)
  if (error) throw error
}

export async function fetchPlacements(client: Client, ownerId: string): Promise<Placement[]> {
  const { data, error } = await client
    .from(TABLES.placements)
    .select('id, owner_id, shift_type_id, starts_on, ends_on, repeats_weekly, note, created_at')
    .eq('owner_id', ownerId)

  if (error) throw error
  return (data ?? []).map(mapPlacement)
}

export async function fetchPlacementsForOwners(client: Client, ownerIds: readonly string[]): Promise<Placement[]> {
  if (ownerIds.length === 0) return []
  const { data, error } = await client
    .from(TABLES.placements)
    .select('id, owner_id, shift_type_id, starts_on, ends_on, repeats_weekly, note, created_at')
    .in('owner_id', [...ownerIds])

  if (error) throw error
  return (data ?? []).map(mapPlacement)
}

export async function insertPlacement(client: Client, ownerId: string, draft: PlacementDraft): Promise<void> {
  const { error } = await client.from(TABLES.placements).insert({
    owner_id: ownerId,
    shift_type_id: draft.shiftTypeId,
    starts_on: draft.startsOn,
    ends_on: draft.repeatsWeekly ? draft.endsOn : null,
    repeats_weekly: draft.repeatsWeekly,
    note: draft.note,
  })
  if (error) throw error
}

export async function deletePlacement(client: Client, placementId: string): Promise<void> {
  const { error } = await client.from(TABLES.placements).delete().eq('id', placementId)
  if (error) throw error
}

export async function fetchOutgoingShare(client: Client, ownerId: string): Promise<PlanShare | null> {
  const { data, error } = await client
    .from(TABLES.planShares)
    .select('id, owner_id, owner_email, grantee_email, grantee_id, invite_token, status, created_at, revoked_at')
    .eq('owner_id', ownerId)
    .in('status', [SHARE_STATUS.pending, SHARE_STATUS.active])
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapShare(data)
}

export async function fetchIncomingShares(client: Client, granteeId: string): Promise<PlanShare[]> {
  const { data, error } = await client
    .from(TABLES.planShares)
    .select('id, owner_id, owner_email, grantee_email, grantee_id, status, created_at, revoked_at')
    .eq('grantee_id', granteeId)
    .eq('status', SHARE_STATUS.active)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).flatMap((row) => {
    const share = mapShare(row)
    return share ? [share] : []
  })
}

export async function insertShare(client: Client, ownerId: string, granteeEmail: string): Promise<void> {
  const { error } = await client.from(TABLES.planShares).insert({
    owner_id: ownerId,
    grantee_email: granteeEmail,
  })
  if (error) throw error
}

export async function revokeShare(client: Client, shareId: string): Promise<void> {
  const { error } = await client
    .from(TABLES.planShares)
    .update({ status: SHARE_STATUS.revoked })
    .eq('id', shareId)

  if (error) throw error
}

function mapShiftType(row: Database['public']['Tables']['shift_types']['Row']): ShiftType {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    createdAt: row.created_at,
  }
}

function mapPlacement(row: Database['public']['Tables']['placements']['Row']): Placement {
  return {
    id: row.id,
    ownerId: row.owner_id,
    shiftTypeId: row.shift_type_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    repeatsWeekly: row.repeats_weekly,
    note: row.note,
    createdAt: row.created_at,
  }
}

interface ShareRow {
  id: string
  owner_id: string
  owner_email: string
  grantee_email: string
  grantee_id: string | null
  invite_token?: string
  status: string
  created_at: string
  revoked_at: string | null
}

function mapShare(row: ShareRow): PlanShare | null {
  if (!isShareStatus(row.status)) return null
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email,
    granteeEmail: row.grantee_email,
    granteeId: row.grantee_id,
    inviteToken: row.invite_token ?? null,
    status: row.status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }
}

function isShareStatus(value: string): value is PlanShare['status'] {
  return value === SHARE_STATUS.pending || value === SHARE_STATUS.active || value === SHARE_STATUS.revoked
}

export function assertClient(client: Client | null): Client {
  if (!client) throw new AppError('Supabase ist nicht eingerichtet.')
  return client
}
