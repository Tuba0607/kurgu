export type ToastVariant = 'success' | 'error'

export interface ToastAction {
  label: string
  run: () => void | Promise<void>
}

export interface Toast {
  id: number
  variant: ToastVariant
  title: string
  message?: string
  action?: ToastAction
}

export interface ToastOptions {
  message?: string
  action?: ToastAction
  /** Auto-dismiss delay in ms (defaults depend on the variant). */
  duration?: number
}

const AUTO_DISMISS_MS = { success: 4000, error: 6500 } as const

let nextToastId = 0

/** Global toast notifications (no external state library needed). */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function show(variant: ToastVariant, title: string, options: ToastOptions = {}) {
    if (import.meta.server) return
    const id = ++nextToastId
    toasts.value = [...toasts.value.slice(-3), { id, variant, title, message: options.message, action: options.action }]
    setTimeout(() => dismiss(id), options.duration ?? AUTO_DISMISS_MS[variant])
  }

  // `message` may be a string (description) or full options (action, duration).
  const normalize = (options?: string | ToastOptions): ToastOptions =>
    typeof options === 'string' ? { message: options } : options ?? {}

  return {
    toasts: readonly(toasts),
    dismiss,
    success: (title: string, options?: string | ToastOptions) => show('success', title, normalize(options)),
    error: (title: string, options?: string | ToastOptions) => show('error', title, normalize(options)),
  }
}
