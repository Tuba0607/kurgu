<script setup lang="ts">
import { ArrowLeft, Check, Copy, FilePlus2, FileText, Mail, Pencil, Phone, SearchX, Trash2 } from 'lucide-vue-next'
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES } from '#shared/constants/content'
import { CONTENT_PAGE_SIZE } from '#shared/schemas/content'
import type { ClientDetail, ClientListItem, ContentListPage } from '~/types/api'
import type { StatusFilterValue } from '~/utils/content-filters'

const route = useRoute()
const clientId = computed(() => String(route.params.id))

const { data: client, status, error, refresh } = await useFetch<ClientDetail>(() => clientApiPath(clientId.value), {
  lazy: true,
})

useHead({ title: () => client.value?.name ?? 'Müşteri' })

const isNotFound = computed(() => {
  const code = getApiStatusCode(error.value)
  return code === 404 || code === 400
})

// Return a real 404 status for server-rendered "not found" pages.
if (import.meta.server && isNotFound.value) {
  setResponseStatus(useRequestEvent()!, 404)
}

// Status tabs, synced with the URL (?status=...). Defaults to "Tümü".
const statusParam = useRouteQueryValue('status')
const page = computed(() => parsePageParam(useRouteQueryValue('page').value))
const updateQuery = useQueryUpdater()
const activeStatus = computed<StatusFilterValue>(() => (isContentStatus(statusParam.value) ? statusParam.value : ''))

interface StatusTab {
  value: StatusFilterValue
  label: string
  count: number
  id: string
}

const statusTabs = computed<StatusTab[]>(() => [
  { value: '', label: 'Tümü', count: client.value?.contentCount ?? 0, id: 'client-tab-all' },
  ...CONTENT_STATUSES.map(value => ({
    value,
    label: CONTENT_STATUS_LABELS[value],
    count: client.value?.statusCounts[value] ?? 0,
    id: `client-tab-${value.toLowerCase()}`,
  })),
])

const activeTabId = computed(() => statusTabs.value.find(tab => tab.value === activeStatus.value)?.id)
// The client's contents are paginated on the server (same endpoint as the contents page).
const { data: listing, refresh: refreshContents } = await useFetch<ContentListPage>('/api/contents', {
  key: 'client-contents',
  query: computed(() => ({
    clientId: clientId.value,
    status: activeStatus.value || undefined,
    page: page.value > 1 ? page.value : undefined,
    pageSize: CONTENT_PAGE_SIZE,
  })),
  lazy: true,
})

// A page that no longer exists falls back to the last valid one.
watch(listing, (value) => {
  if (import.meta.server || !value || value.page <= Math.max(value.totalPages, 1)) return
  updateQuery({ page: value.totalPages > 1 ? String(value.totalPages) : null })
}, { immediate: true })

function selectStatus(value: StatusFilterValue) {
  // Changing the status filter always starts again from page 1.
  if (value !== activeStatus.value) updateQuery({ status: value, page: null })
}

function goToPage(target: number) {
  updateQuery({ page: target > 1 ? String(target) : null })
}

// WAI-ARIA tabs keyboard pattern: arrows / Home / End move and activate.
const tabElements = ref<HTMLButtonElement[]>([])

function onTabKeydown(event: KeyboardEvent, index: number) {
  const last = statusTabs.value.length - 1
  const targets: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }
  const next = targets[event.key]
  if (next === undefined) return
  event.preventDefault()
  selectStatus(statusTabs.value[next]!.value)
  tabElements.value[next]?.focus()
}

// Email: full address is shown (wrapping) and can be copied.
const { copy } = useCopyToClipboard()
const emailCopied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyEmail(email: string) {
  if (!(await copy(email, 'E-posta adresi kopyalandı'))) return
  emailCopied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (emailCopied.value = false), 2000)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))

// Client edit: only the client's own fields change; its contents stay as they are.
const clientModalOpen = ref(false)

