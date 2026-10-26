import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Database } from '~/types/database'
import type { InviteLookup, Placement, PlacementDraft, PlanShare, PlanView, SessionUser, ShiftType } from '~/types/plan'
import { PLAN_SYNC_DEBOUNCE_MS, ROUTES, SESSION_STATE_KEY, TABLES } from '~/utils/constants'
import { AppError, isSessionExpired, toGermanError } from '~/utils/errors'
import { queuePlanNotice } from '~/utils/plan-notice'
import { PLAN_NOTICE_KIND } from '~/utils/push'
import {
  deletePlacement,
  deleteShiftType,
  fetchIncomingShares,
  fetchOutgoingShare,
  fetchPlacements,
  fetchPlacementsForOwners,
  fetchShiftTypes,
  fetchShiftTypesForOwners,
  insertLinkShare,
  insertPlacement,
  insertShare,
  insertShiftType,
  lookupInvite,
  claimInvite,
  revokeShare,
  updateShiftType,
} from '~/utils/plan-api'
import { isInviteToken, normalizeInviteToken } from '~/utils/invite'
import { isReadOnlyView, preferredSharedOwnerId } from '~/utils/share-access'
import {
  isUuid,
  normalizeEmail,
  normalizeNote,
  normalizeShiftName,
  placementsConflict,
  validatePlacement,
  validateShareEmail,
  validateShiftColorIndex,
  validateShiftName,
} from '~/utils/validation'

type Client = SupabaseClient<Database>

interface PlanSnapshot {
  ownTypes: ShiftType[]
  ownPlacements: Placement[]
  outgoing: PlanShare | null
  incoming: PlanShare[]
  otherTypes: ShiftType[]
  otherPlacements: Placement[]
}

