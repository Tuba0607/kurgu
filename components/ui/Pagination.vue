<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/** Footer pagination for lists. Renders nothing when everything fits on one page. */
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
  total: number
  pageSize: number
  /** Noun used in the range text, e.g. "1–10 / 17 içerik" */
  itemLabel?: string
}>(), {
  itemLabel: 'içerik',
})

const emit = defineEmits<{ change: [page: number] }>()

const items = computed(() => getPageItems(props.page, props.totalPages))
const range = computed(() => getPageRange(props.page, props.pageSize, props.total))

function go(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.page) emit('change', page)
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:px-5"
    aria-label="Sayfalama"
  >
    <p class="text-[13px] tabular-nums text-ink-500">
      <span class="font-medium text-ink-900">{{ range.from }}–{{ range.to }}</span>
      / {{ total }} {{ itemLabel }}
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-40"
        :disabled="page <= 1"
        aria-label="Önceki sayfa"
        @click="go(page - 1)"
      >
        <ChevronLeft
          class="size-4"
          aria-hidden="true"
        />
      </button>

      <!-- Compact indicator on small screens -->
      <span class="px-1 text-[13px] tabular-nums text-ink-600 sm:hidden">
        Sayfa {{ page }} / {{ totalPages }}
      </span>

      <!-- Page numbers from sm upwards -->
      <ul class="hidden items-center gap-1 sm:flex">
        <li
          v-for="(item, index) in items"
          :key="item === 'ellipsis' ? `ellipsis-${index}` : item"
        >
          <span
            v-if="item === 'ellipsis'"
            class="flex size-8 items-center justify-center text-[13px] text-ink-400"
            aria-hidden="true"
          >…</span>
          <button
            v-else
            type="button"
            class="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors"
            :class="item === page ? 'bg-primary text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'"
            :aria-label="`Sayfa ${item}`"
            :aria-current="item === page ? 'page' : undefined"
            @click="go(item)"
          >
            {{ item }}
          </button>
        </li>
      </ul>

      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-40"
        :disabled="page >= totalPages"
        aria-label="Sonraki sayfa"
        @click="go(page + 1)"
      >
        <ChevronRight
          class="size-4"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
