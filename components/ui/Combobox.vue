<script setup lang="ts">
import { Check, Plus } from 'lucide-vue-next'
import { toTurkishTitleCase, turkishKey } from '#shared/utils/text'

/**
 * Editable combobox (WAI-ARIA "combobox with list autocomplete"): the user types
 * freely, matching suggestions are listed and a new value can be added.
 * Focus stays in the input; the highlighted option uses aria-activedescendant.
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

const input = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(-1)

interface Option { value: string, label: string, isNew: boolean }

const options = computed<Option[]>(() => {
  const query = turkishKey(model.value)
  const matches = props.suggestions
    .filter(item => !query || turkishKey(item).includes(query))
    .slice(0, 8)
    .map(item => ({ value: item, label: item, isNew: false }))
  const exists = props.suggestions.some(item => turkishKey(item) === query)
  if (query && !exists) {
    const normalized = toTurkishTitleCase(model.value)
    matches.push({ value: normalized, label: props.createLabel(normalized), isNew: true })
  }
  return matches
})

const showList = computed(() => isOpen.value && options.value.length > 0)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function select(option: Option) {
  model.value = option.value
  close()
}

function onInput() {
  open()
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

watch(activeIndex, async (index) => {
  if (index < 0) return
  await nextTick()
  document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <div class="relative">
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
    <ul
      v-show="showList"
      :id="listboxId"
      role="listbox"
      class="absolute inset-x-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-ink-200 bg-white p-1 shadow-popover"
    >
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="`${option.isNew}-${option.value}`"
        role="option"
        :aria-selected="index === activeIndex"
        class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
        :class="index === activeIndex ? 'bg-ink-100 text-ink-900' : 'text-ink-700'"
        @mousedown.prevent="select(option)"
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
    </ul>
  </div>
</template>
