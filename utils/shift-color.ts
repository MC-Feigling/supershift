import type { ShiftColor } from '~/types/plan'

export const SHIFT_COLOR_PALETTE: readonly ShiftColor[] = [
  { background: '#dce8df', color: '#143528' },
  { background: '#f3dfd4', color: '#6b2d22' },
  { background: '#d9e4f2', color: '#1d3557' },
  { background: '#f4e7c5', color: '#5c4814' },
  { background: '#e7dff3', color: '#3d2a5c' },
  { background: '#d8efe8', color: '#0f4f45' },
  { background: '#f8dce3', color: '#6e2438' },
  { background: '#e6e2d8', color: '#3f3a32' },
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
