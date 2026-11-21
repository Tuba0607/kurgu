<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import type { ActionsMenuItem } from '~/types/ui'

/**
 * "⋯" overflow menu (WAI-ARIA menu button).
 * - ≥ 768px: dropdown aligned to the trigger's right edge.
 * - < 768px: bottom sheet (tap outside or Esc closes it).
 * Arrow keys / Home / End move between items, Esc closes and returns focus to the trigger.
 */
const props = defineProps<{
  items: ActionsMenuItem[]
  /** Accessible name of the trigger, e.g. "Diğer işlemler". */
  label: string
  /** Heading of the mobile sheet, e.g. the content title. */
  sheetTitle?: string
}>()

const emit = defineEmits<{ select: [key: string] }>()

// Extra attributes (class, data-*) belong to the trigger, not the teleported menu.
defineOptions({ inheritAttrs: false })

const baseId = useId()
const trigger = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLButtonElement[]>([])
const isOpen = ref(false)
const isSheet = ref(false)
const menuStyle = ref<Record<string, string>>({})
const MENU_GAP = 6

useScrollLock(computed(() => isOpen.value && isSheet.value))

function place() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const right = `${window.innerWidth - rect.right}px`
  const estimatedHeight = props.items.length * 40 + 8
  menuStyle.value = window.innerHeight - rect.bottom < estimatedHeight + 12
    ? { right, bottom: `${window.innerHeight - rect.top + MENU_GAP}px` }
    : { right, top: `${rect.bottom + MENU_GAP}px` }
}

async function open() {
  isSheet.value = !window.matchMedia('(min-width: 768px)').matches
  if (!isSheet.value) place()
  isOpen.value = true
  await nextTick()
  itemRefs.value[0]?.focus()
}

function close(returnFocus = true) {
  if (!isOpen.value) return
  isOpen.value = false
  if (returnFocus) trigger.value?.focus()
}

function choose(key: string) {
  // Close first so focus is back on the trigger before e.g. a confirm dialog
  // opens; the dialog then restores focus there when it closes.
  close()
  emit('select', key)
}

function onMenuKeydown(event: KeyboardEvent) {
  const index = itemRefs.value.indexOf(document.activeElement as HTMLButtonElement)
  const last = itemRefs.value.length - 1
  const moves: Record<string, number> = {
    ArrowDown: index === last ? 0 : index + 1,
    ArrowUp: index <= 0 ? last : index - 1,
    Home: 0,
    End: last,
  }
  if (event.key in moves) {
    event.preventDefault()
    itemRefs.value[moves[event.key]!]?.focus()
  }
  else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
  else if (event.key === 'Tab') {
    // Menu pattern: Tab leaves the menu instead of cycling inside it.
    event.preventDefault()
    close()
  }
}

function onDocumentPointer(event: PointerEvent) {
  if (!isOpen.value || isSheet.value) return
  const target = event.target as Node
  if (!menu.value?.contains(target) && !trigger.value?.contains(target)) close(false)
}

function onViewportChange() {
  // A dropdown would drift away from its trigger; the sheet is fixed to the bottom.
  if (isOpen.value && !isSheet.value) close(false)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointer)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
})

// The first item gets focus on open; its highlight only shows for keyboard users,
// so a mouse/touch open does not look like the (destructive) item is already hovered.
const ITEM_BASE = 'flex w-full items-center gap-2.5 text-left outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
function itemClass(item: ActionsMenuItem) {
  return item.danger
    ? 'text-danger hover:bg-danger/10 [html:not([data-modality=pointer])_&:focus-visible]:bg-danger/10'
    : 'text-ink-700 hover:bg-ink-100 [html:not([data-modality=pointer])_&:focus-visible]:bg-ink-100'
}
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 md:size-10 md:border md:border-ink-300 md:bg-surface md:text-ink-800 md:hover:border-ink-400 md:hover:bg-ink-50"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :aria-controls="isOpen ? `${baseId}-menu` : undefined"
    :aria-label="label"
    v-bind="$attrs"
    @click="isOpen ? close() : open()"
    @keydown.down.prevent="open"
  >
    <MoreHorizontal
      class="size-5"
      aria-hidden="true"
    />
  </button>

  <Teleport to="body">
    <!-- Desktop: dropdown -->
    <div
      v-if="isOpen && !isSheet"
      :id="`${baseId}-menu`"
      ref="menu"
      role="menu"
      :aria-label="label"
      class="fixed z-[70] min-w-48 animate-dialog-in rounded-xl border border-ink-200 bg-surface p-1 shadow-popover motion-reduce:animate-none"
      :style="menuStyle"
      @keydown="onMenuKeydown"
    >
      <template
        v-for="item in items"
        :key="item.key"
      >
        <div
          v-if="item.separatorBefore"
          role="separator"
          class="-mx-1 my-1 h-px bg-ink-100"
        />
        <button
          ref="itemRefs"
          type="button"
          role="menuitem"
          :class="[ITEM_BASE, itemClass(item), 'rounded-lg px-3 py-2 text-sm font-medium']"
          @click="choose(item.key)"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ item.label }}
        </button>
      </template>
    </div>

    <!-- Mobile: bottom sheet -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && isSheet"
        class="fixed inset-0 z-[60] flex touch-pan-y touch-pinch-zoom items-end"
      >
        <div
          class="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="close()"
        />
        <div
          :id="`${baseId}-menu`"
          ref="menu"
          role="menu"
          :aria-label="sheetTitle ? `${sheetTitle}: ${label}` : label"
          class="relative w-full animate-dialog-in rounded-t-card bg-surface px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-overlay ring-1 ring-ink-900/5 motion-reduce:animate-none"
          @keydown="onMenuKeydown"
        >
          <div
            class="mx-auto mb-2 h-1 w-10 rounded-full bg-ink-200"
            aria-hidden="true"
          />
          <p
            v-if="sheetTitle"
            class="truncate px-4 pb-2 text-sm text-ink-500"
            aria-hidden="true"
          >
            {{ sheetTitle }}
          </p>
          <template
            v-for="item in items"
            :key="item.key"
          >
            <div
              v-if="item.separatorBefore"
              role="separator"
              class="mx-4 my-1 h-px bg-ink-100"
            />
            <!-- 48px+ touch targets -->
            <button
              ref="itemRefs"
              type="button"
              role="menuitem"
              :class="[ITEM_BASE, itemClass(item), 'min-h-12 rounded-xl px-4 text-base font-medium']"
              @click="choose(item.key)"
            >
              <component
                :is="item.icon"
                v-if="item.icon"
                class="size-5 shrink-0"
                aria-hidden="true"
              />
              {{ item.label }}
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
