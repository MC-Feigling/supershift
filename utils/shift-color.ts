import type { ShiftColor } from '~/types/plan'

export interface ShiftColorSwatch extends ShiftColor {
  label: string
}

export const SHIFT_COLOR_SWATCHES: readonly ShiftColorSwatch[] = [
  { background: '#3d4a34', color: '#d7e4c8', label: 'Moos' },
  { background: '#4a3228', color: '#f0c8b4', label: 'Rost' },
  { background: '#2d3d4f', color: '#c5d4e8', label: 'Nacht' },
  { background: '#4a4020', color: '#f0e0a0', label: 'Honig' },
  { background: '#3a2d4a', color: '#d8c8e8', label: 'Veilchen' },
  { background: '#2a403c', color: '#b8e0d4', label: 'Tanne' },
  { background: '#4a2830', color: '#f0c0c8', label: 'Wein' },
  { background: '#3a3a36', color: '#d8d4c8', label: 'Stein' },
]

export const SHIFT_COLOR_PALETTE: readonly ShiftColor[] = SHIFT_COLOR_SWATCHES

export function isShiftColorIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < SHIFT_COLOR_SWATCHES.length
}

export function hashShiftColorIndex(name: string): number {
  const normalized = name.trim().toLowerCase()
  let hash = 0
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33 + normalized.charCodeAt(index)) >>> 0
  }
  return hash % SHIFT_COLOR_SWATCHES.length
}

export function shiftColorFromIndex(index: number): ShiftColor {
  const swatch = SHIFT_COLOR_SWATCHES[index] ?? SHIFT_COLOR_SWATCHES[0]
  if (!swatch) throw new Error('shift palette miss')
  return { background: swatch.background, color: swatch.color }
}

export function shiftColor(name: string): ShiftColor {
  return shiftColorFromIndex(hashShiftColorIndex(name))
}

export function nextUnusedColorIndex(used: readonly number[]): number {
  const taken = new Set(used.filter(isShiftColorIndex))
  const free = SHIFT_COLOR_SWATCHES.findIndex((_, index) => !taken.has(index))
  return free === -1 ? 0 : free
}
