<script setup lang="ts">
import { Check, Plus } from 'lucide-vue-next'
import { toTurkishTitleCase, turkishKey } from '#shared/utils/text'

/**
 * Editable combobox (WAI-ARIA "combobox with list autocomplete"): the user types
 * freely, matching suggestions are listed and a new value can be added.
 * Focus stays in the input; the highlighted option uses aria-activedescendant.
 * Desktop: floating list. Phones: the list opens inside the form flow (pushing the
 * fields below down), at most 5 rows tall, and is scrolled into view with the input.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  suggestions: ReadonlyArray<string>
  invalid?: boolean
  /** Text of the "add new value" option, e.g. value => `"${value}" ekle` */
  createLabel?: (value: string) => string
}>(), {
  invalid: false,
  createLabel: (value: string) => `“${value}” olarak ekle`,
})

const baseId = useId()
const listboxId = `${baseId}-listbox`
const optionId = (index: number) => `${baseId}-option-${index}`

const field = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(-1)

interface Option { value: string, label: string, isNew: boolean }

// Opening shows every suggestion with the current value checked; the list only
// filters once the user starts typing (so an existing value is never "lost").
const filtering = ref(false)

const allOptions = computed<Option[]>(() => {
  const query = filtering.value ? turkishKey(model.value) : ''
  const matches = props.suggestions
    .filter(item => !query || turkishKey(item).includes(query))
    .map(item => ({ value: item, label: item, isNew: false }))
  const exists = props.suggestions.some(item => turkishKey(item) === turkishKey(model.value))
  if (filtering.value && query && !exists) {
    // The "add" option comes first so it is visible without scrolling the list.
    const normalized = toTurkishTitleCase(model.value)
    matches.unshift({ value: normalized, label: props.createLabel(normalized), isNew: true })
  }
  return matches
})

const inline = usePhoneLayout()
// Phones: no inner scroll, so long lists are cut to the first matches (see INLINE_LIST_LIMIT).
const options = computed(() => (inline.value ? allOptions.value.slice(0, INLINE_LIST_LIMIT) : allOptions.value))
const hasMore = computed(() => inline.value && allOptions.value.length > INLINE_LIST_LIMIT)

const showList = computed(() => isOpen.value && options.value.length > 0)
// Desktop: rendered in <body> with fixed positioning, so it never makes the modal body scroll.
const { style: floatingStyle } = useFloating(field, computed(() => showList.value && !inline.value), { maxHeight: 256 })

watch([showList, () => options.value.length], ([visible]) => {
  if (visible && inline.value) revealInlineList(field.value)
})

let reopenGuardUntil = 0

function open() {
  if (isOpen.value || Date.now() < reopenGuardUntil) return
  filtering.value = false
  isOpen.value = true
  // Highlight (and scroll to) the current value
  activeIndex.value = options.value.findIndex(option => turkishKey(option.value) === turkishKey(model.value))
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function select(option: Option) {
  model.value = option.value
  reopenGuardUntil = Date.now() + REOPEN_GUARD_MS
  close()
}

function onInput() {
  isOpen.value = true
  filtering.value = true
  activeIndex.value = -1
}

function onKeydown(event: KeyboardEvent) {
  const count = options.value.length
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) open()
      activeIndex.value = count ? (activeIndex.value + 1) % count : -1
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) open()
      activeIndex.value = count ? (activeIndex.value - 1 + count) % count : -1
      break
    case 'Enter':
      if (showList.value && activeIndex.value >= 0) {
        event.preventDefault()
        select(options.value[activeIndex.value]!)
      }
      break
    case 'Escape':
      if (showList.value) {
        // Close only the list, not the surrounding modal.
        event.preventDefault()
        event.stopPropagation()
        close()
      }
      break
    case 'Tab':
      close()
      break
  }
}

// Normalizes free text on blur so the saved value matches the stored style.
function onBlur() {
  // Delay so a mouse click on an option is handled first.
  setTimeout(() => {
    close()
    if (model.value.trim()) model.value = toTurkishTitleCase(model.value)
  }, 120)
}

watch([activeIndex, isOpen], async ([index, openNow]) => {
  if (index < 0 || !openNow) return
  await nextTick()
  document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <div
    ref="field"
    class="relative"
  >
    <input
      ref="input"
      v-model="model"
      v-bind="$attrs"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-expanded="showList"
      :aria-controls="listboxId"
      :aria-activedescendant="showList && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :aria-invalid="invalid || undefined"
      class="field-control h-10 px-3"
      @focus="open"
      @click="open"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    >
    <Teleport
      to="body"
      :disabled="inline"
    >
      <ul
        v-show="showList"
        :id="listboxId"
        role="listbox"
        class="rounded-xl border border-ink-200 bg-surface p-1"
        :class="inline ? 'mt-1 w-full' : 'z-[70] overflow-y-auto overscroll-contain shadow-popover'"
        :style="inline ? undefined : floatingStyle"
      >
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="`${option.isNew}-${option.value}`"
          role="option"
          :aria-selected="index === activeIndex"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2"
          :class="[index === activeIndex ? 'bg-ink-100 text-ink-900' : 'text-ink-700', inline ? 'min-h-11 text-base' : 'text-sm']"
          @mousedown.prevent
          @click="select(option)"
          @mousemove="activeIndex = index"
        >
          <Plus
            v-if="option.isNew"
            class="size-4 shrink-0 text-ink-500"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
          <Check
            v-if="!option.isNew && turkishKey(option.value) === turkishKey(model)"
            class="size-4 shrink-0 text-ink-900"
            aria-hidden="true"
          />
        </li>
        <li
          v-if="hasMore"
          role="presentation"
          class="px-3 py-2 text-sm text-ink-500"
        >
          Aramayı daraltmak için yazın
        </li>
      </ul>
    </Teleport>
  </div>
</template>
