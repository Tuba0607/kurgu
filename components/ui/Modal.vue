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

// Phones (< 640px, where dialogs are full screen or bottom sheets):
// the overlay always covers the whole *layout* viewport (100lvh), so the page can
// never show through: not behind the keyboard, not behind Safari's bottom bar.
// The keyboard and the bar only shrink the *visual* viewport; the panel starts at its
// top (`top`) and the part of the screen below it (`bottomGap`) becomes panel padding
// in the panel's own colour, so the footer buttons sit right on the keyboard / bar.
const overlay = ref<HTMLElement | null>(null)
const viewportFit = ref({ top: 0, bottomGap: 0 })
const isPhoneDialog = ref(false)

const overlayStyle = computed(() => (isPhoneDialog.value ? { paddingTop: `${viewportFit.value.top}px` } : undefined))
const panelStyle = computed(() => (isPhoneDialog.value ? { paddingBottom: `${viewportFit.value.bottomGap}px` } : undefined))

function syncVisualViewport() {
  isPhoneDialog.value = window.innerWidth < 640
  const viewport = window.visualViewport
  if (!viewport || !isPhoneDialog.value) return
  const layoutHeight = overlay.value?.clientHeight || window.innerHeight
  viewportFit.value = {
    top: Math.max(0, viewport.offsetTop),
    bottomGap: Math.max(0, Math.round(layoutHeight - viewport.offsetTop - viewport.height)),
  }
  // Measure after the new size has been applied to the DOM.
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
  const active = document.activeElement as HTMLElement | null
  if (!field || !container || !active || !container.contains(field) || !field.contains(active)) return
  const bodyRect = container.getBoundingClientRect()
  // Whole field (label + control + an open inline list) when it fits; otherwise the
  // control with its list (their wrapper), which matters more than the label.
  let target = field
  let margin = FIELD_MARGIN
  if (field.getBoundingClientRect().height > bodyRect.height - 2 * FIELD_MARGIN && active.parentElement && field.contains(active.parentElement)) {
    target = active.parentElement
    margin = 0
  }
  const rect = target.getBoundingClientRect()
  const overTop = bodyRect.top + margin - rect.top
  const underBottom = rect.bottom - (bodyRect.bottom - margin)
  if (overTop > 0) container.scrollTop -= overTop
  // Scroll down only as far as the top of the target can stay visible.
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
    // After render, so the overlay's 100lvh height can be measured.
    nextTick(syncVisualViewport)
    viewport.addEventListener('resize', syncVisualViewport)
    viewport.addEventListener('scroll', syncVisualViewport)
  }
  else {
    viewport.removeEventListener('resize', syncVisualViewport)
    viewport.removeEventListener('scroll', syncVisualViewport)
    viewportFit.value = { top: 0, bottomGap: 0 }
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
        ref="overlay"
        class="fixed inset-0 z-50 flex h-lvh touch-pan-y touch-pinch-zoom items-end justify-center sm:h-auto sm:items-center sm:p-6"
        :class="!compact && 'max-sm:bg-surface'"
        :style="overlayStyle"
        @focusin="onFocusIn"
      >
        <!-- Dimmed backdrop behind the panel; full-screen phone dialogs use the panel colour instead -->
        <div
          class="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px]"
          :class="!compact && 'max-sm:hidden'"
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
          :style="panelStyle"
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
              class="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 active:bg-ink-100 hover:text-ink-600 disabled:opacity-50"
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
            :class="viewportFit.bottomGap > 0 ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
