import type { Ref } from 'vue'

let lockCount = 0
let saved: { x: number, y: number, body: string, html: string } | null = null

/**
 * Prevents background scrolling (vertical and horizontal) while overlays (modal,
 * mobile menu, bottom sheet) are open.
 *
 * `overflow: hidden` alone does not stop touch scrolling in iOS Safari, so the body
 * is also pinned with `position: fixed` at the current scroll offset and restored
 * to the same position afterwards.
 */
export function useScrollLock(active: Ref<boolean>) {
  let locked = false

  function lock() {
    if (locked) return
    locked = true
    if (lockCount++ > 0) return
    const { body, documentElement: html } = document
    saved = { x: window.scrollX, y: window.scrollY, body: body.style.cssText, html: html.style.cssText }
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    Object.assign(body.style, {
      position: 'fixed',
      top: `-${saved.y}px`,
      left: `-${saved.x}px`,
      right: '0',
      width: '100%',
      overflow: 'hidden',
    })
  }

  function unlock() {
    if (!locked) return
    locked = false
    if (--lockCount > 0 || !saved) return
    document.body.style.cssText = saved.body
    document.documentElement.style.cssText = saved.html
    window.scrollTo(saved.x, saved.y)
    saved = null
  }

  onMounted(() => {
    watch(active, isActive => (isActive ? lock() : unlock()), { immediate: true })
  })

  onBeforeUnmount(unlock)
}
