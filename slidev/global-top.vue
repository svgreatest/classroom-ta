<script setup lang="ts">
// In the Classroom TA app the laser pointer is an overlay above this iframe
// (src/components/drawing/DrawingCanvasOverlay.tsx), so the deck never sees the
// mouse directly. The app forwards quick taps and mouse-wheel scrolls here;
// replay them on whatever is under that point so links, buttons, quiz options
// and scrollable code blocks still work.
import { onMounted, onBeforeUnmount } from 'vue'

// Nearest ancestor that can actually scroll in the wheel's direction
function scrollableAt(el: HTMLElement | null, dx: number, dy: number): HTMLElement | null {
  for (; el; el = el.parentElement) {
    const style = getComputedStyle(el)
    const canY = dy !== 0 && /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight
    const canX = dx !== 0 && /(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth
    if (canY || canX) return el
  }
  return null
}

function onMessage(e: MessageEvent) {
  const d = e.data
  if (!d || d.target !== 'ta-laser') return
  const el = document.elementFromPoint(d.x, d.y) as HTMLElement | null
  if (!el) return
  if (d.type === 'wheel') {
    const target = scrollableAt(el, d.dx, d.dy) ?? document.scrollingElement as HTMLElement | null
    target?.scrollBy({ left: d.dx, top: d.dy })
    el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: d.x, clientY: d.y, deltaX: d.dx, deltaY: d.dy }))
    return
  }
  if (d.type !== 'tap') return
  const init = { bubbles: true, cancelable: true, composed: true, clientX: d.x, clientY: d.y, button: 0, view: window }
  el.dispatchEvent(new PointerEvent('pointerdown', { ...init, pointerType: 'mouse', isPrimary: true }))
  el.dispatchEvent(new MouseEvent('mousedown', init))
  el.dispatchEvent(new PointerEvent('pointerup', { ...init, pointerType: 'mouse', isPrimary: true }))
  el.dispatchEvent(new MouseEvent('mouseup', init))
  el.click()
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <span style="display: none" />
</template>

<style>
/* Hide Slidev's built-in red laser pointer */
.laser-pointer { display: none !important; }
</style>
