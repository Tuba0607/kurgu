import { maskPhoneInput } from '#shared/utils/phone'

/**
 * Input handler for phone fields: formats the value as "+90 5XX XXX XX XX" while
 * typing or pasting, drops every non-digit character and keeps the caret after
 * the digit the user just typed. Validation stays in the shared Zod schema.
 */
export function usePhoneMask() {
  function onInput(event: Event) {
    const input = event.target as HTMLInputElement
    if ((event as InputEvent).isComposing) return

    const { value, caret } = maskPhoneInput(input.value, input.selectionStart ?? input.value.length)
    if (value === input.value) return

    input.value = value
    input.setSelectionRange(caret, caret)
    // Let v-model pick up the formatted value.
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return { onInput }
}
