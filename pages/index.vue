<script setup lang="ts">
import { ArrowRight, FilePlus2, FileText, UserPlus, Users } from 'lucide-vue-next'
import { CONTENT_STATUS_LABELS, CONTENT_STATUSES } from '#shared/constants/content'

useHead({ title: 'Dashboard' })

const { data, status, error, refresh } = await useFetch('/api/dashboard', { lazy: true })

const isInitialLoading = computed(() => status.value === 'pending' && !data.value)
const isRetrying = computed(() => status.value === 'pending' && Boolean(error.value))

const clientModalOpen = ref(false)
const contentModalOpen = ref(false)

const statusRows = computed(() => {
  const summary = data.value
  if (!summary) return []
  return CONTENT_STATUSES.map(status => ({
    status,
    label: CONTENT_STATUS_LABELS[status],
    count: summary.statusCounts[status],
    percent: formatPercent(summary.statusCounts[status], summary.totals.contents),
    width: summary.totals.contents === 0 ? 0 : (summary.statusCounts[status] / summary.totals.contents) * 100,
  }))
})
</script>

<template>
  <div>
    <UiPageHeader
      title="Genel bakış"
      description="Müşterilerinizin ve içeriklerinizin güncel durumu."
    >
      <template #actions>
        <UiButton
          variant="secondary"
          @click="clientModalOpen = true"
        >
          <template #icon>
            <UserPlus
              class="size-4"
              aria-hidden="true"
            />
          </template>
          Yeni müşteri
        </UiButton>
        <UiButton @click="contentModalOpen = true">
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

    <!-- Error -->
    <div
      v-if="error && !data"
      class="card"
    >
      <UiErrorState
        :message="getApiErrorMessage(error)"
        :retrying="isRetrying"
        @retry="refresh()"
      />
    </div>

    <!-- Loading -->
    <div
      v-else-if="isInitialLoading"
      role="status"
      aria-label="Dashboard yükleniyor"
    >
      <div class="grid grid-cols-6 gap-3 sm:gap-4 lg:grid-cols-5">
        <div
          v-for="card in 5"
          :key="card"
          class="card space-y-5 p-4 sm:p-5 lg:col-span-1"
          :class="card <= 2 ? 'col-span-3' : 'col-span-2'"
        >
          <UiSkeleton class="h-3.5 w-24" />
          <UiSkeleton class="h-8 w-14" />
        </div>
      </div>
      <div class="card mt-4 flex flex-col gap-4 p-5 sm:mt-6 lg:flex-row lg:items-center lg:gap-8">
        <div class="space-y-2 lg:w-44">
          <UiSkeleton class="h-4 w-28" />
          <UiSkeleton class="h-3 w-20" />
        </div>
        <UiSkeleton class="h-2.5 w-full shrink-0 rounded-full lg:w-auto lg:flex-1" />
        <UiSkeleton class="h-4 w-64" />
      </div>
      <div class="card mt-4 sm:mt-6">
        <UiListSkeleton :rows="6" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <section aria-label="Özet istatistikler">
        <div class="grid grid-cols-6 gap-3 sm:gap-4 lg:grid-cols-5">
          <UiStatCard
            class="col-span-3 lg:col-span-1"
            label="Toplam müşteri"
            :value="data.totals.clients"
            :icon="Users"
            to="/clients"
          />
          <UiStatCard
            class="col-span-3 lg:col-span-1"
            label="Toplam içerik"
            :value="data.totals.contents"
            :icon="FileText"
            to="/contents"
          />
          <UiStatCard
            v-for="row in statusRows"
            :key="row.status"
            class="col-span-2 lg:col-span-1"
            :label="row.label"
            :value="row.count"
            :dot-class="CONTENT_STATUS_STYLES[row.status].dot"
            :hint="row.percent"
            :to="{ path: '/contents', query: { status: row.status } }"
          />
        </div>
      </section>

      <!-- Status distribution: compact row whose height follows its content -->
      <section
        class="card mt-4 p-5 sm:mt-6"
        aria-labelledby="distribution-title"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <div class="shrink-0 lg:w-44">
            <h2
              id="distribution-title"
              class="text-sm font-semibold text-ink-900"
            >
              Durum dağılımı
            </h2>
            <p class="mt-0.5 text-[13px] text-ink-500">
              Toplam {{ formatNumber(data.totals.contents) }} içerik
            </p>
          </div>

          <div
            class="flex h-2.5 w-full shrink-0 gap-0.5 overflow-hidden rounded-full lg:w-auto lg:flex-1 bg-ink-100"
            role="img"
            :aria-label="statusRows.map(row => `${row.label}: ${row.count}`).join(', ')"
          >
            <div
              v-for="row in statusRows"
              v-show="row.count > 0"
              :key="row.status"
              class="h-full transition-[width] duration-300"
              :class="CONTENT_STATUS_STYLES[row.status].bar"
              :style="{ width: `${row.width}%` }"
            />
          </div>

          <ul class="grid grid-cols-3 gap-2 lg:flex lg:shrink-0 lg:gap-5">
            <li
              v-for="row in statusRows"
              :key="row.status"
            >
              <NuxtLink
                :to="{ path: '/contents', query: { status: row.status } }"
                class="-mx-2 flex flex-col gap-0.5 rounded-lg px-2 py-1.5 transition hover:bg-ink-50 lg:flex-row lg:items-center lg:gap-2"
              >
                <span class="flex items-center gap-2 text-sm text-ink-600">
                  <span
                    class="size-2 shrink-0 rounded-full"
                    :class="CONTENT_STATUS_STYLES[row.status].dot"
                    aria-hidden="true"
                  />
                  {{ row.label }}
                </span>
                <span class="pl-4 text-sm lg:pl-0">
                  <span class="font-semibold tabular-nums text-ink-900">{{ row.count }}</span>
                  <span class="ml-1 text-xs tabular-nums text-ink-400">{{ row.percent }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>

      <!-- Recent contents -->
      <section
        class="card mt-4 overflow-hidden sm:mt-6"
        aria-labelledby="recent-contents-title"
      >
        <div class="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <h2
            id="recent-contents-title"
            class="text-sm font-semibold text-ink-900"
          >
            Son eklenen içerikler
          </h2>
          <NuxtLink
            to="/contents"
            class="inline-flex items-center gap-1 rounded-md text-sm font-medium text-ink-600 hover:text-ink-800"
          >
            Tümünü gör
            <ArrowRight
              class="size-4"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>

        <UiEmptyState
          v-if="data.recentContents.length === 0"
          :icon="FileText"
          title="Henüz içerik yok"
          description="İlk içeriği oluşturduğunuzda burada listelenecek."
        >
          <UiButton @click="contentModalOpen = true">
            İçerik oluştur
          </UiButton>
        </UiEmptyState>

        <ul
          v-else
          class="divide-y divide-ink-100"
        >
          <li
            v-for="content in data.recentContents"
            :key="content.id"
          >
            <NuxtLink
              :to="`/contents/${content.id}`"
              class="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ink-50/80"
            >
              <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-200/80">
                <component
                  :is="CONTENT_TYPE_ICONS[content.type]"
                  class="size-4"
                  aria-hidden="true"
                />
              </span>
              <span class="min-w-0 flex-1">
                <span class="line-clamp-2 break-words text-sm font-medium leading-snug text-ink-900">{{ content.title }}</span>
                <!-- The client name may shorten; the date always stays visible -->
                <span class="flex min-w-0 gap-1 text-[13px] text-ink-500">
                  <span class="truncate">{{ content.client.name }}</span>
                  <span class="shrink-0">· {{ formatDate(content.createdAt) }}</span>
                </span>
              </span>
              <ContentTypeBadge
                :type="content.type"
                class="hidden w-52 shrink-0 md:inline-flex"
              />
              <span class="flex w-24 shrink-0 justify-end">
                <ContentStatusBadge :status="content.status" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>

    <ClientFormModal
      :open="clientModalOpen"
      @close="clientModalOpen = false"
      @saved="refresh()"
    />
    <ContentFormModal
      :open="contentModalOpen"
      @close="contentModalOpen = false"
      @saved="refresh()"
    />
  </div>
</template>
