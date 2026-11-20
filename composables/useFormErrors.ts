import type { Ref } from 'vue'
import type { FieldErrors } from '#shared/utils/validation'

/**
 * Field error state for forms: clears a field's error as soon as the user edits
 * it and moves focus to the first invalid control after a failed submit.
 */
export function useFormErrors<T extends object>(form: T, formElement: Ref<HTMLFormElement | null>) {
  const errors = ref<FieldErrors>({})

  for (const key of Object.keys(form) as Array<keyof T & string>) {
    watch(() => form[key], () => {
      if (errors.value[key]) {
        const { [key]: _removed, ...rest } = errors.value
        errors.value = rest
      }
    })
  }

  async function setErrors(fieldErrors: FieldErrors) {
    errors.value = fieldErrors
    await nextTick()
    const control = formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (!control) return

    // Focus without the browser's default jump, then bring the whole field
    // (label, control and error message) into view inside the scrollable modal.
    control.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ;(control.closest('[data-form-field]') ?? control).scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  function clearErrors() {
    errors.value = {}
  }

  return { errors, setErrors, clearErrors }
}
