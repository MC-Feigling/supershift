import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'
import type { Placement, PlacementDraft, PlanShare, ShiftType, InviteLookup } from '~/types/plan'
import { SHARE_CHANNEL, SHARE_STATUS } from '~/types/plan'
import { TABLES } from './constants'
import { AppError } from './errors'
import type { PushKeys } from './push'

type Client = SupabaseClient<Database>

const SHARE_COLUMNS = 'id, owner_id, owner_email, grantee_email, grantee_id, status, can_write, invite_channel, invite_token, created_at, revoked_at'

export async function fetchShiftTypes(client: Client, ownerId: string): Promise<ShiftType[]> {
  const { data, error } = await client
    .from(TABLES.shiftTypes)
    .select('id, owner_id, name, color_index, created_at')
    .eq('owner_id', ownerId)

  if (error) throw error
  return (data ?? []).map(mapShiftType).sort((left, right) => left.name.localeCompare(right.name, 'de'))
}

export async function fetchShiftTypesForOwners(client: Client, ownerIds: readonly string[]): Promise<ShiftType[]> {
  if (ownerIds.length === 0) return []
  const { data, error } = await client
    .from(TABLES.shiftTypes)
    .select('id, owner_id, name, color_index, created_at')
    .in('owner_id', [...ownerIds])

  if (error) throw error
  return (data ?? []).map(mapShiftType).sort((left, right) => left.name.localeCompare(right.name, 'de'))
}

export async function insertShiftType(client: Client, ownerId: string, name: string, colorIndex: number): Promise<void> {
  const { error } = await client.from(TABLES.shiftTypes).insert({ owner_id: ownerId, name, color_index: colorIndex })
  if (error) throw error
}

export async function updateShiftType(client: Client, shiftTypeId: string, name: string, colorIndex: number): Promise<void> {
  const { error } = await client.from(TABLES.shiftTypes).update({ name, color_index: colorIndex }).eq('id', shiftTypeId)
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
    .select(SHARE_COLUMNS)
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
    .select(SHARE_COLUMNS)
    .eq('grantee_id', granteeId)
    .eq('status', SHARE_STATUS.active)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).flatMap((row) => {
    const share = mapShare(row)
    return share ? [share] : []
  })
}

export async function insertShare(client: Client, ownerId: string, granteeEmail: string, canWrite: boolean): Promise<void> {
  const { error } = await client.from(TABLES.planShares).insert({
    owner_id: ownerId,
    grantee_email: granteeEmail,
    can_write: canWrite,
    invite_channel: SHARE_CHANNEL.email,
  })
  if (error) throw error
}

export async function insertLinkShare(client: Client, ownerId: string, canWrite: boolean): Promise<void> {
  const { error } = await client.from(TABLES.planShares).insert({
    owner_id: ownerId,
    can_write: canWrite,
    invite_channel: SHARE_CHANNEL.link,
  })
  if (error) throw error
}

export async function lookupInvite(client: Client, token: string): Promise<InviteLookup | null> {
  const { data, error } = await client.rpc('lookup_plan_invite', { share_token: token })
  if (error) throw error
  return mapInviteLookup(data)
}

export async function claimInvite(client: Client, token: string): Promise<void> {
  const { error } = await client.rpc('claim_plan_share', { share_token: token })
  if (error) throw error
}

export async function revokeShare(client: Client, shareId: string): Promise<void> {
  const { error } = await client
    .from(TABLES.planShares)
    .update({ status: SHARE_STATUS.revoked })
    .eq('id', shareId)

  if (error) throw error
}

export async function savePushSubscription(client: Client, userId: string, keys: PushKeys): Promise<void> {
  const { error: deleteError } = await client
    .from(TABLES.pushSubscriptions)
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', keys.endpoint)
  if (deleteError) throw deleteError
  const { error } = await client.from(TABLES.pushSubscriptions).insert({
    user_id: userId,
    endpoint: keys.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  })
  if (error) throw error
}

export async function deletePushSubscription(client: Client, userId: string, endpoint: string): Promise<void> {
  const { error } = await client
    .from(TABLES.pushSubscriptions)
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
  if (error) throw error
}

function mapShiftType(row: Database['public']['Tables']['shift_types']['Row']): ShiftType {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    colorIndex: row.color_index,
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

function mapShare(row: Database['public']['Tables']['plan_shares']['Row']): PlanShare | null {
  if (!isShareStatus(row.status) || !isShareChannel(row.invite_channel)) return null
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email,
    granteeEmail: row.grantee_email,
    granteeId: row.grantee_id,
    status: row.status,
    canWrite: row.can_write,
    inviteChannel: row.invite_channel,
    inviteToken: row.invite_token,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }
}

function mapInviteLookup(value: unknown): InviteLookup | null {
  const row = asJsonObject(value)
  if (!row) return null
  if (typeof row.owner_email !== 'string' || typeof row.status !== 'string') return null
  if (!isShareStatus(row.status)) return null
  if (typeof row.is_own !== 'boolean' || typeof row.grantee_is_self !== 'boolean' || typeof row.can_write !== 'boolean') {
    return null
  }
  return {
    ownerEmail: row.owner_email,
    status: row.status,
    isOwn: row.is_own,
    granteeIsSelf: row.grantee_is_self,
    canWrite: row.can_write,
  }
}

function asJsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
      return null
    } catch {
      return null
    }
  }
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

function isShareChannel(value: string): value is PlanShare['inviteChannel'] {
  return value === SHARE_CHANNEL.email || value === SHARE_CHANNEL.link
}

function isShareStatus(value: string): value is PlanShare['status'] {
  return value === SHARE_STATUS.pending || value === SHARE_STATUS.active || value === SHARE_STATUS.revoked
}

export function assertClient(client: Client | null): Client {
  if (!client) throw new AppError('Supabase ist nicht eingerichtet.')
  return client
}
