<script setup lang="ts">
/**
 * Horizontally scrollable row (tabs on small screens):
 * - soft fade on the edge(s) that still have content to scroll to,
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
  fadeStart.value = el.scrollLeft > 2
  fadeEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}

async function revealActive(smooth = true) {
  await nextTick()
  const el = scroller.value
  const active = el?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"]')
  if (!el || !active) return updateFades()
  const items = [...el.querySelectorAll<HTMLElement>(':scope > [data-scroll-item]')]
  const start = (item: HTMLElement) => item.offsetLeft - el.offsetLeft - 4
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
  revealActive(false)
  resizeObserver = new ResizeObserver(updateFades)
  if (scroller.value) resizeObserver.observe(scroller.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

const maskImage = computed(() => {
  const start = fadeStart.value ? 'transparent 0, #000 28px' : '#000 0'
  const end = fadeEnd.value ? '#000 calc(100% - 28px), transparent 100%' : '#000 100%'
  return `linear-gradient(to right, ${start}, ${end})`
})
</script>

<template>
  <div
    ref="scroller"
    class="flex snap-x snap-proximity overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>[data-scroll-item]]:snap-start"
    :style="{ maskImage, WebkitMaskImage: maskImage }"
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
