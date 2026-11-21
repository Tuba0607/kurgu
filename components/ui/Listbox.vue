<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'

/**
 * Accessible single-select dropdown (WAI-ARIA "select-only combobox" pattern).
 * Focus stays on the trigger; the highlighted option is exposed with
 * aria-activedescendant. The list is teleported to <body> with fixed
 * positioning so parent `overflow: hidden` never clips it, opens below the
 * trigger and flips above only when there is clearly more room there.
 */
interface ListboxOption {
  value: string
  label: string
}

// Layout classes stay on the wrapper; ids and ARIA attributes go to the focusable trigger.
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const triggerAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  options: ReadonlyArray<ListboxOption>
  /** Accessible name of the control */
  label: string
  placeholder?: string
  maxHeight?: number
  /** Lists the selected option first (✓, highlighted, divider below), e.g. a form field. */
  pinSelected?: boolean
}>(), {
  placeholder: 'Seçin',
  maxHeight: 288,
})

const GAP = 6
const VIEWPORT_MARGIN = 8
const OPTION_HEIGHT = 40
const LIST_PADDING = 10
const TYPEAHEAD_RESET_MS = 600

const baseId = useId()
const listboxId = `${baseId}-listbox`
const optionId = (index: number) => `${baseId}-option-${index}`

const trigger = ref<HTMLElement | null>(null)
const listbox = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(-1)
const placement = ref<'bottom' | 'top'>('bottom')
const position = ref({ left: 0, width: 0, offset: 0, maxHeight: props.maxHeight })

// Phones: the list opens inside the form flow (pushing the fields below down), without an
// inner scroll, and is scrolled into view above the footer; desktop keeps the floating list.
// (No item limit here: a listbox has no search field to narrow it down.)
const inline = usePhoneLayout()

// The options as shown: with pinSelected, a real selection (not the empty value) comes
// first and is not repeated; the others keep their own order.
const pinned = computed(() => props.pinSelected && !!model.value && props.options.some(option => option.value === model.value))
const items = computed(() => (pinned.value
  ? [props.options.find(option => option.value === model.value)!, ...props.options.filter(option => option.value !== model.value)]
  : props.options))

const selectedIndex = computed(() => items.value.findIndex(option => option.value === model.value))
const selectedLabel = computed(() => items.value[selectedIndex.value]?.label ?? props.placeholder)

const listStyle = computed(() => ({
  left: `${position.value.left}px`,
  width: `${position.value.width}px`,
  maxHeight: `${position.value.maxHeight}px`,
  ...(placement.value === 'bottom'
    ? { top: `${position.value.offset}px` }
    : { bottom: `${position.value.offset}px` }),
}))

function updatePosition() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return

  const desiredHeight = Math.min(props.maxHeight, items.value.length * OPTION_HEIGHT + LIST_PADDING)
  const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN
  const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN

  // Prefer opening downwards; flip up only when below is too small and above has more room.
  placement.value = spaceBelow >= desiredHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top'
  const available = placement.value === 'bottom' ? spaceBelow : spaceAbove

  position.value = {
    left: rect.left,
    width: rect.width,
    maxHeight: Math.max(OPTION_HEIGHT * 2, Math.min(props.maxHeight, available)),
    offset: placement.value === 'bottom' ? rect.bottom + GAP : window.innerHeight - rect.top + GAP,
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    listbox.value?.querySelector(`#${CSS.escape(optionId(activeIndex.value))}`)?.scrollIntoView({ block: 'nearest' })
  })
}

function setActive(index: number) {
  if (items.value.length === 0) return
  activeIndex.value = Math.min(Math.max(index, 0), items.value.length - 1)
  scrollActiveIntoView()
}

function onPointerDownOutside(event: PointerEvent) {
  const target = event.target as Node
  if (!trigger.value?.contains(target) && !listbox.value?.contains(target)) close()
}

function addListeners() {
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
  document.addEventListener('pointerdown', onPointerDownOutside, true)
}

function removeListeners() {
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
  document.removeEventListener('pointerdown', onPointerDownOutside, true)
}

let reopenGuardUntil = 0

function open(initialIndex = selectedIndex.value >= 0 ? selectedIndex.value : 0) {
  if (isOpen.value || Date.now() < reopenGuardUntil) return
  updatePosition()
  isOpen.value = true
  addListeners()
  setActive(initialIndex)
  if (inline.value) revealInlineList(trigger.value?.parentElement)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  activeIndex.value = -1
  removeListeners()
}

