import { LONG_PRESS_MS, LONG_PRESS_MOVE_PX, PRESS_HOLD_LOCK_CLASS } from '~/utils/constants'

interface PressHoldHandlers<T> {
  onTap: (value: T) => void
  onHold: (value: T) => void
}

const TOUCH_LISTENER: AddEventListenerOptions = { capture: true, passive: false }

export function usePressHold<T>(handlers: PressHoldHandlers<T>) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let lastClientY = 0
  let held = false
  let moved = false
  let suppressClick = false
  let locked = false
  let activeValue: T | null = null
  let boundEl: HTMLElement | null = null
  let readValue: ((event: Event) => T | null) | null = null

  function clearTimer(): void {
    if (!timer) return
    clearTimeout(timer)
    timer = null
  }

  function clearSelection(): void {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    selection.removeAllRanges()
  }

  function lockNative(): void {
    if (locked) {
      clearSelection()
      return
    }
    locked = true
    document.documentElement.classList.add(PRESS_HOLD_LOCK_CLASS)
    document.addEventListener('selectionchange', clearSelection)
    clearSelection()
  }

  function unlockNative(): void {
    if (!locked) return
    locked = false
    document.documentElement.classList.remove(PRESS_HOLD_LOCK_CLASS)
    document.removeEventListener('selectionchange', clearSelection)
  }

  function resetPointer(): void {
    clearTimer()
    pointerId = null
    activeValue = null
  }

  function endGesture(): void {
    resetPointer()
    unlockNative()
  }

  function distanceFromStart(x: number, y: number): boolean {
    const deltaX = x - startX
    const deltaY = y - startY
    return (deltaX * deltaX) + (deltaY * deltaY) > LONG_PRESS_MOVE_PX * LONG_PRESS_MOVE_PX
  }

  function beginGesture(value: T, x: number, y: number, id: number | null): void {
    resetPointer()
    held = false
    moved = false
    suppressClick = false
    pointerId = id
    activeValue = value
    startX = x
    startY = y
    lastClientY = y
    lockNative()
    timer = setTimeout(() => {
      timer = null
      if (activeValue === null) return
      fireHold(activeValue)
    }, LONG_PRESS_MS)
  }

  function fireHold(value: T): void {
    held = true
    suppressClick = true
    clearTimer()
    clearSelection()
    handlers.onHold(value)
  }

  function finishTap(value: T): void {
    suppressClick = true
    handlers.onTap(value)
  }

  function onPointerDown(value: T, event: Event): void {
    if (!(event instanceof PointerEvent)) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    beginGesture(value, event.clientX, event.clientY, event.pointerId)
    if (event.pointerType !== 'mouse') return
    const target = event.currentTarget
    if (target instanceof HTMLElement) target.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: Event): void {
    if (!(event instanceof PointerEvent)) return
    if (pointerId !== event.pointerId || event.pointerType === 'touch') return
    if (!timer) return
    if (!distanceFromStart(event.clientX, event.clientY)) return
    moved = true
    clearTimer()
  }

  function onPointerUp(event: Event): void {
    if (!(event instanceof PointerEvent)) return
    if (pointerId !== event.pointerId) return
    const value = activeValue
    const tap = event.pointerType !== 'mouse' && !held && !moved
    endGesture()
    if (tap && value !== null) finishTap(value)
  }

  function onPointerCancel(event?: Event): void {
    if (event instanceof PointerEvent && event.pointerType === 'touch') return
    endGesture()
    held = false
    moved = false
    suppressClick = false
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
    clearSelection()
    if (held) return
    fireHold(value)
  }

  function onTouchStart(event: Event): void {
    if (!(event instanceof TouchEvent)) return
    if (event.touches.length !== 1) return
    event.preventDefault()
    lockNative()
    if (timer || activeValue !== null) return
    const touch = event.touches[0]
    const value = readValue?.(event)
    if (!touch || value === null || value === undefined) return
    beginGesture(value, touch.clientX, touch.clientY, null)
  }

  function onTouchMove(event: Event): void {
    if (!(event instanceof TouchEvent)) return
    const touch = event.touches[0]
    if (!touch) return
    event.preventDefault()
    if (held) return
    if (distanceFromStart(touch.clientX, touch.clientY)) {
      moved = true
      clearTimer()
    }
    if (!moved) {
      lastClientY = touch.clientY
      return
    }
    window.scrollBy(0, lastClientY - touch.clientY)
    lastClientY = touch.clientY
  }

  function onTouchEnd(event: Event): void {
    if (!(event instanceof TouchEvent)) return
    event.preventDefault()
    const value = activeValue
    const tap = !held && !moved
    endGesture()
    if (tap && value !== null) finishTap(value)
  }

  function onSelectStart(event: Event): void {
    event.preventDefault()
  }

  function attach(el: HTMLElement, decode: (event: Event) => T | null): void {
    detach()
    boundEl = el
    readValue = decode
    el.addEventListener('touchstart', onTouchStart, TOUCH_LISTENER)
    el.addEventListener('touchmove', onTouchMove, TOUCH_LISTENER)
    el.addEventListener('touchend', onTouchEnd, TOUCH_LISTENER)
    el.addEventListener('touchcancel', onTouchEnd, TOUCH_LISTENER)
    el.addEventListener('selectstart', onSelectStart, TOUCH_LISTENER)
  }

  function detach(): void {
    if (!boundEl) return
    boundEl.removeEventListener('touchstart', onTouchStart, TOUCH_LISTENER)
    boundEl.removeEventListener('touchmove', onTouchMove, TOUCH_LISTENER)
    boundEl.removeEventListener('touchend', onTouchEnd, TOUCH_LISTENER)
    boundEl.removeEventListener('touchcancel', onTouchEnd, TOUCH_LISTENER)
    boundEl.removeEventListener('selectstart', onSelectStart, TOUCH_LISTENER)
    boundEl = null
    readValue = null
  }

  onBeforeUnmount(() => {
    detach()
    endGesture()
  })

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClick,
    onContextMenu,
    attach,
    detach,
  }
}
