<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
import { turkishKey } from '#shared/utils/text'

/**
 * Searchable single select (WAI-ARIA combobox): type to filter, pick with the
 * mouse or arrows + Enter. Only listed options can be selected; on blur the
 * text goes back to the selected option's label.
 * Options are alphabetical; until the user types, the selected option is pinned on
 * top (✓, highlighted, divider below) and not repeated further down.
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

const field = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const isOpen = ref(false)
const inline = usePhoneLayout()
// Desktop: floating list in <body> (never makes the modal body scroll).
// Phones: inside the form flow, scrolled into view above the footer.
const { style: floatingStyle } = useFloating(field, computed(() => isOpen.value && !inline.value), { maxHeight: 256 })

let reopenGuardUntil = 0
const activeIndex = ref(-1)

const selectedLabel = computed(() => props.options.find(option => option.value === model.value)?.label ?? '')
watch(selectedLabel, (label) => {
  if (!isOpen.value) query.value = label
}, { immediate: true })

const sorted = computed(() => [...props.options].sort((a, b) => compareTurkish(a.label, b.label)))
// Everything is shown while the text is empty or still equals the current selection.
const isFiltering = computed(() => !!turkishKey(query.value) && query.value !== selectedLabel.value)
const pinned = computed(() => !isFiltering.value && sorted.value.some(option => option.value === model.value))

const matches = computed(() => {
  if (isFiltering.value) {
    const key = turkishKey(query.value)
    return sorted.value.filter(option => turkishKey(option.label).includes(key))
  }
  if (!pinned.value) return sorted.value
  const selected = sorted.value.find(option => option.value === model.value)!
  return [selected, ...sorted.value.filter(option => option.value !== model.value)]
})
// Phones: no inner scroll, so long lists are cut to the first matches (see INLINE_LIST_LIMIT).
const filtered = computed(() => (inline.value ? matches.value.slice(0, INLINE_LIST_LIMIT) : matches.value))
const hasMore = computed(() => inline.value && matches.value.length > INLINE_LIST_LIMIT)

watch([isOpen, () => filtered.value.length], ([open]) => {
  if (open && inline.value) revealInlineList(field.value)
})

function open() {
  if (isOpen.value || Date.now() < reopenGuardUntil) return
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
  reopenGuardUntil = Date.now() + REOPEN_GUARD_MS
  query.value = option.label
  isOpen.value = false
  activeIndex.value = -1
}

function onFocus() {
  // Desktop: select the text so typing replaces it. Phones: caret at the end instead.
  if (inline.value) moveCaretToEnd(input.value)
  else input.value?.select()
}

function onClick() {
  open()
  if (inline.value) moveCaretToEnd(input.value)
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
  <div
    ref="field"
    class="relative"
  >
    <!-- Input and chevron have their own box, so the chevron stays centred in the
         input even when the phone list opens below it. -->
    <div class="relative">
      <input
        ref="input"
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
        @click="onClick"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
      >
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400 transition-transform"
        :class="isOpen && 'rotate-180'"
        aria-hidden="true"
      />
    </div>
    <Teleport
      to="body"
      :disabled="inline"
    >
      <ul
        v-show="isOpen"
        :id="listboxId"
        role="listbox"
        class="rounded-xl border border-ink-200 bg-surface p-1"
        :class="inline ? 'mt-1 w-full' : 'z-[70] overflow-y-auto overscroll-contain shadow-popover'"
        :style="inline ? undefined : floatingStyle"
      >
        <template
          v-for="(option, index) in filtered"
          :key="option.value"
        >
          <li
            :id="optionId(index)"
            role="option"
            :aria-selected="option.value === model"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2"
            :class="[
              index === activeIndex ? 'bg-ink-100 text-ink-900' : option.value === model ? 'bg-ink-50 text-ink-900' : 'text-ink-700',
              option.value === model && 'font-medium',
              inline ? 'min-h-11 text-base' : 'text-sm',
            ]"
            @mousedown.prevent
            @click="select(option)"
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
            v-if="pinned && index === 0"
            role="presentation"
            aria-hidden="true"
            class="-mx-1 my-1 h-px bg-ink-100"
          />
        </template>
        <li
          v-if="hasMore"
          role="presentation"
          class="px-3 py-2 text-sm text-ink-500"
        >
          Aramayı daraltmak için yazın
        </li>
        <li
          v-if="!filtered.length"
          class="px-3 py-2 text-sm text-ink-500"
          role="presentation"
        >
          {{ emptyText }}
        </li>
      </ul>
    </Teleport>
  </div>
</template>
