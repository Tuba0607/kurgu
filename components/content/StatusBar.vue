<script setup lang="ts">
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

/** Compact stacked bar of content counts per status, with a tooltip on hover / focus. */
const props = defineProps<{
  counts: Record<ContentStatusValue, number>
}>()

const total = computed(() => CONTENT_STATUSES.reduce((sum, status) => sum + props.counts[status], 0))
// "2 taslak · 1 onay bekliyor · 0 yayında"
const summary = computed(() => CONTENT_STATUSES
  .map(status => `${props.counts[status]} ${CONTENT_STATUS_LABELS[status].toLocaleLowerCase('tr-TR')}`)
  .join(' · '))
</script>

<template>
  <div class="group/bar relative flex items-center gap-2.5">
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
    <span
      class="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-popover group-hover/bar:block"
      aria-hidden="true"
    >{{ summary }}</span>
  </div>
</template>