function select(index: number) {
  const option = items.value[index]
  if (!option) return
  model.value = option.value
  reopenGuardUntil = Date.now() + REOPEN_GUARD_MS
  close()
  trigger.value?.focus()
}

// Type-to-select: jumps to the next option starting with the typed text.
let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined

function handleTypeahead(key: string) {
  clearTimeout(typeaheadTimer)
  typeahead += key.toLocaleLowerCase('tr-TR')
  typeaheadTimer = setTimeout(() => (typeahead = ''), TYPEAHEAD_RESET_MS)

  const start = typeahead.length === 1 ? activeIndex.value + 1 : Math.max(activeIndex.value, 0)
  const ordered = [...items.value.keys()].map(offset => (start + offset) % items.value.length)
  const match = ordered.find(index => items.value[index]!.label.toLocaleLowerCase('tr-TR').startsWith(typeahead))
  if (match !== undefined) setActive(match)
}

function onKeydown(event: KeyboardEvent) {
  const last = items.value.length - 1

  if (!isOpen.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      open(event.key === 'ArrowUp' && selectedIndex.value < 0 ? last : undefined)
    }
    else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      open(event.key === 'Home' ? 0 : last)
    }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      open()
      handleTypeahead(event.key)
    }
    return
  }

  const navigationTargets: Record<string, number> = {
    ArrowDown: activeIndex.value + 1,
    ArrowUp: activeIndex.value - 1,
    Home: 0,
    End: last,
    PageDown: activeIndex.value + 5,
    PageUp: activeIndex.value - 5,
  }
  const target = navigationTargets[event.key]
  if (target !== undefined) {
    event.preventDefault()
    setActive(target)
    return
  }

  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      select(activeIndex.value)
      break
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      close()
      break
    case 'Tab':
      close()
      break
    default:
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) handleTypeahead(event.key)
  }
}

onBeforeUnmount(() => {
  removeListeners()
  clearTimeout(typeaheadTimer)
})
</script>

<template>
  <div :class="attrs.class">
    <div
      v-bind="triggerAttrs"
      ref="trigger"
      role="combobox"
      tabindex="0"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      class="flex h-10 w-full cursor-pointer select-none items-center justify-between gap-2 rounded-lg bg-surface pl-3 pr-2.5 text-sm text-ink-900 shadow-sm ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-0"
      :class="isOpen ? 'ring-ink-500' : 'ring-ink-300 hover:ring-ink-400'"
      @click="isOpen ? close() : open()"
      @keydown="onKeydown"
    >
      <span
        class="truncate"
        :class="selectedIndex < 0 && 'text-ink-400'"
      >{{ selectedLabel }}</span>
      <ChevronDown
        class="size-4 shrink-0 text-ink-400 transition-transform"
        :class="isOpen && 'rotate-180'"
        aria-hidden="true"
      />
    </div>

    <Teleport
      to="body"
      :disabled="inline"
    >
      <ul
        v-if="isOpen"
        :id="listboxId"
        ref="listbox"
        role="listbox"
        :aria-label="label"
        tabindex="-1"
        class="rounded-xl border border-ink-200 bg-surface p-1"
        :class="inline ? 'mt-1 w-full' : 'fixed z-[70] overflow-y-auto overscroll-contain shadow-popover'"
        :style="inline ? undefined : listStyle"
        :data-placement="placement"
        @mousedown.prevent
      >
        <template
          v-for="(option, index) in items"
          :key="option.value"
        >
          <li
            :id="optionId(index)"
            role="option"
            :aria-selected="option.value === model"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3"
            :class="[
              inline ? 'min-h-11 text-base' : 'min-h-10 text-sm',
              index === activeIndex ? 'bg-ink-100' : option.value === model && 'bg-ink-50',
              option.value === model ? 'font-medium text-ink-900' : 'text-ink-700',
            ]"
            @mousemove="activeIndex = index"
            @click="select(index)"
          >
            <span class="truncate">{{ option.label }}</span>
            <Check
              v-if="option.value === model"
              class="size-4 shrink-0 text-ink-900"
              aria-hidden="true"
            />
          </li>
          <li
            v-if="pinned && index === 0"
            role="presentation"
            aria-hidden="true"
            class="-mx-1 my-1 h-px bg-ink-100"
          />
        </template>
      </ul>
    </Teleport>
  </div>
</template>