export const usePlanStore = defineStore('plan', () => {
  const shiftTypes = ref<ShiftType[]>([])
  const placements = ref<Placement[]>([])
  const sharedShiftTypes = ref<ShiftType[]>([])
  const sharedPlacements = ref<Placement[]>([])
  const outgoingShare = ref<PlanShare | null>(null)
  const incomingShares = ref<PlanShare[]>([])
  const selectedIncomingOwnerId = ref<string | null>(null)
  const view = ref<PlanView>('own')
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const errorMessage = ref<string | null>(null)
  const hasLoaded = ref(false)
  const isSaving = ref(false)
  const viewChosen = ref(false)
  let loadGeneration = 0
  let syncChannel: RealtimeChannel | null = null
  let syncKey = ''
  let reloadTimer: ReturnType<typeof setTimeout> | null = null

  const activeIncoming = computed(() => {
    const selected = incomingShares.value.find((share: PlanShare) => share.ownerId === selectedIncomingOwnerId.value)
    return selected ?? incomingShares.value[0] ?? null
  })

  const visibleShiftTypes = computed(() => {
    if (view.value === 'own') return shiftTypes.value
    const ownerId = activeIncoming.value?.ownerId
    if (!ownerId) return [] as ShiftType[]
    return sharedShiftTypes.value.filter((shiftType: ShiftType) => shiftType.ownerId === ownerId)
  })

  const visiblePlacements = computed(() => {
    if (view.value === 'own') return placements.value
    const ownerId = activeIncoming.value?.ownerId
    if (!ownerId) return [] as Placement[]
    return sharedPlacements.value.filter((placement: Placement) => placement.ownerId === ownerId)
  })

  const readOnly = computed(() => isReadOnlyView(view.value, activeIncoming.value))

  async function load(): Promise<void> {
    const client = requireClient()
    const user = readUser()
    if (!user) {
      status.value = 'error'
      errorMessage.value = 'Nicht angemeldet.'
      return
    }

    const generation = beginLoad()
    if (!hasLoaded.value) status.value = 'loading'
    errorMessage.value = null

    try {
      const snapshot = await fetchSnapshot(client, user.id)
      if (generation !== loadGeneration) return
      applySnapshot(snapshot)
      bindPlanSync(client, user)
      hasLoaded.value = true
      status.value = 'ready'
    } catch (error) {
      if (generation !== loadGeneration) return
      await handleExpired(error)
      status.value = 'error'
      errorMessage.value = toGermanError(error)
    }
  }

  function noteRemoteChange(): void {
    if (!hasLoaded.value) return
    scheduleExternalReload()
  }

  async function createShift(name: string, colorIndex: number): Promise<void> {
    const cleaned = normalizeShiftName(name)
    const nameError = validateShiftName(cleaned)
    if (nameError) throw new AppError(nameError)
    const colorError = validateShiftColorIndex(colorIndex)
    if (colorError) throw new AppError(colorError)
    if (shiftTypes.value.some((shiftType: ShiftType) => shiftType.name.toLowerCase() === cleaned.toLowerCase())) {
      throw new AppError('Diesen Namen gibt es schon.')
    }
    await mutate(async (client, user) => {
      await insertShiftType(client, user.id, cleaned, colorIndex)
    })
  }

  async function saveShift(shiftTypeId: string, name: string, colorIndex: number): Promise<void> {
    const cleaned = normalizeShiftName(name)
    const nameError = validateShiftName(cleaned)
    if (nameError) throw new AppError(nameError)
    const colorError = validateShiftColorIndex(colorIndex)
    if (colorError) throw new AppError(colorError)
    const duplicate = shiftTypes.value.some(
      (shiftType: ShiftType) => shiftType.id !== shiftTypeId && shiftType.name.toLowerCase() === cleaned.toLowerCase(),
    )
    if (duplicate) throw new AppError('Diesen Namen gibt es schon.')
    await mutate(async (client) => {
      await updateShiftType(client, shiftTypeId, cleaned, colorIndex)
    })
  }

  async function removeShift(shiftTypeId: string): Promise<void> {
    await mutate(async (client) => {
      await deleteShiftType(client, shiftTypeId)
    })
  }

  async function createPlacement(draft: PlacementDraft): Promise<void> {
    assertCanWrite()
    const ownerId = writingOwnerId()
    const cleaned: PlacementDraft = {
      ...draft,
      note: normalizeNote(draft.note),
    }
    const knownIds = visibleShiftTypes.value.map((shiftType: ShiftType) => shiftType.id)
    const draftError = validatePlacement(cleaned, knownIds)
    if (draftError) throw new AppError(draftError)
    if (placementsConflict(visiblePlacements.value, cleaned)) {
      throw new AppError('Diese Schicht liegt an einem dieser Tage schon.')
    }
    await mutate(async (client) => {
      await insertPlacement(client, ownerId, cleaned)
    })
    const shiftName = visibleShiftTypes.value.find((shiftType: ShiftType) => shiftType.id === cleaned.shiftTypeId)?.name
    if (shiftName) {
      queuePlanNotice({
        kind: PLAN_NOTICE_KIND.created,
        shiftName,
        startsOn: cleaned.startsOn,
        repeatsWeekly: cleaned.repeatsWeekly,
        endsOn: cleaned.endsOn,
        planOwnerId: ownerId,
      })
    }
  }

  async function removePlacement(placementId: string): Promise<void> {
    assertCanWrite()
    const ownerId = writingOwnerId()
    const placement = visiblePlacements.value.find((entry: Placement) => entry.id === placementId)
    const shiftName = placement
      ? visibleShiftTypes.value.find((shiftType: ShiftType) => shiftType.id === placement.shiftTypeId)?.name
      : undefined
    await mutate(async (client) => {
      await deletePlacement(client, placementId)
    })
    if (placement && shiftName) {
      queuePlanNotice({
        kind: PLAN_NOTICE_KIND.removed,
        shiftName,
        startsOn: placement.startsOn,
        repeatsWeekly: placement.repeatsWeekly,
        endsOn: placement.endsOn,
        planOwnerId: ownerId,
      })
    }
  }

  async function invite(email: string, canWrite: boolean): Promise<void> {
    const user = readUser()
    if (!user) throw new AppError('Nicht angemeldet.')
    const emailError = validateShareEmail(email, user.email)
    if (emailError) throw new AppError(emailError)
    if (outgoingShare.value) throw new AppError('Es gibt schon eine offene Freigabe. Zieh sie zuerst zurück.')
    await mutate(async (client, currentUser) => {
      await insertShare(client, currentUser.id, normalizeEmail(email), canWrite)
    })
  }

  async function createLinkShare(canWrite: boolean): Promise<void> {
    if (outgoingShare.value) throw new AppError('Es gibt schon eine offene Freigabe. Zieh sie zuerst zurück.')
    await mutate(async (client, currentUser) => {
      await insertLinkShare(client, currentUser.id, canWrite)
    })
  }

  async function lookupShareInvite(token: string): Promise<InviteLookup | null> {
    if (!isInviteToken(token)) return null
    const client = requireClient()
    try {
      return await lookupInvite(client, normalizeInviteToken(token))
    } catch (error) {
      await handleExpired(error)
      throw new AppError(toGermanError(error))
    }
  }

  async function acceptInvite(token: string): Promise<void> {
    if (!isInviteToken(token)) throw new AppError('Dieser Link gilt nicht.')
    await mutate(async (client) => {
      await claimInvite(client, normalizeInviteToken(token))
    })
    showSharedPlan()
  }

  async function revoke(): Promise<void> {
    const share = outgoingShare.value
    if (!share) throw new AppError('Es gibt keine offene Freigabe.')
    await mutate(async (client) => {
      await revokeShare(client, share.id)
    })
  }

  function showOwnPlan(): void {
    viewChosen.value = true
    view.value = 'own'
  }

  function showSharedPlan(ownerId?: string): void {
    if (incomingShares.value.length === 0) return
    viewChosen.value = true
    if (ownerId) selectedIncomingOwnerId.value = ownerId
    view.value = 'shared'
  }

  async function mutate(work: (client: Client, user: SessionUser) => Promise<void>): Promise<void> {
    const client = requireClient()
    const user = readUser()
    if (!user) throw new AppError('Nicht angemeldet.')
    isSaving.value = true
    try {
      await work(client, user)
      await reloadAfterWrite(client, user)
    } catch (error) {
      await handleExpired(error)
      throw new AppError(toGermanError(error))
    } finally {
      isSaving.value = false
    }
  }

  async function reloadAfterWrite(client: Client, user: SessionUser): Promise<void> {
    const generation = beginLoad()
    const snapshot = await fetchSnapshot(client, user.id)
    if (generation !== loadGeneration) return
    applySnapshot(snapshot)
    bindPlanSync(client, user)
    hasLoaded.value = true
    status.value = 'ready'
    errorMessage.value = null
  }

  function beginLoad(): number {
    loadGeneration += 1
    return loadGeneration
  }

  async function fetchSnapshot(client: Client, userId: string): Promise<PlanSnapshot> {
    const [ownTypes, ownPlacements, outgoing, incoming] = await Promise.all([
      fetchShiftTypes(client, userId),
      fetchPlacements(client, userId),
      fetchOutgoingShare(client, userId),
      fetchIncomingShares(client, userId),
    ])
    const ownerIds = incoming.map((share) => share.ownerId)
    const [otherTypes, otherPlacements] = await Promise.all([
      fetchShiftTypesForOwners(client, ownerIds),
      fetchPlacementsForOwners(client, ownerIds),
    ])
    return { ownTypes, ownPlacements, outgoing, incoming, otherTypes, otherPlacements }
  }

  function applySnapshot(snapshot: PlanSnapshot): void {
    shiftTypes.value = snapshot.ownTypes
    placements.value = snapshot.ownPlacements
    outgoingShare.value = snapshot.outgoing
    incomingShares.value = snapshot.incoming
    sharedShiftTypes.value = snapshot.otherTypes
    sharedPlacements.value = snapshot.otherPlacements
    if (!snapshot.incoming.some((share) => share.ownerId === selectedIncomingOwnerId.value)) {
      selectedIncomingOwnerId.value = snapshot.incoming[0]?.ownerId ?? null
    }
    if (view.value === 'shared' && snapshot.incoming.length === 0) view.value = 'own'
    if (viewChosen.value) return
    const sharedOwnerId = preferredSharedOwnerId(snapshot.outgoing, snapshot.incoming)
    if (!sharedOwnerId) {
      view.value = 'own'
      return
    }
    selectedIncomingOwnerId.value = sharedOwnerId
    view.value = 'shared'
  }

  function scheduleExternalReload(): void {
    if (reloadTimer) clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => {
      reloadTimer = null
      if (isSaving.value) {
        scheduleExternalReload()
        return
      }
      void load()
    }, PLAN_SYNC_DEBOUNCE_MS)
  }

  function bindPlanSync(client: Client, user: SessionUser): void {
    if (!import.meta.client) return
    const ownerIds = [...new Set([user.id, ...incomingShares.value.map((share) => share.ownerId)])]
      .filter((ownerId) => isUuid(ownerId))
      .sort()
    const key = ownerIds.join(',')
    if (syncChannel && syncKey === key) return
    if (syncChannel) void client.removeChannel(syncChannel)
    syncKey = key
    const channel = client.channel(`plan-sync:${user.id}`)
    for (const ownerId of ownerIds) {
      const filter = `owner_id=eq.${ownerId}`
      channel.on('postgres_changes', { event: '*', schema: 'public', table: TABLES.placements, filter }, () => {
        scheduleExternalReload()
      })
      channel.on('postgres_changes', { event: '*', schema: 'public', table: TABLES.shiftTypes, filter }, () => {
        scheduleExternalReload()
      })
    }
    syncChannel = channel.subscribe()
  }

  function assertCanWrite(): void {
    if (readOnly.value) throw new AppError('Diesen Plan kannst du nur lesen.')
  }

  function writingOwnerId(): string {
    const user = readUser()
    if (!user) throw new AppError('Nicht angemeldet.')
    if (view.value === 'own') return user.id
    const ownerId = activeIncoming.value?.ownerId
    if (!ownerId) throw new AppError('Diesen Plan kannst du nur lesen.')
    return ownerId
  }

  function requireClient(): Client {
    const client = useNuxtApp().$supabase
    if (!client) throw new AppError('Supabase ist nicht eingerichtet.')
    return client
  }

  function readUser(): SessionUser | null {
    return useState<SessionUser | null>(SESSION_STATE_KEY).value
  }

  async function handleExpired(error: unknown): Promise<void> {
    if (!isSessionExpired(error)) return
    const sessionUser = useState<SessionUser | null>(SESSION_STATE_KEY)
    sessionUser.value = null
    await navigateTo(ROUTES.signIn)
  }

  return {
    shiftTypes,
    placements,
    sharedShiftTypes,
    sharedPlacements,
    outgoingShare,
    incomingShares,
    selectedIncomingOwnerId,
    view,
    status,
    errorMessage,
    hasLoaded,
    isSaving,
    activeIncoming,
    visibleShiftTypes,
    visiblePlacements,
    readOnly,
    load,
    noteRemoteChange,
    createShift,
    saveShift,
    removeShift,
    createPlacement,
    removePlacement,
    invite,
    createLinkShare,
    lookupShareInvite,
    acceptInvite,
    revoke,
    showOwnPlan,
    showSharedPlan,
  }
})
