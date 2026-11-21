<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * Turkish date picker: type "gg.aa.yyyy" or pick from a calendar (Turkish month
 * and day names, week starts on Monday, "Bugün" and "Temizle"). The value is
 * "YYYY-MM-DD" or '' (empty). Keyboard: arrows move by day / week, PageUp /
 * PageDown by month, Enter selects, Escape closes.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

defineProps<{
  invalid?: boolean
}>()

const baseId = useId()
const dialogId = `${baseId}-calendar`
const field = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const text = ref(isoToDisplay(model.value))
const { style: floatingStyle } = useFloating(field, isOpen, { maxHeight: 360, matchWidth: false })

watch(model, (value) => {
  if (displayToIso(text.value) !== value) text.value = isoToDisplay(value)
})

// Month shown in the calendar and the keyboard-focused day
const todayIso = toIsoDate(new Date())
const focusedIso = ref(model.value || todayIso)
const view = computed(() => {
  const date = fromIsoDate(focusedIso.value) ?? new Date()
  return { year: date.getFullYear(), month: date.getMonth() }
})
const days = computed(() => buildMonthGrid(view.value.year, view.value.month).map(date => ({
  iso: toIsoDate(date),
  day: date.getDate(),
  inMonth: date.getMonth() === view.value.month,
  label: `${date.getDate()} ${MONTH_NAMES_TR[date.getMonth()]} ${date.getFullYear()}, ${WEEKDAY_LONG_TR[(date.getDay() + 6) % 7]}`,
})))

function onTextInput(event: Event) {
  const target = event.target as HTMLInputElement
  text.value = maskDisplayDate(target.value)
  target.value = text.value
  if (text.value === '') model.value = ''
  const iso = displayToIso(text.value)
  if (iso) {
    model.value = iso
    focusedIso.value = iso
  }
}

// An incomplete or impossible date (31.02) goes back to the last valid value.
function onTextBlur() {
  if (text.value && !displayToIso(text.value)) text.value = isoToDisplay(model.value)
}

async function focusDay() {
  await nextTick()
  popover.value?.querySelector<HTMLButtonElement>(`[data-iso="${focusedIso.value}"]`)?.focus()
}

function open() {
  focusedIso.value = model.value || todayIso
  isOpen.value = true
  focusDay()
}

function close(returnFocus = true) {
  isOpen.value = false
  if (returnFocus) input.value?.focus()
}

function select(iso: string) {
  model.value = iso
  text.value = isoToDisplay(iso)
  close()
}

function clear() {
  model.value = ''
  text.value = ''
  close()
}

function moveFocus(days: number, months = 0) {
  const date = fromIsoDate(focusedIso.value) ?? new Date()
  if (months) date.setMonth(date.getMonth() + months, Math.min(date.getDate(), 28))
  date.setDate(date.getDate() + days)
  focusedIso.value = toIsoDate(date)
  focusDay()
}

function onGridKeydown(event: KeyboardEvent) {
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [-7, 0], ArrowDown: [7, 0], PageUp: [0, -1], PageDown: [0, 1],
  }
  const move = moves[event.key]
  if (move) {
    event.preventDefault()
    moveFocus(move[0], move[1])
  }
}

function onPopoverKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // Close only the calendar, not the surrounding modal.
    event.preventDefault()
    event.stopPropagation()
    close()
  }
  else if (event.key === 'Tab') {
    // Keep the modal's focus order: leaving the calendar returns to the field.
    event.preventDefault()
    close()
  }
}

function onDocumentPointer(event: PointerEvent) {
  const target = event.target as Node
  if (isOpen.value && !popover.value?.contains(target) && !field.value?.contains(target)) close(false)
}
onMounted(() => document.addEventListener('pointerdown', onDocumentPointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer))
</script>

<template>
  <div
    ref="field"
    class="relative"
  >
    <input
      ref="input"
      v-bind="$attrs"
      :value="text"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="gg.aa.yyyy"
      maxlength="10"
      :aria-invalid="invalid || undefined"
      class="field-control h-10 pl-3 pr-10 tabular-nums"
      @input="onTextInput"
      @blur="onTextBlur"
      @keydown.down.prevent="open"
    >
    <button
      type="button"
      class="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
      :aria-label="isOpen ? 'Takvimi kapat' : 'Takvimden tarih seç'"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="dialogId"
      @click="isOpen ? close() : open()"
    >
      <CalendarDays
        class="size-4"
        aria-hidden="true"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        :id="dialogId"
        ref="popover"
        role="dialog"
        aria-label="Tarih seç"
        class="z-[70] w-[296px] overflow-y-auto rounded-2xl border border-ink-200 bg-surface p-3 shadow-popover"
        :style="floatingStyle"
        @keydown="onPopoverKeydown"
      >
        <div class="mb-2 flex items-center justify-between">
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
            aria-label="Önceki ay"
            @click="moveFocus(0, -1)"
          >
            <ChevronLeft
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <p
            class="text-sm font-semibold text-ink-900"
            aria-live="polite"
          >
            {{ MONTH_NAMES_TR[view.month] }} {{ view.year }}
          </p>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
            aria-label="Sonraki ay"
            @click="moveFocus(0, 1)"
          >
            <ChevronRight
              class="size-4"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          class="grid grid-cols-7 gap-0.5"
          @keydown="onGridKeydown"
        >
          <span
            v-for="weekday in WEEKDAY_SHORT_TR"
            :key="weekday"
            aria-hidden="true"
            class="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500"
          >{{ weekday }}</span>
          <button
            v-for="day in days"
            :key="day.iso"
            type="button"
            :data-iso="day.iso"
            :tabindex="day.iso === focusedIso ? 0 : -1"
            :aria-label="day.label"
            :aria-pressed="day.iso === model"
            :aria-current="day.iso === todayIso ? 'date' : undefined"
            class="flex h-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors focus-visible:ring-offset-0"
            :class="[
              day.iso === model
                ? 'bg-primary font-semibold text-primary-ink'
                : day.inMonth ? 'text-ink-800 hover:bg-ink-100' : 'text-ink-400 hover:bg-ink-100',
              day.iso === todayIso && day.iso !== model && 'font-semibold ring-1 ring-inset ring-ink-300',
            ]"
            @click="select(day.iso)"
          >
            {{ day.day }}
          </button>
        </div>

        <div class="mt-3 flex justify-between border-t border-ink-100 pt-3">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            @click="clear"
          >
            Temizle
          </button>
          <button
            type="button"
            class="rounded-full bg-ink-100 px-3 py-1.5 text-sm font-semibold text-ink-900 hover:bg-ink-200"
            @click="select(todayIso)"
          >
            Bugün
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
