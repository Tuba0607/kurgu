<script setup lang="ts">
import { CONTENT_TYPE_LABELS, type ContentTypeValue } from '#shared/constants/content'

defineProps<{ type: ContentTypeValue }>()
</script>

<template>
  <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-ink-600">
    <component
      :is="CONTENT_TYPE_ICONS[type]"
      class="size-4 shrink-0 text-ink-400"
      aria-hidden="true"
    />
    {{ CONTENT_TYPE_LABELS[type] }}
  </span>
</template>
