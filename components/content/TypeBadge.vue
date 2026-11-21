<script setup lang="ts">
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_SHORT_LABELS, type ContentTypeValue } from '#shared/constants/content'

defineProps<{
  type: ContentTypeValue
  /** Compact label for narrow columns; the full label is kept as a tooltip. */
  short?: boolean
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap align-middle text-sm text-ink-600"
    :title="short ? CONTENT_TYPE_LABELS[type] : undefined"
  >
    <component
      :is="CONTENT_TYPE_ICONS[type]"
      class="size-4 shrink-0 text-ink-400"
      aria-hidden="true"
    />
    <span>{{ short ? CONTENT_TYPE_SHORT_LABELS[type] : CONTENT_TYPE_LABELS[type] }}</span>
  </span>
</template>
