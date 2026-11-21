<script setup lang="ts">
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

/** Compact stacked bar of content counts per status (e.g. in the client list). */
const props = defineProps<{
  counts: Record<ContentStatusValue, number>
}>()

const total = computed(() => CONTENT_STATUSES.reduce((sum, status) => sum + props.counts[status], 0))
const summary = computed(() => CONTENT_STATUSES
  .filter(status => props.counts[status] > 0)
  .map(status => `${props.counts[status]} ${CONTENT_STATUS_LABELS[status].toLocaleLowerCase('tr-TR')}`)
  .join(', '))
</script>

<template>
  <div
    class="flex items-center gap-2.5"
    :title="summary || 'İçerik yok'"
  >
    <span class="w-5 text-right text-sm font-medium tabular-nums text-ink-900">{{ total }}</span>
    <span
      class="flex h-1.5 w-20 overflow-hidden rounded-full bg-ink-100"
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
    <span class="sr-only">{{ summary ? `içerik: ${summary}` : 'içerik yok' }}</span>
  </div>
</template>
