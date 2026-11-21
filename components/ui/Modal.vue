<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  size?: 'md' | 'lg'
  /** Small dialogs (confirmations) stay a bottom sheet on phones instead of full screen. */
  compact?: boolean
  /** Prevents closing (e.g. while a request is in flight). */
  persistent?: boolean
}>(), {
  description: undefined,
  size: 'md',
})

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()

function requestClose() {
  if (!props.persistent) emit('close')
}

const isOpen = toRef(props, 'open')
useFocusTrap(panel, isOpen, {
  onEscape: requestClose,
  // An explicit [data-autofocus] wins (e.g. "Vazgeç" in confirmations); otherwise the
  // first form control so users can start typing immediately.
  getInitialFocus: () => panel.value?.querySelector<HTMLElement>('[data-autofocus]')
    ?? body.value?.querySelector<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
    ),
})
useScrollLock(isOpen)

// Mobile keyboards shrink the *visual* viewport, not the layout viewport. Sizing
// the overlay to the visual viewport keeps the footer buttons above the keyboard.
const viewportStyle = ref<Record<string, string>>({})

function syncVisualViewport() {
  const viewport = window.visualViewport
  if (!viewport) return
  viewportStyle.value = { top: `${viewport.offsetTop}px`, height: `${viewport.height}px` }
}

function toggleViewportTracking(active: boolean) {
  const viewport = window.visualViewport
  if (!viewport) return
  if (active) {
    syncVisualViewport()
    viewport.addEventListener('resize', syncVisualViewport)
    viewport.addEventListener('scroll', syncVisualViewport)
  }
  else {
    viewport.removeEventListener('resize', syncVisualViewport)
    viewport.removeEventListener('scroll', syncVisualViewport)
    viewportStyle.value = {}
  }
}

onMounted(() => watch(isOpen, toggleViewportTracking, { immediate: true }))
onBeforeUnmount(() => toggleViewportTracking(false))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
        :style="viewportStyle"
      >
        <div
          class="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="requestClose"
        />

        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          class="relative flex w-full animate-dialog-in flex-col bg-surface shadow-overlay ring-1 ring-ink-900/5 focus:outline-none sm:max-h-[92%] sm:rounded-card"
          :class="[
            size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
            compact ? 'max-h-[92%] rounded-t-card' : 'h-full max-h-full sm:h-auto',
          ]"
        >
          <header
            class="flex shrink-0 items-start justify-between gap-4 border-ink-100 px-5 py-4 sm:px-6"
            :class="$slots.default && 'border-b'"
          >
            <div class="min-w-0">
              <h2
                :id="titleId"
                class="text-base font-semibold text-ink-900"
              >
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="descriptionId"
                class="mt-0.5 text-sm text-ink-500"
              >
                {{ description }}
              </p>
            </div>
            <button
              type="button"
              class="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-600 disabled:opacity-50"
              aria-label="Kapat"
              :disabled="persistent"
              @click="requestClose"
            >
              <X
                class="size-5"
                aria-hidden="true"
              />
            </button>
          </header>

          <div
            v-if="$slots.default"
            ref="body"
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
          >
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="flex shrink-0 flex-col-reverse gap-2 border-t border-ink-100 bg-ink-50/70 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:rounded-b-card sm:px-6 sm:pb-4"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
