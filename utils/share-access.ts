import type { PlanShare, PlanView } from '~/types/plan'

export function isReadOnlyView(view: PlanView, share: PlanShare | null): boolean {
  if (view !== 'shared') return false
  return share?.canWrite !== true
}

export function noticeRecipientId(
  writerId: string,
  share: Pick<PlanShare, 'ownerId' | 'granteeId' | 'canWrite'>,
): string | null {
  if (!share.granteeId) return null
  if (writerId === share.ownerId) return share.granteeId
  if (writerId === share.granteeId && share.canWrite) return share.ownerId
  return null
}

export function shareAccessLabel(canWrite: boolean): string {
  return canWrite ? 'lesen und schreiben' : 'nur lesen'
}
