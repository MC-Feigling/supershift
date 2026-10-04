import type { ShiftColor } from '~/types/plan'

export const SHIFT_COLOR_PALETTE: readonly ShiftColor[] = [
  { background: '#2c3136', color: '#f3f0ea' },
  { background: '#b8432f', color: '#f7f1ea' },
  { background: '#8a5a12', color: '#f6efe2' },
  { background: '#4e555c', color: '#f3f0ea' },
  { background: '#1c1b19', color: '#f3f0ea' },
  { background: '#6e4a3a', color: '#f6efe6' },
  { background: '#3c4744', color: '#f3f0ea' },
  { background: '#5c5346', color: '#f4efe6' },
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
