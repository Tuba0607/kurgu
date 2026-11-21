<script setup lang="ts">
import { CircleAlert, CircleCheck, X } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()

async function runAction(id: number, action: ToastAction) {
  dismiss(id)
  await action.run()
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
    aria-live="polite"
    aria-relevant="additions"
  >
    <TransitionGroup
      enter-active-class="animate-toast-in"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :role="toast.variant === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-surface p-4 shadow-overlay ring-1 ring-ink-900/5"
      >
        <CircleCheck
          v-if="toast.variant === 'success'"
          class="mt-0.5 size-5 shrink-0 text-emerald-500"
          aria-hidden="true"
        />
        <CircleAlert
          v-else
          class="mt-0.5 size-5 shrink-0 text-rose-500"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink-900">
            {{ toast.title }}
          </p>
          <p
            v-if="toast.message"
            class="mt-0.5 text-sm text-ink-500"
          >
            {{ toast.message }}
          </p>
        </div>
        <button
          v-if="toast.action"
          type="button"
          class="-my-1 shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900"
          @click="runAction(toast.id, toast.action)"
        >
          {{ toast.action.label }}
        </button>
        <button
          type="button"
          class="-m-1 flex size-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 active:bg-ink-100 hover:text-ink-600"
          aria-label="Bildirimi kapat"
          @click="dismiss(toast.id)"
        >
          <X
            class="size-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
