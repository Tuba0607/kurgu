<script setup lang="ts">
import { FilePlus2, FileText, SearchX, X } from 'lucide-vue-next'
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES } from '#shared/constants/content'
import { ID_PATTERN } from '#shared/schemas/common'

useHead({ title: 'İçerikler' })

// Filters live in the URL so they survive reloads and can be shared.
const { input: searchInput, applied: search } = useDebouncedQuerySearch('search')
const statusParam = useRouteQueryValue('status')
const clientIdParam = useRouteQueryValue('clientId')
// Discrete filter changes (status, client, chip removal) create history entries.
const updateQuery = useQueryUpdater({ history: 'push' })

// Invalid values in a hand-edited URL are ignored instead of causing an API error.
const status = computed(() => (isContentStatus(statusParam.value) ? statusParam.value : ''))
const clientId = computed(() => (ID_PATTERN.test(clientIdParam.value) ? clientIdParam.value : ''))
// Filters applied to the current result set (debounced URL values): drive the result label and empty state.
const hasAppliedFilters = computed(() => hasActiveContentFilters({
  search: search.value,
  status: status.value,
  clientId: clientId.value,
}))

const { data: contents, status: fetchStatus, error, refresh } = await useFetch('/api/contents', {
  query: computed(() => ({
    search: search.value || undefined,
    status: status.value || undefined,
    clientId: clientId.value || undefined,
  })),
  lazy: true,
})

const { data: clients } = await useFetch('/api/clients', {
  key: 'content-filter-clients',
  lazy: true,
})

// "Tüm müşteriler" is a real choice (no client filter), listed first.
const clientFilterOptions = computed(() => [
  { value: '', label: 'Tüm müşteriler' },
  ...(clients.value ?? []).map(client => ({ value: client.id, label: client.name })),
])

const statusTabs = [
  { value: '', label: 'Tümü' },
  ...CONTENT_STATUSES.map(value => ({ value, label: CONTENT_STATUS_LABELS[value] })),
] as const

const selectedClientId = computed({
  get: () => clientId.value,
  set: value => updateQuery({ clientId: value }),
})

const isInitialLoading = computed(() => fetchStatus.value === 'pending' && !contents.value)
const isRefreshing = computed(() => fetchStatus.value === 'pending' && Boolean(contents.value))

// Active filter chips: derived from the applied (URL) filters, so browser
// back/forward and shared links always show the right chips.
const selectedClientName = computed(() => clients.value?.find(client => client.id === clientId.value)?.name)
const activeChips = computed(() => buildActiveFilterChips(
  { search: search.value, status: status.value, clientId: clientId.value },
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
  await updateQuery({ [param]: null })
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

    <div class="card overflow-hidden">
      <!-- Filters -->
      <div class="space-y-3 border-b border-ink-100 p-4 sm:px-5">
        <div class="flex flex-wrap items-center gap-3">
          <UiSearchInput
            v-model="searchInput"
            class="w-full sm:w-64 lg:w-72"
            label="Başlığa göre ara"
            placeholder="Başlığa göre ara…"
          />
          <UiListbox
            v-model="selectedClientId"
            class="w-full sm:w-56"
            label="Müşteriye göre filtrele"
            :options="clientFilterOptions"
          />
          <div
            class="grid w-full grid-cols-4 gap-1 rounded-lg bg-ink-100 p-1 sm:inline-flex sm:w-auto"
            role="group"
            aria-label="Duruma göre filtrele"
          >
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition"
              :class="status === tab.value
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-600 hover:text-ink-900'"
              :aria-pressed="status === tab.value"
              @click="updateQuery({ status: tab.value })"
            >
              <span
                v-if="tab.value"
                class="hidden size-1.5 rounded-full sm:block"
                :class="CONTENT_STATUS_STYLES[tab.value].dot"
                aria-hidden="true"
              />
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Result count + removable chips for the applied filters -->
        <div class="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-2">
          <p
            ref="resultSummary"
            class="rounded-md text-sm text-ink-500 focus:outline-none"
            tabindex="-1"
            aria-live="polite"
          >
            <template v-if="contents">
              <span class="font-medium tabular-nums text-ink-900">{{ contents.length }}</span>
              {{ hasAppliedFilters ? 'sonuç bulundu' : 'içerik' }}
            </template>
          </p>

          <ul
            v-if="activeChips.length > 0"
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
        v-if="error && !contents"
        :message="getApiErrorMessage(error)"
        :retrying="fetchStatus === 'pending'"
        @retry="refresh()"
      />

      <UiListSkeleton
        v-else-if="isInitialLoading"
        :rows="8"
      />

      <template v-else-if="contents">
        <UiEmptyState
          v-if="contents.length === 0 && hasAppliedFilters"
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
          v-else-if="contents.length === 0"
          :icon="FileText"
          title="Henüz içerik yok"
          description="İlk içeriği oluşturarak müşterileriniz için içerik takibine başlayın."
        >
          <UiButton @click="openCreate">
            İçerik oluştur
          </UiButton>
        </UiEmptyState>

        <ContentTable
          v-else
          :items="contents"
          class="transition-opacity"
          :class="isRefreshing && 'opacity-60'"
          @edit="openEdit"
        />
      </template>
    </div>

    <ContentFormModal
      :open="modalOpen"
      :content-id="editingContentId"
      :default-client-id="clientId || null"
      @close="modalOpen = false"
      @saved="refresh()"
    />
  </div>
</template>
