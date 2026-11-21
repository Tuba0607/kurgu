<script setup lang="ts">
import { FilePlus2, FileText, SearchX, X } from 'lucide-vue-next'
import { CONTENT_SORT_LABELS, CONTENT_SORTS, CONTENT_STATUS_LABELS, CONTENT_STATUSES, CONTENT_TYPE_LABELS, CONTENT_TYPES, type ContentSortValue, type ContentStatusValue } from '#shared/constants/content'
import type { ContentListItem } from '~/types/api'
import { ID_PATTERN } from '#shared/schemas/common'
import { CONTENT_PAGE_SIZE } from '#shared/schemas/content'

useHead({ title: 'İçerikler' })

// Filters live in the URL so they survive reloads and can be shared.
// A new search always starts again from page 1.
const { input: searchInput, applied: search } = useDebouncedQuerySearch('search', 300, ['page'])
const statusParam = useRouteQueryValue('status')
const clientIdParam = useRouteQueryValue('clientId')
const typeParam = useRouteQueryValue('type')
const sortParam = useRouteQueryValue('sort')
const page = computed(() => parsePageParam(useRouteQueryValue('page').value))
// Discrete filter changes (status, client, chip removal) create history entries.
const updateQuery = useQueryUpdater({ history: 'push' })
// Corrections (e.g. an out-of-range page) replace the history entry instead.
const replaceQuery = useQueryUpdater()

// Invalid values in a hand-edited URL are ignored instead of causing an API error.
const status = computed(() => (isContentStatus(statusParam.value) ? statusParam.value : ''))
const clientId = computed(() => (ID_PATTERN.test(clientIdParam.value) ? clientIdParam.value : ''))
const type = computed(() => ((CONTENT_TYPES as readonly string[]).includes(typeParam.value) ? typeParam.value : ''))
const sort = computed<ContentSortValue>(() => ((CONTENT_SORTS as readonly string[]).includes(sortParam.value) ? sortParam.value as ContentSortValue : 'newest'))
// Filters applied to the current result set (debounced URL values): drive the result label and empty state.
const hasAppliedFilters = computed(() => hasActiveContentFilters({
  search: search.value,
  status: status.value,
  clientId: clientId.value,
  type: type.value,
}))

// Paginated on the server: only the current page is loaded.
const { data: listing, status: fetchStatus, error, refresh } = await useFetch('/api/contents', {
  query: computed(() => ({
    search: search.value || undefined,
    status: status.value || undefined,
    clientId: clientId.value || undefined,
    type: type.value || undefined,
    sort: sort.value === 'newest' ? undefined : sort.value,
    page: page.value > 1 ? page.value : undefined,
    pageSize: CONTENT_PAGE_SIZE,
  })),
  lazy: true,
})

const contents = computed(() => listing.value?.items)

// A page that no longer exists (e.g. after filtering or deleting) falls back to the last valid one.
watch(listing, (value) => {
  if (import.meta.server || !value || value.page <= Math.max(value.totalPages, 1)) return
  replaceQuery({ page: value.totalPages > 1 ? String(value.totalPages) : null })
}, { immediate: true })

const listCard = ref<HTMLElement | null>(null)

async function goToPage(target: number) {
  await updateQuery({ page: target > 1 ? String(target) : null })
  // Bring the top of the list back into view when paging from the footer.
  if (listCard.value && listCard.value.getBoundingClientRect().top < 0) {
    listCard.value.scrollIntoView({ block: 'start' })
  }
}

const { data: clients } = await useFetch('/api/clients', {
  key: 'content-filter-clients',
  lazy: true,
})

// "Tüm müşteriler" is a real choice (no client filter), listed first.
const clientFilterOptions = computed(() => [
  { value: '', label: 'Tüm müşteriler' },
  ...(clients.value ?? []).map(client => ({ value: client.id, label: client.name })),
])

const typeFilterOptions = [
  { value: '', label: 'Tüm türler' },
  ...CONTENT_TYPES.map(value => ({ value, label: CONTENT_TYPE_LABELS[value] })),
]
const sortOptions = CONTENT_SORTS.map(value => ({ value, label: CONTENT_SORT_LABELS[value] }))

