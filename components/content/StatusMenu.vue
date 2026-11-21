<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

/**
 * Status badge that opens a small menu to change the status in place
 * (WAI-ARIA menu button). A ▾ icon appears on hover / focus.
 */
const props = defineProps<{
  status: ContentStatusValue
  /** Accessible context, e.g. the content title */
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{ change: [status: ContentStatusValue] }>()

const baseId = useId()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const items = ref<HTMLButtonElement[]>([])
const isOpen = ref(false)
// Fixed positioning so list containers with overflow: hidden never clip the menu.
const menuStyle = ref<Record<string, string>>({})
const MENU_HEIGHT = 130

function place() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const below = window.innerHeight - rect.bottom
  menuStyle.value = below < MENU_HEIGHT + 12
    ? { left: `${rect.left}px`, bottom: `${window.innerHeight - rect.top + 6}px` }
    : { left: `${rect.left}px`, top: `${rect.bottom + 6}px` }
}

async function open() {
  if (props.disabled) return
  place()
  isOpen.value = true
  await nextTick()
  items.value[CONTENT_STATUSES.indexOf(props.status)]?.focus()
}

function close(returnFocus = true) {
  isOpen.value = false
  if (returnFocus) trigger.value?.focus()
}

function choose(status: ContentStatusValue) {
  close()
  if (status !== props.status) emit('change', status)
}

function onMenuKeydown(event: KeyboardEvent) {
  const index = items.value.indexOf(document.activeElement as HTMLButtonElement)
  const last = items.value.length - 1
  const moves: Record<string, number> = { ArrowDown: index === last ? 0 : index + 1, ArrowUp: index <= 0 ? last : index - 1, Home: 0, End: last }
  if (event.key in moves) {
    event.preventDefault()
    items.value[moves[event.key]!]?.focus()
  }
  else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
  else if (event.key === 'Tab') {
    close(false)
  }
}

function onDocumentPointer(event: PointerEvent) {
  if (isOpen.value && !root.value?.contains(event.target as Node)) close(false)
}
function onScroll() {
  if (isOpen.value) close(false)
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointer)
  window.addEventListener('scroll', onScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer)
  window.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
  <div
    ref="root"
    class="relative inline-flex"
    @click.stop
  >
    <button
      ref="trigger"
      type="button"
      class="group/status inline-flex cursor-pointer items-center gap-0.5 rounded-full transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="`${baseId}-menu`"
      :aria-label="`Durum: ${CONTENT_STATUS_LABELS[status]}. ${label} için durumu değiştir`"
      :disabled="disabled"
      @click="isOpen ? close() : open()"
      @keydown.down.prevent="open"
    >
      <ContentStatusBadge :status="status" />
      <ChevronDown
        class="size-3.5 text-ink-400 opacity-0 transition-opacity group-hover/status:opacity-100 group-focus-visible/status:opacity-100 [@media(hover:none)]:hidden"
        :class="isOpen && 'opacity-100'"
        aria-hidden="true"
      />
    </button>
    <div
      v-show="isOpen"
      :id="`${baseId}-menu`"
      role="menu"
      :aria-label="`${label} durumu`"
      class="fixed z-40 w-48 rounded-xl border border-ink-200 bg-surface p-1 shadow-popover"
      :style="menuStyle"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="value in CONTENT_STATUSES"
        :key="value"
        ref="items"
        type="button"
        role="menuitemradio"
        :aria-checked="value === status"
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-700 outline-none hover:bg-ink-100 focus-visible:bg-ink-100 focus-visible:ring-0 focus-visible:ring-offset-0"
        @click="choose(value)"
      >
        <span
          class="size-2 shrink-0 rounded-full"
          :class="CONTENT_STATUS_STYLES[value].dot"
          aria-hidden="true"
        />
        <span class="flex-1">{{ CONTENT_STATUS_LABELS[value] }}</span>
        <Check
          v-if="value === status"
          class="size-4 text-ink-900"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
