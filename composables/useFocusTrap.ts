import type { Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface FocusTrapOptions {
  onEscape?: () => void
  /** Returns the element to focus on activation; defaults to the first focusable element. */
  getInitialFocus?: () => HTMLElement | null | undefined
}

/**
 * Keeps keyboard focus inside `container` while `active` is true, closes on
 * Escape and restores focus to the previously focused element afterwards.
 */
// Only the most recently opened trap handles keys, so a dialog opened on top of
// another dialog (e.g. a confirmation) does not close both with one Escape.
const trapStack: symbol[] = []

export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  options: FocusTrapOptions = {},
) {
  let previouslyFocused: HTMLElement | null = null
  const token = Symbol('focus-trap')

  function getFocusableElements(): HTMLElement[] {
    if (!container.value) return []
    return Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(element => element.getClientRects().length > 0)
  }

  function onKeydown(event: KeyboardEvent) {
    if (trapStack.at(-1) !== token) return
    if (event.key === 'Escape') {
      event.stopPropagation()
      options.onEscape?.()
      return
    }
    if (event.key !== 'Tab') return

    const elements = getFocusableElements()
    if (elements.length === 0) {
      event.preventDefault()
      container.value?.focus()
      return
    }

    const first = elements[0]!
    const last = elements[elements.length - 1]!
    const current = document.activeElement

    if (event.shiftKey && (current === first || !container.value?.contains(current))) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && (current === last || !container.value?.contains(current))) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate() {
    previouslyFocused = document.activeElement as HTMLElement | null
    trapStack.push(token)
    document.addEventListener('keydown', onKeydown)
    nextTick(() => {
      const target = options.getInitialFocus?.() ?? getFocusableElements()[0] ?? container.value
      target?.focus()
    })
  }

  function deactivate() {
    document.removeEventListener('keydown', onKeydown)
    const index = trapStack.indexOf(token)
    if (index !== -1) trapStack.splice(index, 1)
    if (previouslyFocused?.isConnected) previouslyFocused.focus()
    previouslyFocused = null
  }

  onMounted(() => {
    watch(active, isActive => (isActive ? activate() : deactivate()), { immediate: true })
  })

  onBeforeUnmount(() => {
    if (active.value) deactivate()
  })
}
