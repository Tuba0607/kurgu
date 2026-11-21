/**
 * True below 768px (client only; false during server render). Dropdown lists use it
 * to open inside the form flow on phones instead of as a floating layer.
 */
export function usePhoneLayout() {
  const isPhone = ref(false)
  let query: MediaQueryList | undefined
  const update = () => (isPhone.value = !!query?.matches)

  onMounted(() => {
    query = window.matchMedia('(max-width: 767px)')
    update()
    query.addEventListener('change', update)
  })
  onBeforeUnmount(() => query?.removeEventListener('change', update))

  return isPhone
}

/**
 * Inline (phone) lists show at most this many matches, with a hint to keep typing.
 * They have no inner scroll: on iOS a finger on a scroll area nested inside the
 * dialog's scroll area moves the dialog, so the list could never be scrolled.
 */
export const INLINE_LIST_LIMIT = 8

/**
 * After a selection the list collapses and the page moves under the finger; iOS then
 * delivers the tap's synthetic click to whatever is there now (often the input,
 * which would reopen the list). Opening is ignored for this long after a selection.
 */
export const REOPEN_GUARD_MS = 500

const EDGE = 12

/**
 * Scrolls the dialog body so an inline list is fully visible above the footer,
 * together with its label when everything fits. When the list is taller than the
 * visible area, the input is placed at the top and the rest is reached by scrolling
 * the dialog itself.
 */
export async function revealInlineList(element: HTMLElement | null | undefined) {
  await nextTick()
  if (!element) return
  const container = element.parentElement?.closest<HTMLElement>('.overflow-y-auto')
  if (!container) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    return
  }
  const view = container.getBoundingClientRect()
  const room = view.height - 2 * EDGE
  const field = element.closest<HTMLElement>('[data-form-field]')
  const target = field && field.getBoundingClientRect().height <= room ? field : element
  const rect = target.getBoundingClientRect()
  let delta = 0
  if (rect.height > room) delta = rect.top - (view.top + EDGE) // input at the top
  else if (rect.bottom > view.bottom - EDGE) delta = rect.bottom - (view.bottom - EDGE) // last option above the footer
  else if (rect.top < view.top + EDGE) delta = rect.top - (view.top + EDGE)
  if (delta) container.scrollBy({ top: delta, behavior: 'smooth' })
}

/**
 * Phones: puts the caret at the end of the text instead of selecting it, so a tap
 * never replaces the current value by accident. Deferred because iOS places the
 * caret at the tap position after the focus / click events.
 */
export function moveCaretToEnd(input: HTMLInputElement | null | undefined) {
  if (!input) return
  setTimeout(() => {
    const end = input.value.length
    input.setSelectionRange(end, end)
  }, 0)
}

/** Alphabetical order for Turkish labels (Ç after C, İ after I, Ş after S…). */
export function compareTurkish(a: string, b: string) {
  return a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
}
