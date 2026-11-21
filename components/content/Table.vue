<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import type { ContentStatusValue } from '#shared/constants/content'
import type { ContentListItem } from '~/types/api'

withDefaults(defineProps<{
  items: ContentListItem[]
  showClient?: boolean
  /** Id of the content whose status is being saved (its menu is disabled). */
  pendingId?: string | null
}>(), {
  showClient: true,
  pendingId: null,
})

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
              Oluşturulma
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
            class="group transition-colors hover:bg-ink-50/80"
          >
            <!-- Title takes the remaining width and truncates; other columns are bounded. -->
            <td class="w-full max-w-0 py-3.5 pl-5 pr-3">
              <NuxtLink
                :to="`/contents/${content.id}`"
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
                :to="`/clients/${content.client.id}`"
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
              {{ formatDate(content.createdAt) }}
            </td>
            <td class="py-3.5 pl-3 pr-5 text-right">
              <button
                type="button"
                class="inline-flex size-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
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
        class="flex items-start gap-3 px-4 py-4"
      >
        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="`/contents/${content.id}`"
            class="line-clamp-2 font-medium text-ink-900"
          >
            {{ content.title }}
          </NuxtLink>
          <p class="mt-1 truncate text-sm text-ink-500">
            <template v-if="showClient">
              {{ content.client.name }} ·
            </template>
            {{ formatDate(content.createdAt) }}
          </p>
          <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <ContentStatusMenu
              :status="content.status"
              :label="content.title"
              :disabled="pendingId === content.id"
              @change="$emit('status-change', content, $event)"
            />
            <ContentTypeBadge :type="content.type" />
          </div>
        </div>
        <button
          type="button"
          class="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
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
