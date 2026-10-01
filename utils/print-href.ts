import { PLAN_QUERY, PLAN_SOURCE, PRINT_VIEW, ROUTES } from './constants'

export function printHref(view: 'week' | 'month', iso: string, shared: boolean, ownerId: string | null): string {
  const params = new URLSearchParams()
  params.set(PLAN_QUERY.date, iso)
  params.set(PLAN_QUERY.plan, shared ? PLAN_SOURCE.shared : PLAN_SOURCE.own)
  if (shared && ownerId) params.set(PLAN_QUERY.owner, ownerId)
  const path = view === 'week' ? ROUTES.printWeek : ROUTES.printMonth
  return `${path}?${params.toString()}`
}

export function isPrintView(value: string): value is typeof PRINT_VIEW.week | typeof PRINT_VIEW.month {
  return value === PRINT_VIEW.week || value === PRINT_VIEW.month
}
