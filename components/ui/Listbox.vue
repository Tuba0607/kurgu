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

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  options: ReadonlyArray<ListboxOption>
  /** Accessible name of the control */
  label: string
  placeholder?: string
  maxHeight?: number
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

const selectedIndex = computed(() => props.options.findIndex(option => option.value === model.value))
const selectedLabel = computed(() => props.options[selectedIndex.value]?.label ?? props.placeholder)

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

  const desiredHeight = Math.min(props.maxHeight, props.options.length * OPTION_HEIGHT + LIST_PADDING)
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
  if (props.options.length === 0) return
  activeIndex.value = Math.min(Math.max(index, 0), props.options.length - 1)
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

function open(initialIndex = selectedIndex.value >= 0 ? selectedIndex.value : 0) {
  if (isOpen.value) return
  updatePosition()
  isOpen.value = true
  addListeners()
  setActive(initialIndex)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  activeIndex.value = -1
  removeListeners()
}

function select(index: number) {
  const option = props.options[index]
  if (!option) return
  model.value = option.value
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
  const ordered = [...props.options.keys()].map(offset => (start + offset) % props.options.length)
  const match = ordered.find(index => props.options[index]!.label.toLocaleLowerCase('tr-TR').startsWith(typeahead))
  if (match !== undefined) setActive(match)
}

function onKeydown(event: KeyboardEvent) {
  const last = props.options.length - 1

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
  <div>
    <div
      ref="trigger"
      role="combobox"
      tabindex="0"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      class="flex h-10 w-full cursor-pointer select-none items-center justify-between gap-2 rounded-lg bg-white pl-3 pr-2.5 text-sm text-ink-900 shadow-sm ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-0"
      :class="isOpen ? 'ring-ink-500' : 'ring-ink-300 hover:ring-ink-400'"
      @click="isOpen ? close() : open()"
      @keydown="onKeydown"
    >
      <span
        class="truncate"
        :class="selectedIndex < 0 && 'text-ink-400'"
      >{{ selectedLabel }}</span>
      <ChevronDown
        class="size-4 shrink-0 text-ink-400"
        aria-hidden="true"
      />
    </div>

    <Teleport to="body">
      <ul
        v-if="isOpen"
        :id="listboxId"
        ref="listbox"
        role="listbox"
        :aria-label="label"
        tabindex="-1"
        class="fixed z-30 overflow-y-auto overscroll-contain rounded-xl border border-ink-200 bg-white p-1 shadow-popover"
        :style="listStyle"
        :data-placement="placement"
        @mousedown.prevent
      >
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          class="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-sm"
          :class="[
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
      </ul>
    </Teleport>
  </div>
</template>
