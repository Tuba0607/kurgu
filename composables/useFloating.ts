import type { CSSProperties, Ref } from 'vue'

interface FloatingOptions {
  /** Distance between the anchor and the floating element (px). */
  gap?: number
  /** Preferred maximum height (px); shrinks to the available space. */
  maxHeight?: number
  /** Match the anchor's width (lists) instead of a fixed width (calendar). */
  matchWidth?: boolean
}

/**
 * Positions a floating layer (list, calendar) next to its anchor with
 * `position: fixed`, so it is rendered above modals without making their body
 * scroll. Opens below the anchor and flips above when there is clearly more room
 * there. Use it with <Teleport to="body">.
 */
export function useFloating(anchor: Ref<HTMLElement | null>, open: Ref<boolean>, options: FloatingOptions = {}) {
  const { gap = 6, maxHeight = 280, matchWidth = true } = options
  const style = ref<CSSProperties>({})
  const placement = ref<'bottom' | 'top'>('bottom')

  function update() {
    const rect = anchor.value?.getBoundingClientRect()
    if (!rect) return
    const margin = 8
    const below = window.innerHeight - rect.bottom - gap - margin
    const above = rect.top - gap - margin
    placement.value = below >= Math.min(maxHeight, 200) || below >= above ? 'bottom' : 'top'
    const available = placement.value === 'bottom' ? below : above
    style.value = {
      position: 'fixed',
      left: `${Math.max(margin, Math.min(rect.left, window.innerWidth - margin - (matchWidth ? rect.width : 0)))}px`,
      ...(matchWidth && { width: `${rect.width}px` }),
      maxHeight: `${Math.max(120, Math.min(maxHeight, available))}px`,
      ...(placement.value === 'bottom'
        ? { top: `${rect.bottom + gap}px` }
        : { bottom: `${window.innerHeight - rect.top + gap}px` }),
    }
  }

  function onViewportChange() {
    if (open.value) update()
  }

  watch(open, (value) => {
    if (!import.meta.client) return
    if (value) {
      update()
      window.addEventListener('resize', onViewportChange)
      window.addEventListener('scroll', onViewportChange, true)
    }
    else {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('scroll', onViewportChange, true)
  })

  return { style, placement, update }
}
