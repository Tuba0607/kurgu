<script setup lang="ts">
import { CONTENT_STATUS_LABELS, type ContentStatusValue } from '#shared/constants/content'

/** Vertical timeline of a content's status changes (newest first). */
const props = defineProps<{
  changes: ReadonlyArray<{ id: string, fromStatus: ContentStatusValue | null, toStatus: ContentStatusValue, changedAt: string }>
}>()

const items = computed(() => [...props.changes].reverse())
</script>

<template>
  <ol
    v-if="items.length"
    class="relative space-y-4"
  >
    <li
      v-for="(change, index) in items"
      :key="change.id"
      class="relative flex gap-3"
    >
      <!-- connector line -->
      <span
        v-if="index < items.length - 1"
        class="absolute left-[5px] top-4 h-[calc(100%+4px)] w-px bg-ink-200"
        aria-hidden="true"
      />
      <span
        class="relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white"
        :class="CONTENT_STATUS_STYLES[change.toStatus].dot"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p class="text-sm text-ink-900">
          <template v-if="change.fromStatus">
            <span class="text-ink-500">{{ CONTENT_STATUS_LABELS[change.fromStatus] }}</span>
            <span
              class="mx-1 text-ink-400"
              aria-hidden="true"
            >→</span>
            <span class="sr-only">durumundan</span>
            <span class="font-medium">{{ CONTENT_STATUS_LABELS[change.toStatus] }}</span>
          </template>
          <template v-else>
            <span class="font-medium">{{ CONTENT_STATUS_LABELS[change.toStatus] }}</span> olarak oluşturuldu
          </template>
        </p>
        <p class="text-[13px] tabular-nums text-ink-500">
          <time :datetime="change.changedAt">{{ formatDateTime(change.changedAt) }}</time>
          · {{ formatRelativeDate(change.changedAt) }}
        </p>
      </div>
    </li>
  </ol>
  <p
    v-else
    class="text-sm text-ink-500"
  >
    Henüz durum değişikliği yok.
  </p>
</template>
