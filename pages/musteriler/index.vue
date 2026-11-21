<script setup lang="ts">
import { SearchX, UserPlus, Users } from 'lucide-vue-next'
import { CLIENT_SORT_SLUGS, fromSlug, QUERY_KEYS } from '#shared/constants/routes'
import { CLIENT_SORT_LABELS, CLIENT_SORTS, type ClientSortValue } from '#shared/schemas/client'
import type { ClientListItem } from '~/types/api'

useHead({ title: 'Müşteriler' })

const { input: searchInput, applied: search } = useDebouncedQuerySearch(QUERY_KEYS.search)

const sortParam = useRouteQueryValue(QUERY_KEYS.sort)
const updateQuery = useQueryUpdater({ history: 'push' })
const sort = computed<ClientSortValue>(() => fromSlug(CLIENT_SORT_SLUGS, sortParam.value) || 'newest')
const sortOptions = CLIENT_SORTS.map(value => ({ value, label: CLIENT_SORT_LABELS[value] }))
const selectedSort = computed({
  get: () => sort.value as string,
  set: value => updateQuery({ [QUERY_KEYS.sort]: value === 'newest' ? null : CLIENT_SORT_SLUGS[value as ClientSortValue] }),
})

const { data: clients, status, error, refresh } = await useFetch('/api/clients', {
  query: computed(() => ({ search: search.value || undefined, sort: sort.value === 'newest' ? undefined : sort.value })),
  lazy: true,
})

const isInitialLoading = computed(() => status.value === 'pending' && !clients.value)
const isRefreshing = computed(() => status.value === 'pending' && Boolean(clients.value))
const modalOpen = ref(false)

function onSaved(client: ClientListItem) {
  // A new client may not match the active search; clear it so it is visible.
  if (search.value && !client.name.toLocaleLowerCase('tr-TR').includes(search.value.toLocaleLowerCase('tr-TR'))) {
    searchInput.value = ''
  }
  refresh()
}
</script>

<template>
  <div>
    <UiPageHeader
      title="Müşteriler"
      description="Ajansınızın müşterilerini ve içerik sayılarını görüntüleyin."
    >
      <template #actions>
        <UiButton @click="modalOpen = true">
          <template #icon>
            <UserPlus
              class="size-4"
              aria-hidden="true"
            />
          </template>
          Yeni müşteri
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <UiSearchInput
          v-model="searchInput"
          class="w-full sm:max-w-xs"
          label="Firma adına göre ara"
          placeholder="Firma adına göre ara…"
        />
        <div class="flex items-center gap-4">
          <p
            v-if="clients"
            class="whitespace-nowrap text-sm text-ink-500"
            aria-live="polite"
          >
            <span class="font-medium tabular-nums text-ink-900">{{ clients.length }}</span>
            {{ search ? 'sonuç' : 'müşteri' }}
          </p>
          <UiListbox
            v-model="selectedSort"
            class="w-full sm:w-52"
            label="Sıralama"
            :options="sortOptions"
          />
        </div>
      </div>

      <UiErrorState
        v-if="error && !clients"
        :message="getApiErrorMessage(error)"
        :retrying="status === 'pending'"
        @retry="refresh()"
      />

      <UiListSkeleton
        v-else-if="isInitialLoading"
        :rows="6"
      />

      <template v-else-if="clients">
        <UiEmptyState
          v-if="clients.length === 0 && search"
          :icon="SearchX"
          title="Sonuç bulunamadı"
          :description="`“${search}” aramasıyla eşleşen bir müşteri yok.`"
        >
          <UiButton
            variant="secondary"
            @click="searchInput = ''"
          >
            Aramayı temizle
          </UiButton>
        </UiEmptyState>

        <UiEmptyState
          v-else-if="clients.length === 0"
          :icon="Users"
          title="Henüz müşteri yok"
          description="İlk müşterinizi ekleyerek içeriklerini takip etmeye başlayın."
        >
          <UiButton @click="modalOpen = true">
            Müşteri ekle
          </UiButton>
        </UiEmptyState>

        <ClientTable
          v-else
          :items="clients"
          class="transition-opacity"
          :class="isRefreshing && 'opacity-60'"
        />
      </template>
    </div>

    <ClientFormModal
      :open="modalOpen"
      @close="modalOpen = false"
      @saved="onSaved"
    />
  </div>
</template>