function onClientSaved(updated: ClientListItem) {
  if (!client.value) return
  const { contentCount: _contentCount, ...fields } = updated
  client.value = { ...client.value, ...fields }
}

// Delete: cascades to the client's contents (the dialog shows how many).
const deleteOpen = ref(false)
const deleting = ref(false)
const toast = useToast()

async function deleteClient() {
  if (!client.value) return
  deleting.value = true
  try {
    const { deletedContents } = await $fetch<{ deletedContents: number }>(clientApiPath(client.value.id), { method: 'DELETE' })
    toast.success('Müşteri silindi', deletedContents > 0 ? `${client.value.name} ve ${deletedContents} içerik silindi.` : `${client.value.name} silindi.`)
    deleteOpen.value = false
    await navigateTo('/clients')
  }
  catch (error) {
    toast.error('Müşteri silinemedi', getApiErrorMessage(error))
  }
  finally {
    deleting.value = false
  }
}

const contentModalOpen = ref(false)
const editingContentId = ref<string | null>(null)

function openCreate() {
  editingContentId.value = null
  contentModalOpen.value = true
}

function openEdit(id: string) {
  editingContentId.value = id
  contentModalOpen.value = true
}

// Refresh counts and the current page; a new content (newest first) is shown on page 1.
function onContentSaved() {
  refresh()
  if (!editingContentId.value && page.value > 1) updateQuery({ page: null })
  else refreshContents()
}
</script>

