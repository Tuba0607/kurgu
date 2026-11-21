<script setup lang="ts">
import { ArrowRight, CalendarClock, CalendarX2, FilePlus2, FileText, UserPlus } from 'lucide-vue-next'
import { LONG_REVIEW_DAYS } from '#shared/constants/content'
import { CONTENT_SORT_SLUGS, PATHS, QUERY_KEYS, STATUS_SLUGS } from '#shared/constants/routes'

useHead({ title: 'Genel bakış' })

const { data, status, error, refresh } = await useFetch('/api/dashboard', { lazy: true })

const isInitialLoading = computed(() => status.value === 'pending' && !data.value)
const isRetrying = computed(() => status.value === 'pending' && Boolean(error.value))

const clientModalOpen = ref(false)
const contentModalOpen = ref(false)

const today = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

// "İncele →" opens the approval queue, longest waiting first.
const reviewLink = { path: PATHS.contents, query: { [QUERY_KEYS.status]: STATUS_SLUGS.IN_REVIEW, [QUERY_KEYS.sort]: CONTENT_SORT_SLUGS.waiting } }
const scheduleLink = { path: PATHS.contents, query: { [QUERY_KEYS.sort]: CONTENT_SORT_SLUGS.scheduled } }

const reviewNote = computed(() => {
  const review = data.value?.review
  if (!review || review.total === 0) return 'Şu an onay bekleyen içerik yok.'
  if (review.longWaiting === 0) return `Hiçbiri ${LONG_REVIEW_DAYS} günden uzun süredir beklemiyor.`
  return review.longWaiting === review.total
    ? `Hepsi ${LONG_REVIEW_DAYS} günden uzun süredir bekliyor.`
    : `${review.longWaiting}’si ${LONG_REVIEW_DAYS} günden uzun süredir bekliyor.`
})
</script>

