import { LONG_PRESS_MS, LONG_PRESS_MOVE_PX } from '~/utils/constants'

interface PressHoldHandlers<T> {
  onTap: (value: T) => void
  onHold: (value: T) => void
}

export function usePressHold<T>(handlers: PressHoldHandlers<T>) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let held = false
  let suppressClick = false

  function clearTimer(): void {
    if (!timer) return
    clearTimeout(timer)
    timer = null
  }

  function resetPointer(): void {
    clearTimer()
    pointerId = null
  }

  function movedTooFar(event: PointerEvent): boolean {
    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY
    return (deltaX * deltaX) + (deltaY * deltaY) > LONG_PRESS_MOVE_PX * LONG_PRESS_MOVE_PX
  }

  function onPointerDown(value: T, event: Event): void {
    if (!(event instanceof PointerEvent)) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    resetPointer()
    held = false
    suppressClick = false
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    const target = event.currentTarget
    if (target instanceof HTMLElement) target.setPointerCapture(event.pointerId)
    timer = setTimeout(() => {
      timer = null
      held = true
      suppressClick = true
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12)
      }
      handlers.onHold(value)
    }, LONG_PRESS_MS)
  }

  function onPointerMove(event: Event): void {
    if (!(event instanceof PointerEvent)) return
    if (pointerId !== event.pointerId || !timer) return
    if (movedTooFar(event)) clearTimer()
  }

  function onPointerUp(event: Event): void {
    if (!(event instanceof PointerEvent)) return
    if (pointerId !== event.pointerId) return
    resetPointer()
  }

  function onPointerCancel(): void {
    resetPointer()
  }

  function onClick(value: T, event: Event): void {
    if (suppressClick || held) {
      event.preventDefault()
      suppressClick = false
      held = false
      return
    }
    handlers.onTap(value)
  }

  function onContextMenu(value: T, event: Event): void {
    event.preventDefault()
    if (held) return
    resetPointer()
    held = true
    suppressClick = true
    handlers.onHold(value)
  }

  onBeforeUnmount(() => {
    resetPointer()
  })

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClick,
    onContextMenu,
  }
}