const selectedType = computed({
  get: () => type.value,
  set: value => updateQuery({ type: value, page: null }),
})
const selectedSort = computed({
  get: () => sort.value as string,
  set: value => updateQuery({ sort: value === 'newest' ? null : value, page: null }),
})

/** Count shown in each status tab (for the other active filters). */
function tabCount(value: string): number | null {
  const counts = listing.value?.statusCounts
  if (!counts) return null
  return value ? counts[value as ContentStatusValue] : Object.values(counts).reduce((sum, count) => sum + count, 0)
}

// Status changes from the list: saved immediately, undo from the toast.
const { changeStatus, pendingId } = useStatusChange(() => refresh())
function onStatusChange(item: ContentListItem, next: ContentStatusValue) {
  changeStatus(item.id, item.status, next)
}

const statusTabs = [
  { value: '', label: 'Tümü' },
  ...CONTENT_STATUSES.map(value => ({ value, label: CONTENT_STATUS_LABELS[value] })),
] as const

const selectedClientId = computed({
  get: () => clientId.value,
  set: value => updateQuery({ clientId: value, page: null }),
})

const isInitialLoading = computed(() => fetchStatus.value === 'pending' && !listing.value)
const isRefreshing = computed(() => fetchStatus.value === 'pending' && Boolean(listing.value))

// Active filter chips: derived from the applied (URL) filters, so browser
// back/forward and shared links always show the right chips.
const selectedClientName = computed(() => clients.value?.find(client => client.id === clientId.value)?.name)
const activeChips = computed(() => buildActiveFilterChips(
  { search: search.value, status: status.value, clientId: clientId.value, type: type.value },
  selectedClientName.value,
))

const resultSummary = ref<HTMLElement | null>(null)
const chipButtons = ref<Partial<Record<ContentFilterParam, HTMLButtonElement>>>({})

/** Removes one filter and keeps keyboard focus on the next chip (or the result summary). */
async function removeFilter(param: ContentFilterParam) {
  const params = activeChips.value.map(chip => chip.param)
  const index = params.indexOf(param)
  const nextParam = params[index + 1] ?? params[index - 1]

  if (param === 'search') searchInput.value = ''
  await updateQuery({ [param]: null, page: null })
  await nextTick()
  const target = (nextParam && chipButtons.value[nextParam]) || resultSummary.value
  target?.focus()
}

async function resetFilters() {
  searchInput.value = ''
  await updateQuery(contentFilterResetPatch())
  await nextTick()
  resultSummary.value?.focus()
}

const modalOpen = ref(false)
const editingContentId = ref<string | null>(null)

function openCreate() {
  editingContentId.value = null
  modalOpen.value = true
}

// New contents appear first (newest first), so show page 1 after creating one.
function onSaved() {
  if (!editingContentId.value && page.value > 1) updateQuery({ page: null })
  else refresh()
}

function openEdit(id: string) {
  editingContentId.value = id
  modalOpen.value = true
}
</script>

