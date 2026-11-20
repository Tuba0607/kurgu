export type ToastVariant = 'success' | 'error'

export interface Toast {
  id: number
  variant: ToastVariant
  title: string
  message?: string
}

const AUTO_DISMISS_MS = { success: 4000, error: 6500 } as const

let nextToastId = 0

/** Global toast notifications (no external state library needed). */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function show(variant: ToastVariant, title: string, message?: string) {
    if (import.meta.server) return
    const id = ++nextToastId
    toasts.value = [...toasts.value.slice(-3), { id, variant, title, message }]
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS[variant])
  }

  return {
    toasts: readonly(toasts),
    dismiss,
    success: (title: string, message?: string) => show('success', title, message),
    error: (title: string, message?: string) => show('error', title, message),
  }
}
