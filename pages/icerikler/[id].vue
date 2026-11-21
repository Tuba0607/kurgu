<script setup lang="ts">
import { ArrowLeft, Clock, Pencil, SearchX, Trash2 } from 'lucide-vue-next'
import {
  CONTENT_TYPE_LABELS,
  type ContentStatusValue,
  LONG_REVIEW_DAYS,
  SOCIAL_PLATFORM_LABELS,
} from '#shared/constants/content'
import type { ContentDetail } from '~/types/api'

const route = useRoute()
const toast = useToast()
const contentId = computed(() => String(route.params.id))

const { data: content, status, error, refresh } = await useFetch<ContentDetail>(() => contentApiPath(contentId.value), {
  lazy: true,
})

useHead({ title: () => content.value?.title ?? 'İçerik' })

const isNotFound = computed(() => {
  const code = getApiStatusCode(error.value)
  return code === 404 || code === 400
})

// Return a real 404 status for server-rendered "not found" pages.
if (import.meta.server && isNotFound.value) {
  setResponseStatus(useRequestEvent()!, 404)
}

// Status changes are saved immediately (with "Geri al" in the toast); the picker
// follows the saved status, so a failed request reverts it automatically.
const selectedStatus = ref<ContentStatusValue>('DRAFT')
const { changeStatus, pendingId } = useStatusChange((saved) => {
  content.value = saved
})
const savingStatus = computed(() => pendingId.value !== null)

watch(() => content.value?.status, (value) => {
  if (value) selectedStatus.value = value
}, { immediate: true })

watch(selectedStatus, async (next) => {
  const current = content.value
  if (!current || next === current.status) return
  const ok = await changeStatus(current.id, current.status, next)
  if (!ok && content.value) selectedStatus.value = content.value.status
})

// "X gündür onay bekliyor"
const reviewDays = computed(() => (content.value?.status === 'IN_REVIEW' ? daysSince(content.value.statusChangedAt) : null))

// Delete with confirmation
const router = useRouter()
const deleteOpen = ref(false)
const deleting = ref(false)

async function deleteContent() {
  if (!content.value) return
  deleting.value = true
  try {
    await $fetch(contentApiPath(content.value.id), { method: 'DELETE' })
    toast.success('İçerik silindi', `“${content.value.title}” kalıcı olarak silindi.`)
    deleteOpen.value = false
    await router.push('/icerikler')
  }
  catch (error) {
    toast.error('İçerik silinemedi', getApiErrorMessage(error))
  }
  finally {
    deleting.value = false
  }
}

const editOpen = ref(false)

// Body view: plain text or a type-specific preview (WAI-ARIA tabs).
const bodyTabs = [
  { value: 'text', label: 'Metin' },
  { value: 'preview', label: 'Önizleme' },
] as const
type BodyView = typeof bodyTabs[number]['value']
const bodyView = ref<BodyView>('text')
const bodyTabElements = ref<HTMLButtonElement[]>([])

function onBodyTabKeydown(event: KeyboardEvent, index: number) {
  const last = bodyTabs.length - 1
  const targets: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }
  const next = targets[event.key]
  if (next === undefined) return
  event.preventDefault()
  bodyView.value = bodyTabs[next]!.value
  bodyTabElements.value[next]?.focus()
}

function onSaved(updated: ContentDetail) {
  content.value = updated
}
</script>

