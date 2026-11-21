<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

/**
 * Lightweight SVG donut for the content status distribution (no chart library).
 * The ring itself only shows a tooltip (hover / tap); the legend rows next to it
 * show count and share and open the contents list filtered by that status.
 */
const props = defineProps<{
  counts: Record<ContentStatusValue, number>
}>()

const VIEWBOX = 120
const RADIUS = 46
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const total = computed(() => CONTENT_STATUSES.reduce((sum, status) => sum + props.counts[status], 0))
const segments = computed(() => buildDonutSegments(props.counts, CIRCUMFERENCE))

const legend = computed(() => CONTENT_STATUSES.map(status => ({
  status,
  label: CONTENT_STATUS_LABELS[status],
  text: `${CONTENT_STATUS_LABELS[status]} · ${formatNumber(props.counts[status])} içerik · ${formatPercent(props.counts[status], total.value)}`,
})))

const summaryLabel = computed(() => (total.value === 0
  ? 'Durum dağılımı: henüz içerik yok'
  : `Durum dağılımı, toplam ${total.value} içerik: ${legend.value.map(item => item.text).join(', ')}`))

// ---- Tooltip
const root = ref<HTMLElement | null>(null)
const chart = ref<SVGSVGElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const legendList = ref<HTMLElement | null>(null)
const active = ref<ContentStatusValue | null>(null)
const tooltipPosition = ref({ left: 0, top: 0 })
const activeText = computed(() => legend.value.find(item => item.status === active.value)?.text)

const TOOLTIP_GAP = 6
/** The card's inner padding (p-5): the tooltip may use it, but never leaves the card. */
const CARD_PADDING = 20

interface Box { left: number, top: number }

async function activate(status: ContentStatusValue) {
  active.value = status
  await nextTick()
  const rootRect = root.value?.getBoundingClientRect()
  const chartRect = chart.value?.getBoundingClientRect()
  const tip = tooltip.value
  if (!rootRect || !chartRect || !tip) return

  const width = tip.offsetWidth
  const height = tip.offsetHeight
  const scale = chartRect.width / VIEWBOX
  const centerX = chartRect.left - rootRect.left + (VIEWBOX / 2) * scale
  const centerY = chartRect.top - rootRect.top + (VIEWBOX / 2) * scale
  const outerRadius = (RADIUS + STROKE / 2 + 2) * scale
  const holeRadius = (RADIUS - STROKE / 2) * scale
  const legendEl = legendList.value
  const legendBox = legendEl
    ? { left: legendEl.offsetLeft, top: legendEl.offsetTop, right: legendEl.offsetLeft + legendEl.offsetWidth, bottom: legendEl.offsetTop + legendEl.offsetHeight }
    : null

  // Anchor just outside the ring, at the middle of the segment's arc
  // (or 12 o'clock for a status without contents).
  const segment = segments.value.find(item => item.status === status)
  const angle = ((segment?.midAngle ?? 0) - 90) * (Math.PI / 180)
  const anchorX = centerX + outerRadius * Math.cos(angle)
  const anchorY = centerY + outerRadius * Math.sin(angle)

  const clampX = (left: number) => Math.min(Math.max(left, 0), rootRect.width - width)
  const g = TOOLTIP_GAP
  // Around the anchor: above / below / sides and the four diagonals.
  const candidates: Box[] = [
    { left: clampX(anchorX - width / 2), top: anchorY - height - g },
    { left: clampX(anchorX - width / 2), top: anchorY + g },
    { left: clampX(anchorX + g), top: anchorY - height / 2 },
    { left: clampX(anchorX - width - g), top: anchorY - height / 2 },
    { left: clampX(anchorX + g), top: anchorY - height - g },
    { left: clampX(anchorX - width - g), top: anchorY - height - g },
    { left: clampX(anchorX + g), top: anchorY + g },
    { left: clampX(anchorX - width - g), top: anchorY + g },
  ]

  // Valid: inside the card, not over the centre count, not over the legend.
  const isValid = (box: Box) => {
    if (box.top < -CARD_PADDING || box.top + height > rootRect.height + CARD_PADDING) return false
    const overlapsLegend = legendBox
      && box.left < legendBox.right + 4 && box.left + width > legendBox.left - 4
      && box.top < legendBox.bottom + 4 && box.top + height > legendBox.top - 4
    if (overlapsLegend) return false
    const nearestX = Math.min(Math.max(centerX, box.left), box.left + width)
    const nearestY = Math.min(Math.max(centerY, box.top), box.top + height)
    return Math.hypot(centerX - nearestX, centerY - nearestY) > holeRadius
  }
  // Prefer the valid position whose centre is closest to the segment.
  const distance = (box: Box) => Math.hypot(box.left + width / 2 - anchorX, box.top + height / 2 - anchorY)
  const best = candidates.filter(isValid).sort((a, b) => distance(a) - distance(b))[0]
  tooltipPosition.value = best ?? candidates[0]!
}

