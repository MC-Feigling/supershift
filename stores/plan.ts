import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Placement, PlacementDraft, PlanShare, PlanView, SessionUser, ShiftType } from '~/types/plan'
import { ROUTES, SESSION_STATE_KEY } from '~/utils/constants'
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
  insertPlacement,
  insertShare,
  insertShiftType,
  revokeShare,
  updateShiftType,
} from '~/utils/plan-api'
import {
  normalizeEmail,
  normalizeNote,
  normalizeShiftName,
  placementsConflict,
  validatePlacement,
  validateShareEmail,
  validateShiftName,
} from '~/utils/validation'

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

  const readOnly = computed(() => view.value === 'shared')

  async function load(): Promise<void> {
    const client = requireClient()
    const user = readUser()
    if (!user) {
      status.value = 'error'
      errorMessage.value = 'Nicht angemeldet.'
      return
    }

    if (!hasLoaded.value) status.value = 'loading'
    errorMessage.value = null

    try {
      const [ownTypes, ownPlacements, outgoing, incoming] = await Promise.all([
        fetchShiftTypes(client, user.id),
        fetchPlacements(client, user.id),
        fetchOutgoingShare(client, user.id),
        fetchIncomingShares(client, user.id),
      ])
      const ownerIds = incoming.map((share) => share.ownerId)
      const [otherTypes, otherPlacements] = await Promise.all([
        fetchShiftTypesForOwners(client, ownerIds),
        fetchPlacementsForOwners(client, ownerIds),
      ])

      shiftTypes.value = ownTypes
      placements.value = ownPlacements
      outgoingShare.value = outgoing
      incomingShares.value = incoming
      sharedShiftTypes.value = otherTypes
      sharedPlacements.value = otherPlacements
      if (!incoming.some((share) => share.ownerId === selectedIncomingOwnerId.value)) {
        selectedIncomingOwnerId.value = incoming[0]?.ownerId ?? null
      }
      if (view.value === 'shared' && incoming.length === 0) view.value = 'own'
      hasLoaded.value = true
      status.value = 'ready'
    } catch (error) {
      await handleExpired(error)
      status.value = 'error'
      errorMessage.value = toGermanError(error)
    }
  }

  async function createShift(name: string): Promise<void> {
    const cleaned = normalizeShiftName(name)
    const nameError = validateShiftName(cleaned)
    if (nameError) throw new AppError(nameError)
    if (shiftTypes.value.some((shiftType: ShiftType) => shiftType.name.toLowerCase() === cleaned.toLowerCase())) {
      throw new AppError('Diesen Namen gibt es schon.')
    }
    await mutate(async (client, user) => {
      await insertShiftType(client, user.id, cleaned)
    })
  }

  async function renameShift(shiftTypeId: string, name: string): Promise<void> {
    const cleaned = normalizeShiftName(name)
    const nameError = validateShiftName(cleaned)
    if (nameError) throw new AppError(nameError)
    const duplicate = shiftTypes.value.some(
      (shiftType: ShiftType) => shiftType.id !== shiftTypeId && shiftType.name.toLowerCase() === cleaned.toLowerCase(),
    )
    if (duplicate) throw new AppError('Diesen Namen gibt es schon.')
    await mutate(async (client) => {
      await updateShiftType(client, shiftTypeId, cleaned)
    })
  }

  async function removeShift(shiftTypeId: string): Promise<void> {
    await mutate(async (client) => {
      await deleteShiftType(client, shiftTypeId)
    })
  }

  async function createPlacement(draft: PlacementDraft): Promise<void> {
    assertOwnPlan()
    const cleaned: PlacementDraft = {
      ...draft,
      note: normalizeNote(draft.note),
    }
    const knownIds = shiftTypes.value.map((shiftType: ShiftType) => shiftType.id)
    const draftError = validatePlacement(cleaned, knownIds)
    if (draftError) throw new AppError(draftError)
    if (placementsConflict(placements.value, cleaned)) {
      throw new AppError('Diese Schicht liegt an einem dieser Tage schon.')
    }
    await mutate(async (client, user) => {
      await insertPlacement(client, user.id, cleaned)
    })
    const shiftName = shiftTypes.value.find((shiftType: ShiftType) => shiftType.id === cleaned.shiftTypeId)?.name
    if (shiftName) {
      queuePlanNotice({
        kind: PLAN_NOTICE_KIND.created,
        shiftName,
        startsOn: cleaned.startsOn,
        repeatsWeekly: cleaned.repeatsWeekly,
        endsOn: cleaned.endsOn,
      })
    }
  }

  async function removePlacement(placementId: string): Promise<void> {
    assertOwnPlan()
    const placement = placements.value.find((entry: Placement) => entry.id === placementId)
    const shiftName = placement
      ? shiftTypes.value.find((shiftType: ShiftType) => shiftType.id === placement.shiftTypeId)?.name
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
      })
    }
  }

  async function invite(email: string): Promise<void> {
    const user = readUser()
    if (!user) throw new AppError('Nicht angemeldet.')
    const emailError = validateShareEmail(email, user.email)
    if (emailError) throw new AppError(emailError)
    if (outgoingShare.value) throw new AppError('Es gibt schon eine offene Freigabe. Zieh sie zuerst zurück.')
    await mutate(async (client, currentUser) => {
      await insertShare(client, currentUser.id, normalizeEmail(email))
    })
  }

  async function revoke(): Promise<void> {
    const share = outgoingShare.value
    if (!share) throw new AppError('Es gibt keine offene Freigabe.')
    await mutate(async (client) => {
      await revokeShare(client, share.id)
    })
  }

  function showOwnPlan(): void {
    view.value = 'own'
  }

  function showSharedPlan(ownerId?: string): void {
    if (incomingShares.value.length === 0) return
    if (ownerId) selectedIncomingOwnerId.value = ownerId
    view.value = 'shared'
  }

  async function mutate(work: (client: NonNullable<ReturnType<typeof useNuxtApp>['$supabase']>, user: SessionUser) => Promise<void>): Promise<void> {
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

  async function reloadAfterWrite(
    client: NonNullable<ReturnType<typeof useNuxtApp>['$supabase']>,
    user: SessionUser,
  ): Promise<void> {
    const [ownTypes, ownPlacements, outgoing, incoming] = await Promise.all([
      fetchShiftTypes(client, user.id),
      fetchPlacements(client, user.id),
      fetchOutgoingShare(client, user.id),
      fetchIncomingShares(client, user.id),
    ])
    const ownerIds = incoming.map((share) => share.ownerId)
    const [otherTypes, otherPlacements] = await Promise.all([
      fetchShiftTypesForOwners(client, ownerIds),
      fetchPlacementsForOwners(client, ownerIds),
    ])
    shiftTypes.value = ownTypes
    placements.value = ownPlacements
    outgoingShare.value = outgoing
    incomingShares.value = incoming
    sharedShiftTypes.value = otherTypes
    sharedPlacements.value = otherPlacements
    hasLoaded.value = true
    status.value = 'ready'
    errorMessage.value = null
  }

  function assertOwnPlan(): void {
    if (view.value === 'shared') throw new AppError('Diesen Plan kannst du nur lesen.')
  }

  function requireClient() {
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
    createShift,
    renameShift,
    removeShift,
    createPlacement,
    removePlacement,
    invite,
    revoke,
    showOwnPlan,
    showSharedPlan,
  }
})
