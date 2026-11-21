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
// the overlay to the visual viewport puts the footer directly on top of the keyboard.
const viewportStyle = ref<Record<string, string>>({})
// With the keyboard open the home-indicator safe area is hidden behind it, so the
// footer drops its safe-area padding (otherwise a gap shows above the keyboard).
const keyboardOpen = ref(false)

function syncVisualViewport() {
  const viewport = window.visualViewport
  if (!viewport) return
  viewportStyle.value = { top: `${viewport.offsetTop}px`, height: `${viewport.height}px` }
  keyboardOpen.value = window.innerHeight - viewport.height > 120
  // Measure after the new height has been applied to the DOM.
  nextTick(() => requestAnimationFrame(revealFocusedField))
}

// Keep the focused field (label + control) fully visible inside the scrolling body,
// also after the keyboard has resized the viewport, so its label never sits under
// the header.
let focusedField: HTMLElement | null = null
const FIELD_MARGIN = 12

function revealFocusedField() {
  const field = focusedField
  const container = body.value
  if (!field || !container || !container.contains(field) || !field.contains(document.activeElement)) return
  const fieldRect = field.getBoundingClientRect()
  const bodyRect = container.getBoundingClientRect()
  const overTop = bodyRect.top + FIELD_MARGIN - fieldRect.top
  const underBottom = fieldRect.bottom - (bodyRect.bottom - FIELD_MARGIN)
  if (overTop > 0) container.scrollTop -= overTop
  // Scroll down only as far as the label can stay visible.
  else if (underBottom > 0) container.scrollTop += Math.min(underBottom, -overTop)
}

function onFocusIn(event: FocusEvent) {
  const target = event.target as HTMLElement
  if (!body.value?.contains(target)) return
  focusedField = target.closest<HTMLElement>('[data-form-field]') ?? target
  revealFocusedField()
  // iOS opens the keyboard with an animation; check again once it has settled.
  setTimeout(revealFocusedField, 350)
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
        class="fixed inset-0 z-50 flex touch-pan-y touch-pinch-zoom items-end justify-center sm:items-center sm:p-6"
        :style="viewportStyle"
        @focusin="onFocusIn"
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

          <!-- One row on every size: [Vazgeç] [primary]; on phones the primary action takes the remaining width -->
          <footer
            v-if="$slots.footer"
            class="flex shrink-0 gap-2 border-t border-ink-100 bg-ink-50/70 px-5 pt-4 max-sm:[&>:last-child]:flex-1 sm:justify-end sm:rounded-b-card sm:px-6 sm:pb-4"
            :class="keyboardOpen ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