function deactivate() {
  active.value = null
}

// Touch: a tap outside the chart closes the tooltip.
function onPointerDownOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) deactivate()
}

watch(active, (value) => {
  if (!import.meta.client) return
  if (value) document.addEventListener('pointerdown', onPointerDownOutside, true)
  else document.removeEventListener('pointerdown', onPointerDownOutside, true)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDownOutside, true))
</script>

<template>
  <div
    ref="root"
    class="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-7"
    @keydown.esc="deactivate"
  >
    <div class="relative size-36 shrink-0">
      <svg
        ref="chart"
        :viewBox="`0 0 ${VIEWBOX} ${VIEWBOX}`"
        class="size-full -rotate-90"
        role="img"
        :aria-label="summaryLabel"
      >
        <circle
          :cx="VIEWBOX / 2"
          :cy="VIEWBOX / 2"
          :r="RADIUS"
          fill="none"
          :stroke-width="STROKE"
          class="stroke-ink-100"
        />
        <circle
          v-for="segment in segments"
          :key="segment.status"
          :cx="VIEWBOX / 2"
          :cy="VIEWBOX / 2"
          :r="RADIUS"
          fill="none"
          :stroke-width="active === segment.status ? STROKE + 3 : STROKE"
          :stroke-dasharray="`${segment.dashLength} ${CIRCUMFERENCE}`"
          :stroke-dashoffset="segment.dashOffset"
          class="transition-[opacity,stroke-width] duration-150"
          :class="[CONTENT_STATUS_STYLES[segment.status].stroke, active && active !== segment.status && 'opacity-35']"
          aria-hidden="true"
          @mouseenter="activate(segment.status)"
          @mouseleave="deactivate"
          @click="activate(segment.status)"
        />
      </svg>

      <!-- Centre label -->
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-3xl font-semibold leading-none tabular-nums tracking-tight text-ink-900">{{ formatNumber(total) }}</span>
        <span class="mt-1 text-xs text-ink-500">içerik</span>
      </div>
    </div>

    <p
      v-if="total === 0"
      class="mt-3 text-center text-[13px] text-ink-500"
    >
      Henüz içerik yok. İçerik eklendiğinde dağılım burada görünecek.
    </p>

    <!-- Legend: count + share per status; each row opens the filtered contents list -->
    <ul
      ref="legendList"
      class="w-full min-w-0 flex-1 space-y-0.5"
      aria-label="Durumlar"
    >
      <li
        v-for="item in legend"
        :key="item.status"
      >
        <NuxtLink
          :to="{ path: '/contents', query: { status: item.status } }"
          class="group flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
          :class="active === item.status && 'bg-ink-50 text-ink-900'"
          :aria-label="`${item.text}. İçeriklerde göster`"
          @mouseenter="activate(item.status)"
          @mouseleave="deactivate"
          @focus="activate(item.status)"
          @blur="deactivate"
        >
          <span
            class="size-2.5 shrink-0 rounded-full"
            :class="CONTENT_STATUS_STYLES[item.status].dot"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
          <span class="font-semibold tabular-nums text-ink-900">{{ formatNumber(counts[item.status]) }}</span>
          <span class="w-10 text-right text-[13px] tabular-nums text-ink-500">{{ formatPercent(counts[item.status], total) }}</span>
          <ChevronRight
            class="-mr-1 size-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-600"
            aria-hidden="true"
          />
        </NuxtLink>
      </li>
    </ul>

    <div
      v-if="activeText"
      ref="tooltip"
      class="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-medium text-white shadow-popover"
      :style="{ left: `${tooltipPosition.left}px`, top: `${tooltipPosition.top}px` }"
      aria-hidden="true"
    >
      {{ activeText }}
    </div>
  </div>
</template>
