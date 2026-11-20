<script setup lang="ts">
import { CONTENT_STATUS_LABELS, type ContentStatusValue } from '#shared/constants/content'

defineProps<{ status: ContentStatusValue }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="CONTENT_STATUS_STYLES[status].badge"
  >
    <span
      class="size-1.5 rounded-full"
      :class="CONTENT_STATUS_STYLES[status].dot"
      aria-hidden="true"
    />
    {{ CONTENT_STATUS_LABELS[status] }}
  </span>
</template>
