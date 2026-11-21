<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { ClientListItem } from '~/types/api'

defineProps<{ items: ClientListItem[] }>()
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
              Firma
            </th>
            <th
              scope="col"
              class="px-3 py-3 font-medium"
            >
              İletişim
            </th>
            <th
              scope="col"
              class="hidden px-3 py-3 font-medium xl:table-cell"
            >
              Sektör
            </th>
            <th
              scope="col"
              class="px-3 py-3 text-right font-medium"
            >
              İçerik
            </th>
            <th
              scope="col"
              class="px-3 py-3 font-medium"
            >
              Eklenme
            </th>
            <th
              scope="col"
              class="py-3 pl-3 pr-5"
            >
              <span class="sr-only">Detay</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100">
          <tr
            v-for="client in items"
            :key="client.id"
            class="group relative transition-colors hover:bg-ink-50/80"
          >
            <td class="w-full max-w-0 py-3.5 pl-5 pr-3">
              <div class="flex items-center gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-xs font-semibold text-ink-700 ring-1 ring-inset ring-ink-100"
                  aria-hidden="true"
                >{{ getInitials(client.name) }}</span>
                <div class="min-w-0">
                  <!-- The link covers the whole row (see ::after) for a large click target. -->
                  <NuxtLink
                    :to="`/musteriler/${client.id}`"
                    class="block truncate font-medium text-ink-900 after:absolute after:inset-0 group-hover:text-ink-700"
                    :title="client.name"
                  >
                    {{ client.name }}
                  </NuxtLink>
                  <p class="truncate text-ink-500">
                    {{ client.contactName ?? EMPTY_VALUE }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-3 py-3.5 text-ink-600">
              <p
                class="max-w-[15rem] truncate"
                :title="client.email ?? undefined"
              >
                {{ client.email ?? EMPTY_VALUE }}
              </p>
              <p
                v-if="client.phone"
                class="max-w-[15rem] truncate tabular-nums text-ink-500"
              >
                {{ client.phone }}
              </p>
            </td>
            <td class="hidden px-3 py-3.5 text-ink-600 xl:table-cell">
              <span
                class="block max-w-[11rem] truncate"
                :title="client.industry ?? undefined"
              >{{ client.industry ?? EMPTY_VALUE }}</span>
            </td>
            <td class="px-3 py-3.5">
              <ContentStatusBar :counts="client.statusCounts" />
            </td>
            <td class="whitespace-nowrap px-3 py-3.5 tabular-nums text-ink-500">
              {{ formatDate(client.createdAt) }}
            </td>
            <td class="py-3.5 pl-3 pr-5 text-right">
              <ChevronRight
                class="ml-auto size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500"
                aria-hidden="true"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <ul class="divide-y divide-ink-100 md:hidden">
      <li
        v-for="client in items"
        :key="client.id"
      >
        <NuxtLink
          :to="`/musteriler/${client.id}`"
          class="flex items-center gap-3 px-4 py-4 active:bg-ink-50"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-sm font-semibold text-ink-700 ring-1 ring-inset ring-ink-100"
            aria-hidden="true"
          >{{ getInitials(client.name) }}</span>
          <div class="min-w-0 flex-1">
            <p class="line-clamp-2 break-words font-medium leading-snug text-ink-900">
              {{ client.name }}
            </p>
            <!-- Secondary info on separate lines so neither value is cut off early -->
            <p
              v-if="client.industry"
              class="mt-0.5 truncate text-sm text-ink-500"
            >
              {{ client.industry }}
            </p>
            <p
              v-if="client.contactName"
              class="truncate text-sm text-ink-500"
            >
              {{ client.contactName }}
            </p>
          </div>
          <ContentStatusBar
            class="shrink-0"
            :counts="client.statusCounts"
          />
          <ChevronRight
            class="size-4 shrink-0 text-ink-300"
            aria-hidden="true"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
