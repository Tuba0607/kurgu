<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import type { ContentStatusValue } from '#shared/constants/content'
import type { ContentListItem } from '~/types/api'

const props = withDefaults(defineProps<{
  items: ContentListItem[]
  showClient?: boolean
  /** Id of the content whose status is being saved (its menu is disabled). */
  pendingId?: string | null
  /** What the date column shows; follows the list's sort order. */
  dateColumn?: 'created' | 'scheduled' | 'waiting'
}>(), {
  showClient: true,
  pendingId: null,
  dateColumn: 'created',
})

const DATE_COLUMN_LABELS = {
  created: 'Oluşturulma',
  scheduled: 'Yayın / planlanan tarih',
  waiting: 'Bekleme süresi',
} as const

/** Shorter labels for the one-line mobile meta row (type and date must always fit). */
const MOBILE_DATE_LABELS = {
  scheduled: 'Yayın',
  waiting: 'Bekliyor',
} as const

/** Value of the date column for one content. */
function dateCell(content: ContentListItem): { text: string, hint?: string } {
  if (props.dateColumn === 'waiting') {
    const days = daysSince(content.statusChangedAt)
    return { text: days === 0 ? 'Bugün' : `${days} gün`, hint: formatDate(content.statusChangedAt) }
  }
  if (props.dateColumn === 'scheduled') {
    if (content.publishedAt) return { text: formatDate(content.publishedAt), hint: 'Yayınlandı' }
    if (content.scheduledAt) return { text: formatDate(content.scheduledAt), hint: 'Planlanan' }
    return { text: 'Planlanmadı' }
  }
  return { text: formatDate(content.createdAt) }
}

/** Mobile meta row: the publish date drops the current year so the client name keeps some room. */
function mobileDateText(content: ContentListItem): string {
  if (props.dateColumn === 'scheduled') {
    const date = content.publishedAt ?? content.scheduledAt
    if (date) return formatShortDate(date)
  }
  return dateCell(content).text
}

defineEmits<{
  'edit': [id: string]
  'status-change': [content: ContentListItem, status: ContentStatusValue]
}>()
</script>

<template>
  <!-- Single root so parent classes (e.g. refresh opacity) are applied. -->
  <div>
    <!-- Desktop / tablet: table -->
    <div class="hidden overflow-x-auto md:block">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-ink-200 text-xs font-medium uppercase tracking-wide text-ink-500">
            <th
              scope="col"
              class="py-3 pl-5 pr-3 font-medium"
            >
              Başlık
            </th>
            <th
              v-if="showClient"
              scope="col"
              class="px-3 py-3 font-medium"
            >
              Müşteri
            </th>
            <th
              scope="col"
              class="hidden px-3 py-3 font-medium xl:table-cell"
            >
              Tür
            </th>
            <th
              scope="col"
              class="px-3 py-3 font-medium"
            >
              Durum
            </th>
            <th
              scope="col"
              class="px-3 py-3 font-medium"
            >
              {{ DATE_COLUMN_LABELS[dateColumn] }}
            </th>
            <th
              scope="col"
              class="py-3 pl-3 pr-5"
            >
              <span class="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100">
          <tr
            v-for="content in items"
            :key="content.id"
            class="group transition-colors hover:bg-ink-50/80 active:bg-ink-50/80"
          >
            <!-- Title takes the remaining width and truncates; other columns are bounded. -->
            <td class="w-full max-w-0 py-3.5 pl-5 pr-3">
              <NuxtLink
                :to="`/icerikler/${content.id}`"
                class="block truncate font-medium text-ink-900 hover:text-ink-700"
                :title="content.title"
              >
                {{ content.title }}
              </NuxtLink>
              <ContentTypeBadge
                :type="content.type"
                class="mt-0.5 text-[13px] xl:hidden"
              />
            </td>
            <td
              v-if="showClient"
              class="px-3 py-3.5"
            >
              <NuxtLink
                :to="`/musteriler/${content.client.id}`"
                class="block max-w-[11rem] truncate text-ink-600 hover:text-ink-700 hover:underline"
                :title="content.client.name"
              >
                {{ content.client.name }}
              </NuxtLink>
            </td>
            <td class="hidden px-3 py-3.5 xl:table-cell">
              <ContentTypeBadge :type="content.type" />
            </td>
            <td class="px-3 py-3.5">
              <ContentStatusMenu
                :status="content.status"
                :label="content.title"
                :disabled="pendingId === content.id"
                @change="$emit('status-change', content, $event)"
              />
            </td>
            <td class="whitespace-nowrap px-3 py-3.5 tabular-nums text-ink-500">
              <span :title="dateCell(content).hint">{{ dateCell(content).text }}</span>
              <span
                v-if="dateColumn === 'scheduled' && dateCell(content).hint"
                class="block text-xs text-ink-500"
              >{{ dateCell(content).hint }}</span>
            </td>
            <td class="py-3.5 pl-3 pr-5 text-right">
              <button
                type="button"
                class="inline-flex size-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 active:bg-ink-100 hover:text-ink-700"
                :aria-label="`${content.title} içeriğini düzenle`"
                @click="$emit('edit', content.id)"
              >
                <Pencil
                  class="size-4"
                  aria-hidden="true"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <ul class="divide-y divide-ink-100 md:hidden">
      <li
        v-for="content in items"
        :key="content.id"
        class="relative px-4 py-4"
      >
        <!-- Edit button sits in the title's top-right corner, so the meta row below gets the full card width -->
        <div class="min-w-0">
          <NuxtLink
            :to="`/icerikler/${content.id}`"
            class="line-clamp-2 pr-10 font-medium text-ink-900"
          >
            {{ content.title }}
          </NuxtLink>
          <!-- Meta line: type first so it always starts at the same x; only the client name shrinks ("…") -->
          <p class="mt-1 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-sm text-ink-500">
            <ContentTypeBadge
              :type="content.type"
              short
              class="shrink-0 !text-ink-500"
            />
            <template v-if="showClient">
              <span
                class="shrink-0"
                aria-hidden="true"
              >·</span>
              <span
                class="min-w-0 truncate"
                :title="content.client.name"
              >{{ content.client.name }}</span>
            </template>
            <span
              class="shrink-0"
              aria-hidden="true"
            >·</span>
            <span class="shrink-0">
              <template v-if="dateColumn === 'created'">
                {{ formatDate(content.createdAt) }}
              </template>
              <template v-else>
                {{ MOBILE_DATE_LABELS[dateColumn] }}: {{ mobileDateText(content) }}
              </template>
            </span>
          </p>
          <!-- Status badge alone on its own row -->
          <div class="mt-2.5 flex">
            <ContentStatusMenu
              :status="content.status"
              :label="content.title"
              :disabled="pendingId === content.id"
              @change="$emit('status-change', content, $event)"
            />
          </div>
        </div>
        <button
          type="button"
          class="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 active:bg-ink-100 hover:text-ink-700"
          :aria-label="`${content.title} içeriğini düzenle`"
          @click="$emit('edit', content.id)"
        >
          <Pencil
            class="size-4"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
