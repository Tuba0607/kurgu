<script setup lang="ts">
import { ArrowLeft, Check, Copy, FilePlus2, FileText, Mail, Phone, SearchX } from 'lucide-vue-next'
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES } from '#shared/constants/content'
import type { ClientDetail } from '~/types/api'
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

const counts = computed(() => countContentsByStatus(client.value?.contents ?? []))

// Informational summary (not interactive): filtering is done only via the tabs below.
const summaryCards = computed(() => [
  { key: 'total', label: 'Toplam içerik', count: counts.value.total, dot: 'bg-ink-700' },
  ...CONTENT_STATUSES.map(value => ({
    key: value,
    label: CONTENT_STATUS_LABELS[value],
    count: counts.value[value],
    dot: CONTENT_STATUS_STYLES[value].dot,
  })),
])

// Status tabs, synced with the URL (?status=...). Defaults to "Tümü".
const statusParam = useRouteQueryValue('status')
const updateQuery = useQueryUpdater()
const activeStatus = computed<StatusFilterValue>(() => (isContentStatus(statusParam.value) ? statusParam.value : ''))

interface StatusTab {
  value: StatusFilterValue
  label: string
  count: number
  id: string
}

const statusTabs = computed<StatusTab[]>(() => [
  { value: '', label: 'Tümü', count: counts.value.total, id: 'client-tab-all' },
  ...CONTENT_STATUSES.map(value => ({
    value,
    label: CONTENT_STATUS_LABELS[value],
    count: counts.value[value],
    id: `client-tab-${value.toLowerCase()}`,
  })),
])

const activeTabId = computed(() => statusTabs.value.find(tab => tab.value === activeStatus.value)?.id)
const filteredContents = computed(() => filterContentsByStatus(client.value?.contents ?? [], activeStatus.value))

function selectStatus(value: StatusFilterValue) {
  if (value !== activeStatus.value) updateQuery({ status: value })
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
      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div
          v-for="card in 4"
          :key="card"
          class="card space-y-3 p-4"
        >
          <UiSkeleton class="h-3 w-20" />
          <UiSkeleton class="h-7 w-10" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="card space-y-4 p-5">
          <UiSkeleton
            v-for="row in 4"
            :key="row"
            class="h-4 w-full"
          />
        </div>
        <div class="card lg:col-span-2">
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
            <h1 class="break-words text-2xl font-semibold tracking-tight text-ink-900">
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
          Yeni içerik
        </UiButton>
      </div>

      <!-- Status summary: informational only -->
      <section
        class="mb-6"
        aria-label="İçerik durum özeti"
      >
        <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div
            v-for="card in summaryCards"
            :key="card.key"
            class="card flex min-w-0 flex-col gap-2 p-4"
          >
            <dt class="flex items-center gap-2 text-[13px] font-medium text-ink-500">
              <span
                class="size-2 shrink-0 rounded-full"
                :class="card.dot"
                aria-hidden="true"
              />
              {{ card.label }}
            </dt>
            <dd class="text-[28px] font-semibold leading-none tabular-nums tracking-tight text-ink-900">
              {{ card.count }}
            </dd>
          </div>
        </dl>
      </section>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <!-- Client info -->
        <section
          class="card p-5"
          aria-labelledby="client-info-title"
        >
          <h2
            id="client-info-title"
            class="text-sm font-semibold text-ink-900"
          >
            Müşteri bilgileri
          </h2>
          <dl class="mt-4 divide-y divide-ink-100 text-sm">
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
              <dd class="text-right">
                <a
                  v-if="client.phone"
                  :href="`tel:${client.phone.replace(/[^\d+]/g, '')}`"
                  class="inline-flex items-center gap-1.5 font-medium tabular-nums text-ink-600 hover:text-ink-900 hover:underline"
                >
                  <Phone
                    class="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {{ client.phone }}
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
          class="card overflow-hidden lg:col-span-2"
          aria-labelledby="client-contents-title"
        >
          <div class="flex flex-col gap-3 border-b border-ink-100 px-4 pt-4 sm:px-5">
            <h2
              id="client-contents-title"
              class="text-sm font-semibold text-ink-900"
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
                class="flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-sm transition-colors focus-visible:ring-inset focus-visible:ring-offset-0"
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
                  class="rounded-full px-1.5 py-px text-xs font-medium tabular-nums"
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
            <UiEmptyState
              v-if="client.contents.length === 0"
              :icon="FileText"
              title="Bu müşteriye ait içerik yok"
              description="Müşteri için ilk içeriği oluşturarak başlayın."
            >
              <UiButton @click="openCreate">
                İçerik oluştur
              </UiButton>
            </UiEmptyState>

            <UiEmptyState
              v-else-if="filteredContents.length === 0 && activeStatus"
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

            <ContentTable
              v-else
              :items="filteredContents"
              :show-client="false"
              @edit="openEdit"
            />
          </div>
        </section>
      </div>
    </template>

    <ContentFormModal
      :open="contentModalOpen"
      :content-id="editingContentId"
      :default-client-id="client?.id"
      @close="contentModalOpen = false"
      @saved="refresh()"
    />
  </div>
</template>
