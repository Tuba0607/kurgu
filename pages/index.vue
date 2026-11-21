<script setup lang="ts">
import { ArrowRight, FilePlus2, FileText, UserPlus, Users } from 'lucide-vue-next'

useHead({ title: 'Genel bakış' })

const { data, status, error, refresh } = await useFetch('/api/dashboard', { lazy: true })

const isInitialLoading = computed(() => status.value === 'pending' && !data.value)
const isRetrying = computed(() => status.value === 'pending' && Boolean(error.value))

const clientModalOpen = ref(false)
const contentModalOpen = ref(false)
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
      aria-label="Genel bakış yükleniyor"
    >
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <div
          v-for="card in 2"
          :key="card"
          class="card flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4"
        >
          <UiSkeleton class="h-3.5 w-24" />
          <UiSkeleton class="h-7 w-10" />
        </div>
      </div>
      <div class="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-3">
        <div class="card">
          <div class="border-b border-ink-100 px-5 py-4">
            <UiSkeleton class="h-4 w-28" />
          </div>
          <div class="flex flex-col items-center gap-4 p-5">
            <UiSkeleton class="size-44 rounded-full" />
            <UiSkeleton class="h-4 w-48" />
          </div>
        </div>
        <div class="card xl:col-span-2">
          <UiListSkeleton :rows="6" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <section aria-label="Özet istatistikler">
        <!-- Two equal columns spanning the full content width -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <UiStatCard
            label="Toplam müşteri"
            :value="data.totals.clients"
            :icon="Users"
            to="/clients"
          />
          <UiStatCard
            label="Toplam içerik"
            :value="data.totals.contents"
            :icon="FileText"
            to="/contents"
          />
        </div>
      </section>

      <!-- Distribution (1/3) + recent contents (2/3) with equal outer heights (grid stretch) from xl;
           stacked on tablets and phones, where side-by-side columns would be too narrow. -->
      <div class="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-3">
        <section
          class="card flex flex-col"
          aria-labelledby="distribution-title"
        >
          <div class="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4">
            <h2
              id="distribution-title"
              class="text-sm font-semibold text-ink-900"
            >
              Durum dağılımı
            </h2>
          </div>
          <!-- Donut + legend centred vertically in the remaining height -->
          <div class="flex flex-1 flex-col justify-center px-5 pb-4 pt-5">
            <DashboardStatusDonut :counts="data.statusCounts" />
          </div>
          <!-- Action row: contents waiting for approval (hidden when there are none) -->
          <div
            v-if="data.statusCounts.IN_REVIEW > 0"
            class="flex items-center justify-between gap-3 border-t border-ink-100 px-5 py-3"
          >
            <p class="flex min-w-0 items-center gap-2 text-sm text-ink-700">
              <span
                class="size-2 shrink-0 rounded-full"
                :class="CONTENT_STATUS_STYLES.IN_REVIEW.dot"
                aria-hidden="true"
              />
              <span><span class="font-semibold tabular-nums text-ink-900">{{ data.statusCounts.IN_REVIEW }}</span> içerik onay bekliyor</span>
            </p>
            <NuxtLink
              :to="{ path: '/contents', query: { status: 'IN_REVIEW' } }"
              class="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-ink-600 hover:text-ink-900"
              aria-label="Onay bekleyen içeriklerin detaylarını gör"
            >
              Detayları gör
              <ArrowRight
                class="size-4"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </section>

        <!-- Recent contents -->
        <section
          class="card overflow-hidden xl:col-span-2"
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
                class="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-ink-50/80"
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
                  short
                  class="hidden w-36 shrink-0 xl:inline-flex"
                />
                <span class="flex shrink-0 justify-end sm:w-32">
                  <ContentStatusBadge :status="content.status" />
                </span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
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