<template>
  <div>
    <UiPageHeader
      title="Stüdyoda bugün"
      accent-dot
      description="Müşterilerinizin ve içeriklerinizin güncel durumu."
    >
      <template #eyebrow>
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">
          {{ today }}
        </p>
      </template>
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
      class="space-y-4 sm:space-y-6"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        <div class="card h-52 space-y-5 p-6 sm:col-span-2">
          <UiSkeleton class="h-3.5 w-40" />
          <UiSkeleton class="h-16 w-20" />
          <UiSkeleton class="h-4 w-64" />
        </div>
        <div
          v-for="card in 2"
          :key="card"
          class="card space-y-5 p-5"
        >
          <UiSkeleton class="h-3.5 w-32" />
          <UiSkeleton class="h-10 w-12" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-5">
        <div class="card h-64 xl:col-span-2" />
        <div class="card xl:col-span-3">
          <UiListSkeleton :rows="6" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <section
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
        aria-label="Eylem gerektirenler"
      >
        <!-- Main card: approval queue -->
        <div class="card relative flex flex-col justify-between gap-6 overflow-hidden border-sidebar bg-sidebar p-6 text-white sm:col-span-2 sm:p-7">
          <!-- The only decorative element in the app: the "Kesit" mark, cropped -->
          <svg
            class="pointer-events-none absolute -right-6 -top-10 size-28 opacity-60 sm:-right-10 sm:-top-12 sm:size-56 sm:opacity-90"
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <path
              d="M3 4.5h20.5l-3.5 6H3z"
              fill="#2A2230"
            />
            <path
              d="M15.5 13h13l-3.5 6h-9.5z"
              fill="#E8664A"
              opacity=".9"
            />
            <path
              d="M3 21.5h17l3.5 6H3z"
              fill="#2A2230"
            />
          </svg>
          <div class="relative">
            <h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-text">
              Onay bekleyen içerikler
            </h2>
            <p class="mt-4 font-display text-[64px] font-semibold leading-[0.85] tabular-nums tracking-[-0.04em]">
              {{ formatNumber(data.review.total) }}
            </p>
            <p
              class="mt-4 text-sm"
              :class="data.review.longWaiting > 0 ? 'font-medium text-status-review-on-dark' : 'text-sidebar-text'"
            >
              {{ reviewNote }}
            </p>
          </div>
          <div class="relative flex flex-wrap items-center justify-between gap-3">
            <p class="text-[13px] text-sidebar-text">
              {{ formatNumber(data.totals.clients) }} müşteri · {{ formatNumber(data.totals.contents) }} içerik · {{ formatNumber(data.statusCounts.PUBLISHED) }} yayında
            </p>
            <UiButton
              v-if="data.review.total > 0"
              :to="reviewLink"
            >
              İncele
              <ArrowRight
                class="size-4"
                aria-hidden="true"
              />
            </UiButton>
          </div>
        </div>

        <!-- Action metrics -->
        <NuxtLink
          :to="scheduleLink"
          class="card group flex flex-col justify-between gap-5 p-5 transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lift sm:p-6"
        >
          <span class="section-label flex items-center justify-between gap-2">
            Bu hafta yayına çıkacak
            <CalendarClock
              class="size-[18px] text-ink-400 group-hover:text-ink-600"
              aria-hidden="true"
            />
          </span>
          <span>
            <span class="block font-display text-[44px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-ink-900">{{ formatNumber(data.schedule.dueThisWeek) }}</span>
            <span class="mt-2 block text-[13px] text-ink-500">Önümüzdeki 7 gün içinde</span>
          </span>
        </NuxtLink>
        <NuxtLink
          :to="scheduleLink"
          class="card group flex flex-col justify-between gap-5 p-5 transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lift sm:p-6"
        >
          <span class="section-label flex items-center justify-between gap-2">
            <span class="flex items-center gap-2">
              <span
                v-if="data.schedule.overdue > 0"
                class="size-2 rounded-full bg-danger"
                aria-hidden="true"
              />
              Yayın tarihi geçmiş
            </span>
            <CalendarX2
              class="size-[18px] group-hover:text-ink-600"
              :class="data.schedule.overdue > 0 ? 'text-danger' : 'text-ink-400'"
              aria-hidden="true"
            />
          </span>
          <span>
            <span
              class="block font-display text-[44px] font-semibold leading-none tabular-nums tracking-[-0.04em]"
              :class="data.schedule.overdue > 0 ? 'text-danger' : 'text-ink-900'"
            >{{ formatNumber(data.schedule.overdue) }}</span>
            <span class="mt-2 block text-[13px] text-ink-500">Planlanan tarihi geçmiş, henüz yayında değil</span>
          </span>
        </NuxtLink>
      </section>

      <!-- Distribution + recent contents: equal heights from xl, stacked below -->
      <div class="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-5">
        <section
          class="card flex flex-col xl:col-span-2"
          aria-labelledby="distribution-title"
        >
          <div class="border-b border-ink-100 px-5 py-4">
            <h2
              id="distribution-title"
              class="section-label"
            >
              Durum dağılımı
            </h2>
          </div>
          <div class="flex flex-1 items-center px-5 py-5">
            <DashboardStatusDonut
              class="w-full"
              :counts="data.statusCounts"
            />
          </div>
        </section>

        <section
          class="card overflow-hidden xl:col-span-3"
          aria-labelledby="recent-contents-title"
        >
          <div class="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4">
            <h2
              id="recent-contents-title"
              class="section-label"
            >
              Son eklenen içerikler
              <!-- Own line on phones, inline from sm -->
              <span class="mt-1 block font-medium normal-case tracking-normal text-ink-500 sm:ml-1.5 sm:mt-0 sm:inline"><span class="hidden sm:inline">· </span>son 7 günde {{ formatNumber(data.addedLastWeek) }} yeni</span>
            </h2>
            <NuxtLink
              to="/icerikler"
              class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md text-sm font-medium text-ink-600 hover:text-ink-900"
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
                :to="`/icerikler/${content.id}`"
                class="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-ink-50/80 active:bg-ink-50/80"
              >
                <span
                  class="h-9 w-1 shrink-0 rounded-full"
                  :class="CONTENT_STATUS_STYLES[content.status].bar"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1">
                  <span class="line-clamp-2 break-words text-sm font-medium leading-snug text-ink-900">{{ content.title }}</span>
                  <span class="flex min-w-0 gap-1 text-[13px] text-ink-500">
                    <span class="truncate">{{ content.client.name }}</span>
                    <span class="shrink-0">· <time
                      :datetime="content.createdAt"
                      :title="formatDateTime(content.createdAt)"
                    >{{ formatRelativeDate(content.createdAt) }}</time></span>
                  </span>
                </span>
                <ContentTypeBadge
                  :type="content.type"
                  short
                  class="hidden w-36 shrink-0 2xl:inline-flex"
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
