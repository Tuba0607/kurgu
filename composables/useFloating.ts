import type { CSSProperties, Ref } from 'vue'

interface FloatingOptions {
  /** Distance between the anchor and the floating element (px). */
  gap?: number
  /** Preferred maximum height (px); shrinks to the available space. */
  maxHeight?: number
  /** Match the anchor's width (lists) instead of a fixed width (calendar). */
  matchWidth?: boolean
  /**
   * For layers that should not be cut (calendar): open below only when the whole
   * layer fits, otherwise above; inside a modal the footer is the bottom limit.
   * Pass the floating element so its natural height can be measured.
   */
  avoidClipping?: boolean
  floating?: Ref<HTMLElement | null>
}

/**
 * Positions a floating layer (list, calendar) next to its anchor with
 * `position: fixed`, so it is rendered above modals without making their body
 * scroll. Opens below the anchor and flips above when there is clearly more room
 * there. Use it with <Teleport to="body">.
 */
export function useFloating(anchor: Ref<HTMLElement | null>, open: Ref<boolean>, options: FloatingOptions = {}) {
  const { gap = 6, maxHeight = 280, matchWidth = true, avoidClipping = false, floating } = options
  const style = ref<CSSProperties>({})
  const placement = ref<'bottom' | 'top'>('bottom')

  function update() {
    const rect = anchor.value?.getBoundingClientRect()
    if (!rect) return
    const margin = 8
    // Inside a modal, a layer must not cover the footer's buttons.
    const footer = avoidClipping ? anchor.value?.closest('[role="dialog"]')?.querySelector('footer') : null
    const bottomLimit = footer ? footer.getBoundingClientRect().top : window.innerHeight
    const below = bottomLimit - rect.bottom - gap - margin
    const above = rect.top - gap - margin
    if (avoidClipping) {
      const needed = Math.min(floating?.value?.scrollHeight || maxHeight, maxHeight)
      placement.value = below >= needed ? 'bottom' : above >= needed ? 'top' : below >= above ? 'bottom' : 'top'
    }
    else {
      placement.value = below >= Math.min(maxHeight, 200) || below >= above ? 'bottom' : 'top'
    }
    const available = placement.value === 'bottom' ? below : above
    // Keep the whole layer inside the viewport horizontally too.
    const layerWidth = matchWidth ? rect.width : (floating?.value?.offsetWidth ?? 0)
    style.value = {
      position: 'fixed',
      left: `${Math.max(margin, Math.min(rect.left, window.innerWidth - margin - layerWidth))}px`,
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