<template>
  <div>
    <NuxtLink
      to="/clients"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft
        class="size-4"
        aria-hidden="true"
      />
      Müşteriler
    </NuxtLink>

    <!-- Not found -->
    <div
      v-if="error && isNotFound"
      class="card"
    >
      <UiEmptyState
        :icon="SearchX"
        title="Müşteri bulunamadı"
        description="Bu müşteri kaydı mevcut değil ya da adres hatalı."
      >
        <UiButton
          to="/clients"
          variant="secondary"
        >
          Müşteri listesine dön
        </UiButton>
      </UiEmptyState>
    </div>

    <!-- Other errors -->
    <div
      v-else-if="error && !client"
      class="card"
    >
      <UiErrorState
        :message="getApiErrorMessage(error)"
        :retrying="status === 'pending'"
        @retry="refresh()"
      />
    </div>

    <!-- Loading -->
    <div
      v-else-if="!client"
      role="status"
      aria-label="Müşteri yükleniyor"
    >
      <div class="mb-6 flex items-center gap-4">
        <UiSkeleton class="size-12 rounded-xl" />
        <div class="space-y-2">
          <UiSkeleton class="h-6 w-48" />
          <UiSkeleton class="h-4 w-24" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="card space-y-4 p-5">
          <UiSkeleton
            v-for="row in 4"
            :key="row"
            class="h-4 w-full"
          />
        </div>
        <div class="card xl:col-span-2">
          <UiListSkeleton :rows="4" />
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Header: avatar beside the name keeps the section compact -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <span
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-base font-semibold text-white"
            aria-hidden="true"
          >{{ getInitials(client.name) }}</span>
          <div class="min-w-0">
            <h1 class="display-title break-words text-[24px] leading-tight text-ink-900 sm:text-[28px]">
              {{ client.name }}
            </h1>
            <p
              v-if="client.industry"
              class="mt-0.5 text-sm text-ink-500"
            >
              {{ client.industry }}
            </p>
          </div>
        </div>
        <UiButton
          class="self-start sm:self-auto"
          @click="openCreate"
        >
          <template #icon>
            <FilePlus2
              class="size-4"
              aria-hidden="true"
            />
          </template>
          Bu müşteriye içerik ekle
        </UiButton>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <!-- Client info -->
        <section
          class="card p-5"
          aria-labelledby="client-info-title"
        >
          <div class="flex items-center justify-between gap-3">
            <h2
              id="client-info-title"
              class="section-label"
            >
              Müşteri bilgileri
            </h2>
            <div class="-my-1 -mr-2 flex items-center">
              <UiButton
                variant="ghost"
                size="sm"
                aria-label="Müşteri bilgilerini düzenle"
                @click="clientModalOpen = true"
              >
                <template #icon>
                  <Pencil
                    class="size-3.5"
                    aria-hidden="true"
                  />
                </template>
                Düzenle
              </UiButton>
              <UiButton
                variant="ghost"
                size="sm"
                aria-label="Müşteriyi sil"
                @click="deleteOpen = true"
              >
                <template #icon>
                  <Trash2
                    class="size-3.5"
                    aria-hidden="true"
                  />
                </template>
                Sil
              </UiButton>
            </div>
          </div>
          <dl class="mt-3 divide-y divide-ink-100 text-sm">
            <div class="flex justify-between gap-4 py-2.5">
              <dt class="shrink-0 text-ink-500">
                Yetkili
              </dt>
              <dd class="text-right font-medium text-ink-900">
                {{ client.contactName ?? EMPTY_VALUE }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 py-2.5">
              <dt class="shrink-0 text-ink-500">
                Sektör
              </dt>
              <dd class="text-right font-medium text-ink-900">
                {{ client.industry ?? EMPTY_VALUE }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 py-2.5">
              <dt class="shrink-0 text-ink-500">
                E-posta
              </dt>
              <dd class="flex min-w-0 items-start justify-end gap-1">
                <template v-if="client.email">
                  <!-- Full address, wrapping when long (no truncation) -->
                  <a
                    :href="`mailto:${client.email}`"
                    class="inline-flex min-w-0 items-start gap-1.5 text-right font-medium text-ink-600 hover:text-ink-900 hover:underline"
                  >
                    <Mail
                      class="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span class="min-w-0 [overflow-wrap:anywhere]"><template
                      v-for="(part, index) in splitEmailForWrapping(client.email)"
                      :key="index"
                    >{{ part }}<wbr></template></span>
                  </a>
                  <button
                    type="button"
                    class="-my-1 flex size-7 shrink-0 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
                    :aria-label="emailCopied ? 'E-posta adresi kopyalandı' : 'E-posta adresini kopyala'"
                    :title="emailCopied ? 'Kopyalandı' : 'E-posta adresini kopyala'"
                    @click="copyEmail(client.email)"
                  >
                    <Check
                      v-if="emailCopied"
                      class="size-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    <Copy
                      v-else
                      class="size-3.5"
                      aria-hidden="true"
                    />
                  </button>
                </template>
                <span
                  v-else
                  class="text-ink-900"
                >{{ EMPTY_VALUE }}</span>
              </dd>
            </div>
            <div class="flex justify-between gap-4 py-2.5">
              <dt class="shrink-0 text-ink-500">
                Telefon
              </dt>
              <dd class="min-w-0 text-right">
                <!-- Long legacy values wrap instead of widening the card -->
                <a
                  v-if="client.phone"
                  :href="`tel:${client.phone.replace(/[^\d+]/g, '')}`"
                  class="inline-flex min-w-0 max-w-full items-start gap-1.5 font-medium tabular-nums text-ink-600 hover:text-ink-900 hover:underline"
                >
                  <Phone
                    class="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span class="min-w-0 [overflow-wrap:anywhere]">{{ client.phone }}</span>
                </a>
                <span
                  v-else
                  class="text-ink-900"
                >{{ EMPTY_VALUE }}</span>
              </dd>
            </div>
            <div class="flex justify-between gap-4 py-2.5">
              <dt class="shrink-0 text-ink-500">
                Eklenme tarihi
              </dt>
              <dd class="text-right font-medium tabular-nums text-ink-900">
                {{ formatDate(client.createdAt) }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Client contents: the tabs are the only status filter on this page -->
        <section
          class="card overflow-hidden xl:col-span-2"
          aria-labelledby="client-contents-title"
        >
          <div class="flex flex-col gap-3 border-b border-ink-100 px-4 pt-4 sm:px-5">
            <h2
              id="client-contents-title"
              class="section-label"
            >
              İçerikler
            </h2>
            <div
              class="-mb-px flex justify-between overflow-x-auto sm:justify-start sm:gap-6"
              role="tablist"
              aria-label="İçerik durumu"
            >
              <button
                v-for="(tab, index) in statusTabs"
                :id="tab.id"
                :key="tab.id"
                :ref="el => { if (el) tabElements[index] = el as HTMLButtonElement }"
                type="button"
                role="tab"
                class="flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 pb-3 text-[13px] transition-colors sm:gap-1.5 sm:text-sm focus-visible:ring-inset focus-visible:ring-offset-0"
                :class="activeStatus === tab.value
                  ? 'border-brand font-semibold text-ink-900'
                  : 'border-transparent font-medium text-ink-500 hover:text-ink-900'"
                :aria-selected="activeStatus === tab.value"
                aria-controls="client-contents-panel"
                :tabindex="activeStatus === tab.value ? 0 : -1"
                @click="selectStatus(tab.value)"
                @keydown="onTabKeydown($event, index)"
              >
                {{ tab.label }}
                <span
                  class="rounded-full px-1 py-px text-[11px] font-medium tabular-nums sm:px-1.5 sm:text-xs"
                  :class="activeStatus === tab.value ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600'"
                >{{ tab.count }}</span>
              </button>
            </div>
          </div>

          <div
            id="client-contents-panel"
            role="tabpanel"
            :aria-labelledby="activeTabId"
          >
            <UiListSkeleton
              v-if="!listing"
              :rows="4"
            />

            <UiEmptyState
              v-else-if="client.contentCount === 0"
              :icon="FileText"
              title="Bu müşteriye ait içerik yok"
              description="Müşteri için ilk içeriği oluşturarak başlayın."
            >
              <UiButton @click="openCreate">
                İçerik oluştur
              </UiButton>
            </UiEmptyState>

            <UiEmptyState
              v-else-if="listing.total === 0 && activeStatus"
              :icon="FileText"
              :title="`${CONTENT_STATUS_LABELS[activeStatus]} durumunda içerik yok`"
              description="Bu müşterinin bu durumda içeriği bulunmuyor. Farklı bir sekme seçebilirsiniz."
            >
              <UiButton
                variant="secondary"
                @click="selectStatus('')"
              >
                Tüm içerikleri göster
              </UiButton>
            </UiEmptyState>

            <template v-else>
              <ContentTable
                :items="listing.items"
                :show-client="false"
                @edit="openEdit"
              />
              <UiPagination
                :page="listing.page"
                :total-pages="listing.totalPages"
                :total="listing.total"
                :page-size="listing.pageSize"
                @change="goToPage"
              />
            </template>
          </div>
        </section>
      </div>
    </template>

    <UiConfirmDialog
      v-if="client"
      :open="deleteOpen"
      title="Müşteri silinsin mi?"
      :description="client.contentCount > 0
        ? `${client.name} silinecek. Bu müşteriye bağlı ${client.contentCount} içerik de silinecek. Bu işlem geri alınamaz.`
        : `${client.name} kalıcı olarak silinecek. Bu işlem geri alınamaz.`"
      :confirm-label="client.contentCount > 0 ? `Müşteriyi ve ${client.contentCount} içeriği sil` : 'Müşteriyi sil'"
      :loading="deleting"
      @confirm="deleteClient"
      @cancel="deleteOpen = false"
    />

    <ClientFormModal
      :open="clientModalOpen"
      :client="client"
      @close="clientModalOpen = false"
      @saved="onClientSaved"
    />
    <ContentFormModal
      :open="contentModalOpen"
      :content-id="editingContentId"
      :default-client-id="client?.id"
      @close="contentModalOpen = false"
      @saved="onContentSaved"
    />
  </div>
</template>