<template>
  <div>
    <NuxtLink
      to="/icerikler"
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft
        class="size-4"
        aria-hidden="true"
      />
      İçerikler
    </NuxtLink>

    <!-- Not found -->
    <div
      v-if="error && isNotFound"
      class="card"
    >
      <UiEmptyState
        :icon="SearchX"
        title="İçerik bulunamadı"
        description="Bu içerik kaydı mevcut değil ya da adres hatalı."
      >
        <UiButton
          to="/icerikler"
          variant="secondary"
        >
          İçerik listesine dön
        </UiButton>
      </UiEmptyState>
    </div>

    <!-- Other errors -->
    <div
      v-else-if="error && !content"
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
      v-else-if="!content"
      role="status"
      aria-label="İçerik yükleniyor"
    >
      <div class="mb-8 space-y-3">
        <UiSkeleton class="h-5 w-40" />
        <UiSkeleton class="h-7 w-2/3" />
      </div>
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="card space-y-3 p-5 xl:col-span-2">
          <UiSkeleton
            v-for="row in 6"
            :key="row"
            class="h-4"
            :class="row === 6 ? 'w-1/2' : 'w-full'"
          />
        </div>
        <div class="card space-y-4 p-5">
          <UiSkeleton class="h-10 w-full rounded-xl" />
          <UiSkeleton
            v-for="row in 4"
            :key="row"
            class="h-4 w-full"
          />
        </div>
      </div>
    </div>

    <template v-else>
      <UiPageHeader
        :title="content.title"
        compact
      >
        <template #eyebrow>
          <div class="mb-3 flex flex-wrap items-center gap-3">
            <ContentStatusBadge :status="content.status" />
            <ContentTypeBadge :type="content.type" />
            <span
              v-if="reviewDays !== null"
              class="inline-flex items-center gap-1.5 text-[13px] font-medium"
              :class="reviewDays > LONG_REVIEW_DAYS ? 'text-status-review-ink' : 'text-ink-500'"
            >
              <Clock
                class="size-3.5"
                aria-hidden="true"
              />
              {{ reviewDays === 0 ? 'Bugün onaya gönderildi' : `${reviewDays} gündür onay bekliyor` }}
            </span>
          </div>
        </template>
        <template #actions>
          <UiButton
            variant="ghost"
            @click="deleteOpen = true"
          >
            <template #icon>
              <Trash2
                class="size-4"
                aria-hidden="true"
              />
            </template>
            Sil
          </UiButton>
          <UiButton
            variant="secondary"
            @click="editOpen = true"
          >
            <template #icon>
              <Pencil
                class="size-4"
                aria-hidden="true"
              />
            </template>
            Düzenle
          </UiButton>
        </template>
      </UiPageHeader>

      <!-- Phones/tablets: one column in task order (status, text, details, history) via
           `contents` wrappers + order; desktop: text + history left, status + details right. -->
      <div class="flex flex-col gap-6 xl:grid xl:grid-cols-3 xl:items-start">
        <div class="contents xl:col-span-2 xl:block xl:space-y-6">
          <!-- Body -->
          <section
            class="card order-2 p-5 sm:p-6 xl:order-none"
            aria-labelledby="content-body-title"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="content-body-title"
                class="section-label"
              >
                İçerik metni
              </h2>
              <div
                v-if="content.body"
                role="tablist"
                aria-label="Metin görünümü"
                class="inline-flex rounded-lg bg-ink-100 p-0.5"
              >
                <button
                  v-for="(tab, index) in bodyTabs"
                  :id="`content-body-tab-${tab.value}`"
                  :key="tab.value"
                  ref="bodyTabElements"
                  type="button"
                  role="tab"
                  class="rounded-md px-3 py-1 text-[13px] font-medium transition-colors"
                  :class="bodyView === tab.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'"
                  :aria-selected="bodyView === tab.value"
                  aria-controls="content-body-panel"
                  :tabindex="bodyView === tab.value ? 0 : -1"
                  @click="bodyView = tab.value"
                  @keydown="onBodyTabKeydown($event, index)"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>
            <div
              v-if="content.body"
              id="content-body-panel"
              role="tabpanel"
              :aria-labelledby="`content-body-tab-${bodyView}`"
              class="mt-4"
            >
              <ContentPreview
                v-if="bodyView === 'preview'"
                :content="content"
              />
              <p
                v-else
                class="whitespace-pre-line break-words text-[15px] leading-7 text-ink-700"
              >
                {{ content.body }}
              </p>
            </div>
            <div
              v-else
              class="mt-3 rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500"
            >
              Bu içerik için henüz metin eklenmemiş.
              <button
                type="button"
                class="font-medium text-ink-600 hover:text-ink-800"
                @click="editOpen = true"
              >
                Metin ekle
              </button>
            </div>
          </section>

          <!-- Status history -->
          <section
            class="card order-4 p-5 sm:p-6 xl:order-none"
            aria-labelledby="content-history-title"
          >
            <h2
              id="content-history-title"
              class="section-label mb-4"
            >
              Durum geçmişi
            </h2>
            <ContentStatusTimeline :changes="content.statusChanges" />
          </section>
        </div>

        <div class="contents xl:block xl:space-y-6">
          <!-- Status -->
          <section
            class="card order-1 p-5 xl:order-none"
            aria-labelledby="content-status-title"
          >
            <h2
              id="content-status-title"
              class="section-label mb-3"
            >
              Durum
            </h2>
            <ContentStatusPicker
              v-model="selectedStatus"
              legend="İçerik durumunu değiştir"
              hide-legend
              :disabled="savingStatus"
            />
            <p
              class="mt-3 text-[13px] text-ink-500"
              aria-live="polite"
            >
              {{ savingStatus ? 'Kaydediliyor…' : 'Değişiklikler anında kaydedilir.' }}
            </p>
          </section>

          <!-- Details -->
          <section
            class="card order-3 p-5 xl:order-none"
            aria-labelledby="content-details-title"
          >
            <h2
              id="content-details-title"
              class="section-label"
            >
              Detaylar
            </h2>
            <dl class="mt-3 divide-y divide-ink-100 text-sm">
              <div class="flex justify-between gap-4 py-2.5">
                <dt class="text-ink-500">
                  Müşteri
                </dt>
                <dd class="text-right">
                  <NuxtLink
                    :to="`/musteriler/${content.client.id}`"
                    class="font-medium text-ink-600 hover:text-ink-800"
                  >
                    {{ content.client.name }}
                  </NuxtLink>
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-2.5">
                <dt class="text-ink-500">
                  Tür
                </dt>
                <dd class="text-right font-medium text-ink-900">
                  {{ CONTENT_TYPE_LABELS[content.type] }}
                </dd>
              </div>
              <div
                v-if="content.platform"
                class="flex justify-between gap-4 py-2.5"
              >
                <dt class="text-ink-500">
                  Platform
                </dt>
                <dd class="text-right font-medium text-ink-900">
                  {{ SOCIAL_PLATFORM_LABELS[content.platform] }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-2.5">
                <dt class="text-ink-500">
                  Planlanan yayın
                </dt>
                <dd class="text-right font-medium tabular-nums text-ink-900">
                  {{ content.scheduledAt ? formatDate(content.scheduledAt) : 'Planlanmadı' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-2.5">
                <dt class="text-ink-500">
                  Yayın tarihi
                </dt>
                <dd class="text-right font-medium tabular-nums text-ink-900">
                  {{ content.publishedAt ? formatDateTime(content.publishedAt) : 'Yayınlanmadı' }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-2.5">
                <dt class="text-ink-500">
                  Oluşturulma
                </dt>
                <dd class="text-right font-medium tabular-nums text-ink-900">
                  {{ formatDateTime(content.createdAt) }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-2.5">
                <dt class="text-ink-500">
                  Son güncelleme
                </dt>
                <dd class="text-right font-medium tabular-nums text-ink-900">
                  {{ formatDateTime(content.updatedAt) }}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </template>

    <UiConfirmDialog
      v-if="content"
      :open="deleteOpen"
      title="İçerik silinsin mi?"
      :description="`“${content.title}” ve durum geçmişi kalıcı olarak silinecek. Bu işlem geri alınamaz.`"
      confirm-label="İçeriği sil"
      :loading="deleting"
      @confirm="deleteContent"
      @cancel="deleteOpen = false"
    />

    <ContentFormModal
      :open="editOpen"
      :content-id="content?.id"
      @close="editOpen = false"
      @saved="onSaved"
    />
  </div>
</template>
