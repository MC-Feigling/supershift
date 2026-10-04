import type { ShiftColor } from '~/types/plan'

export const SHIFT_COLOR_PALETTE: readonly ShiftColor[] = [
  { background: '#3d4a34', color: '#d7e4c8' },
  { background: '#4a3228', color: '#f0c8b4' },
  { background: '#2d3d4f', color: '#c5d4e8' },
  { background: '#4a4020', color: '#f0e0a0' },
  { background: '#3a2d4a', color: '#d8c8e8' },
  { background: '#2a403c', color: '#b8e0d4' },
  { background: '#4a2830', color: '#f0c0c8' },
  { background: '#3a3a36', color: '#d8d4c8' },
]

export function shiftColor(name: string): ShiftColor {
  const normalized = name.trim().toLowerCase()
  let hash = 0
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33 + normalized.charCodeAt(index)) >>> 0
  }
  const color = SHIFT_COLOR_PALETTE[hash % SHIFT_COLOR_PALETTE.length]
  if (!color) throw new Error('shift palette miss')
  return color
}