<template>
  <div>
    <UiPageHeader
      title="İçerikler"
      description="Tüm müşterilere ait içerikleri görüntüleyin, filtreleyin ve yönetin."
    >
      <template #actions>
        <UiButton @click="openCreate">
          <template #icon>
            <FilePlus2
              class="size-4"
              aria-hidden="true"
            />
          </template>
          Yeni içerik
        </UiButton>
      </template>
    </UiPageHeader>

    <div
      ref="listCard"
      class="card scroll-mt-4 overflow-hidden"
    >
      <!-- Filters -->
      <div class="space-y-3 border-b border-ink-100 p-4 sm:px-5">
        <!-- Status tabs with counts (for the other active filters) -->
        <div
          class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5"
          role="group"
          aria-label="Duruma göre filtrele"
        >
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition"
            :class="status === tab.value
              ? 'bg-ink-900 text-white'
              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'"
            :aria-pressed="status === tab.value"
            @click="updateQuery({ status: tab.value, page: null })"
          >
            <span
              v-if="tab.value"
              class="size-2 rounded-full"
              :class="CONTENT_STATUS_STYLES[tab.value].dot"
              aria-hidden="true"
            />
            {{ tab.label }}
            <span
              v-if="tabCount(tab.value) !== null"
              class="rounded-full px-1.5 text-xs tabular-nums"
              :class="status === tab.value ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'"
            >{{ tabCount(tab.value) }}</span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UiSearchInput
            v-model="searchInput"
            class="w-full sm:w-64 lg:w-72"
            label="Başlığa göre ara"
            placeholder="Başlığa göre ara…"
          />
          <UiListbox
            v-model="selectedClientId"
            class="w-full sm:w-52"
            label="Müşteriye göre filtrele"
            :options="clientFilterOptions"
          />
          <UiListbox
            v-model="selectedType"
            class="w-full sm:w-48"
            label="Türe göre filtrele"
            :options="typeFilterOptions"
          />
          <UiListbox
            v-model="selectedSort"
            class="w-full sm:ml-auto sm:w-56"
            label="Sıralama"
            :options="sortOptions"
          />
        </div>

        <!-- The visible total lives in the pagination footer; this announces result changes
             to screen readers and receives focus after filters are cleared. -->
        <p
          ref="resultSummary"
          class="sr-only"
          tabindex="-1"
          aria-live="polite"
        >
          <template v-if="listing">
            {{ listing.total }} {{ hasAppliedFilters ? 'sonuç bulundu' : 'içerik' }}
          </template>
        </p>

        <!-- Removable chips for the applied filters -->
        <div
          v-if="activeChips.length > 0"
          class="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-2"
        >
          <ul
            class="flex min-w-0 max-w-full flex-wrap items-center gap-2"
            aria-label="Aktif filtreler"
          >
            <li
              v-for="chip in activeChips"
              :key="chip.param"
              class="inline-flex h-8 max-w-full items-center gap-0.5 rounded-md border border-ink-200 bg-ink-50 pl-2.5 pr-0.5 text-[13px] font-medium text-ink-900"
            >
              <span
                class="max-w-[14rem] truncate"
                :title="chip.label"
              >{{ chip.label }}</span>
              <button
                :ref="el => { chipButtons[chip.param] = (el as HTMLButtonElement | null) ?? undefined }"
                type="button"
                class="flex size-7 shrink-0 items-center justify-center rounded text-ink-500 transition-colors hover:bg-ink-200/70 hover:text-ink-900 focus-visible:ring-offset-0"
                :aria-label="chip.removeLabel"
                @click="removeFilter(chip.param)"
              >
                <X
                  class="size-3.5"
                  aria-hidden="true"
                />
              </button>
            </li>
            <!-- Shown whenever at least one filter is active (the list itself is hidden otherwise). -->
            <li>
              <button
                type="button"
                class="h-8 rounded-md px-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900"
                @click="resetFilters"
              >
                Tümünü temizle
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- List -->
      <UiErrorState
        v-if="error && !listing"
        :message="getApiErrorMessage(error)"
        :retrying="fetchStatus === 'pending'"
        @retry="refresh()"
      />

      <UiListSkeleton
        v-else-if="isInitialLoading"
        :rows="8"
      />

      <template v-else-if="listing && contents">
        <UiEmptyState
          v-if="listing.total === 0 && hasAppliedFilters"
          :icon="SearchX"
          title="Filtrelere uygun içerik bulunamadı"
          description="Arama metnini veya filtreleri değiştirerek tekrar deneyin."
        >
          <UiButton
            variant="secondary"
            @click="resetFilters"
          >
            Filtreleri temizle
          </UiButton>
        </UiEmptyState>

        <UiEmptyState
          v-else-if="listing.total === 0"
          :icon="FileText"
          title="Henüz içerik yok"
          description="İlk içeriği oluşturarak müşterileriniz için içerik takibine başlayın."
        >
          <UiButton @click="openCreate">
            İçerik oluştur
          </UiButton>
        </UiEmptyState>

        <template v-else>
          <ContentTable
            :items="contents"
            class="transition-opacity"
            :class="isRefreshing && 'opacity-60'"
            :pending-id="pendingId"
            @edit="openEdit"
            @status-change="onStatusChange"
          />
          <UiPagination
            :page="listing.page"
            :total-pages="listing.totalPages"
            :total="listing.total"
            :page-size="listing.pageSize"
            @change="goToPage"
          />
        </template>
      </template>
    </div>

    <ContentFormModal
      :open="modalOpen"
      :content-id="editingContentId"
      :default-client-id="clientId || null"
      @close="modalOpen = false"
      @saved="onSaved"
    />
  </div>
</template>
