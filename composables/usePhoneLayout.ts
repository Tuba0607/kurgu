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
 * Scrolls a field (label, control and its inline list) into the visible area of its
 * scroll container; when the whole field does not fit, the control and its list
 * (`element`) are kept visible instead of the label.
 */
export async function revealInlineList(element: HTMLElement | null | undefined) {
  await nextTick()
  if (!element) return
  const field = element.closest<HTMLElement>('[data-form-field]')
  const container = element.closest<HTMLElement>('.overflow-y-auto')
  const fits = !!field && !!container && field.offsetHeight <= container.clientHeight
  ;(fits ? field : element).scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
