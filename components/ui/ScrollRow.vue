<script setup lang="ts">
/**
 * Horizontally scrollable row (tabs on small screens):
 * - soft fade on an edge only while there is content to scroll to in that direction
 *   (fades in/out via registered custom properties, see main.css),
 * - scroll-snap so items are never cut in half when scrolling stops,
 * - keeps the active item ([aria-pressed="true"] / [aria-selected="true"]) in view.
 */
const props = defineProps<{
  /** Changes when the active item changes, e.g. the selected status. */
  activeKey?: string
}>()

const scroller = ref<HTMLElement | null>(null)
const fadeStart = ref(false)
const fadeEnd = ref(false)

function updateFades() {
  const el = scroller.value
  if (!el) return
  // scrollLeft can be fractional on high-DPI screens; scrollWidth is rounded.
  fadeStart.value = el.scrollLeft > 0.5
  fadeEnd.value = Math.ceil(el.scrollLeft) + el.clientWidth < el.scrollWidth
}

/** Inline padding of the row (room for focus rings); items snap to it, not to the outer edge. */
function paddingStart(el: HTMLElement) {
  return Number.parseFloat(getComputedStyle(el).paddingLeft) || 0
}

async function revealActive(smooth = true) {
  await nextTick()
  const el = scroller.value
  const active = el?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"]')
  if (!el || !active) return updateFades()
  const items = [...el.querySelectorAll<HTMLElement>(':scope > [data-scroll-item]')]
  const start = (item: HTMLElement) => item.offsetLeft - el.offsetLeft - paddingStart(el)
  const activeRight = active.offsetLeft - el.offsetLeft + active.offsetWidth
  const fullyVisible = start(active) >= el.scrollLeft && activeRight <= el.scrollLeft + el.clientWidth
  if (!fullyVisible) {
    // Align the row to an item's start (never half an item at the left edge):
    // the first start from which the active item is completely visible.
    const target = items.map(start).find(left => activeRight - left <= el.clientWidth - 8) ?? start(active)
    el.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' })
  }
  updateFades()
}

watch(() => props.activeKey, () => revealActive())

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  // Without this, snapping aligns the first item to the outer edge and the row
  // starts scrolled by the padding width, which would show the start fade.
  if (scroller.value) scroller.value.style.scrollPaddingInline = `${paddingStart(scroller.value)}px`
  revealActive(false)
  // Row size (viewport resize) and item sizes (e.g. tab counts changing) both affect scrollWidth.
  resizeObserver = new ResizeObserver(updateFades)
  if (scroller.value) {
    resizeObserver.observe(scroller.value)
    for (const item of scroller.value.children) resizeObserver.observe(item)
  }
})
onBeforeUnmount(() => resizeObserver?.disconnect())

const fadeStyle = computed(() => ({
  '--scroll-fade-start': fadeStart.value ? 1 : 0,
  '--scroll-fade-end': fadeEnd.value ? 1 : 0,
}))
</script>

<template>
  <div
    ref="scroller"
    class="scroll-row-fade flex snap-x snap-proximity overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>[data-scroll-item]]:snap-start"
    :style="fadeStyle"
    @scroll.passive="updateFades"
  >
    <slot />
    <!-- Room at the end so the row can always align to an item's start -->
    <span
      class="w-12 shrink-0"
      aria-hidden="true"
    />
  </div>
</template>
