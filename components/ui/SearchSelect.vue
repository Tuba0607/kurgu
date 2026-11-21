<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
import { turkishKey } from '#shared/utils/text'

/**
 * Searchable single select (WAI-ARIA combobox): type to filter, pick with the
 * mouse or arrows + Enter. Only listed options can be selected; on blur the
 * text goes back to the selected option's label.
 */
defineOptions({ inheritAttrs: false })

interface Option { value: string, label: string }

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  options: ReadonlyArray<Option>
  invalid?: boolean
  placeholder?: string
  emptyText?: string
}>(), {
  invalid: false,
  placeholder: 'Seçin',
  emptyText: 'Sonuç bulunamadı',
})

const baseId = useId()
const listboxId = `${baseId}-listbox`
const optionId = (index: number) => `${baseId}-option-${index}`

const query = ref('')
const isOpen = ref(false)
const activeIndex = ref(-1)

const selectedLabel = computed(() => props.options.find(option => option.value === model.value)?.label ?? '')
watch(selectedLabel, (label) => {
  if (!isOpen.value) query.value = label
}, { immediate: true })

const filtered = computed(() => {
  const key = turkishKey(query.value)
  // Show everything while the text still equals the current selection.
  if (!key || query.value === selectedLabel.value) return props.options
  return props.options.filter(option => turkishKey(option.label).includes(key))
})

function open() {
  if (isOpen.value) return
  isOpen.value = true
  activeIndex.value = Math.max(0, filtered.value.findIndex(option => option.value === model.value))
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
  query.value = selectedLabel.value
}

function select(option: Option) {
  model.value = option.value
  query.value = option.label
  isOpen.value = false
  activeIndex.value = -1
}

function onInput() {
  isOpen.value = true
  activeIndex.value = filtered.value.length ? 0 : -1
}

function onKeydown(event: KeyboardEvent) {
  const count = filtered.value.length
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) return open()
    if (!count) return
    const step = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + step + count) % count
  }
  else if (event.key === 'Enter' && isOpen.value) {
    event.preventDefault()
    const option = filtered.value[activeIndex.value]
    if (option) select(option)
  }
  else if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
  else if (event.key === 'Tab') {
    close()
  }
}

function onBlur() {
  setTimeout(() => {
    if (isOpen.value) close()
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
      v-model="query"
      v-bind="$attrs"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :aria-invalid="invalid || undefined"
      :placeholder="placeholder"
      class="field-control h-10 pl-3 pr-9"
      @click="open"
      @focus="($event.target as HTMLInputElement).select()"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    >
    <ChevronDown
      class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400 transition-transform"
      :class="isOpen && 'rotate-180'"
      aria-hidden="true"
    />
    <ul
      v-show="isOpen"
      :id="listboxId"
      role="listbox"
      class="absolute inset-x-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-ink-200 bg-surface p-1 shadow-popover"
    >
      <li
        v-for="(option, index) in filtered"
        :id="optionId(index)"
        :key="option.value"
        role="option"
        :aria-selected="option.value === model"
        class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
        :class="index === activeIndex ? 'bg-ink-100 text-ink-900' : 'text-ink-700'"
        @mousedown.prevent="select(option)"
        @mousemove="activeIndex = index"
      >
        <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
        <Check
          v-if="option.value === model"
          class="size-4 shrink-0 text-ink-900"
          aria-hidden="true"
        />
      </li>
      <li
        v-if="!filtered.length"
        class="px-3 py-2 text-sm text-ink-500"
        role="presentation"
      >
        {{ emptyText }}
      </li>
    </ul>
  </div>
</template>
