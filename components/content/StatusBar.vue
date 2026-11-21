<script setup lang="ts">
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

/**
 * Compact stacked bar of content counts per status, with a tooltip on hover.
 * The tooltip is teleported and clamped to the viewport (8px from every edge; below
 * the bar when there is no room above). It closes on pointer leave, on any touch
 * elsewhere and on scroll, so it never stays stuck on touch screens. It ignores
 * pointer events, so tapping the row still opens the client.
 */
const props = defineProps<{
  counts: Record<ContentStatusValue, number>
}>()

const total = computed(() => CONTENT_STATUSES.reduce((sum, status) => sum + props.counts[status], 0))
// "2 taslak · 1 onay bekliyor · 0 yayında"
const summary = computed(() => CONTENT_STATUSES
  .map(status => `${props.counts[status]} ${CONTENT_STATUS_LABELS[status].toLocaleLowerCase('tr-TR')}`)
  .join(' · '))

const root = ref<HTMLElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const tooltipStyle = ref<Record<string, string>>({})
const EDGE = 8
const GAP = 8

async function show() {
  // Rendered invisibly first so it can be measured, then placed.
  tooltipStyle.value = { visibility: 'hidden', left: '0px', top: '0px' }
  isOpen.value = true
  await nextTick()
  const anchor = root.value?.getBoundingClientRect()
  const tip = tooltip.value
  if (!anchor || !tip) return
  const { width, height } = tip.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const left = Math.min(Math.max(anchor.left, EDGE), viewportWidth - EDGE - width)
  const above = anchor.top - GAP - height
  const top = above >= EDGE ? above : anchor.bottom + GAP
  tooltipStyle.value = { left: `${Math.max(EDGE, left)}px`, top: `${top}px` }
}

function hide() {
  isOpen.value = false
}

function onPointerLeave(event: PointerEvent) {
  // Touch pointers "leave" right after the tap; the document listeners close it then.
  if (event.pointerType === 'mouse') hide()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (isOpen.value && !root.value?.contains(event.target as Node)) hide()
}

function removeListeners() {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  window.removeEventListener('scroll', hide, true)
  window.removeEventListener('resize', hide)
}

watch(isOpen, (open) => {
  if (!open) return removeListeners()
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
})
onBeforeUnmount(removeListeners)
</script>

<template>
  <div
    ref="root"
    class="relative flex items-center gap-2.5"
    @pointerenter="show"
    @pointerleave="onPointerLeave"
  >
    <span class="w-5 text-right text-sm font-medium tabular-nums text-ink-900">{{ total }}</span>
    <span
      class="flex h-1.5 w-20 gap-px overflow-hidden rounded-full bg-ink-100"
      aria-hidden="true"
    >
      <template
        v-for="status in CONTENT_STATUSES"
        :key="status"
      >
        <span
          v-if="counts[status] > 0"
          class="h-full"
          :class="CONTENT_STATUS_STYLES[status].bar"
          :style="{ width: `${(counts[status] / total) * 100}%` }"
        />
      </template>
    </span>
    <span class="sr-only">içerik: {{ summary }}</span>
    <!-- Tooltip (pointer); screen readers get the same text above -->
    <Teleport to="body">
      <span
        v-if="isOpen"
        ref="tooltip"
        class="pointer-events-none fixed z-[80] max-w-[calc(100%-16px)] whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-popover"
        :style="tooltipStyle"
        aria-hidden="true"
      >{{ summary }}</span>
    </Teleport>
  </div>
</template>
