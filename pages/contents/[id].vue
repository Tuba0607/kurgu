<script setup lang="ts">
import { ArrowLeft, Pencil, SearchX } from 'lucide-vue-next'
import {
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  type ContentStatusValue,
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

// Status changes are saved immediately; the picker reverts if the request fails.
const selectedStatus = ref<ContentStatusValue>('DRAFT')
const savingStatus = ref(false)

watch(() => content.value?.status, (value) => {
  if (value) selectedStatus.value = value
}, { immediate: true })

watch(selectedStatus, async (next) => {
  const current = content.value
  if (!current || next === current.status || savingStatus.value) return

  savingStatus.value = true
  try {
    content.value = await $fetch<ContentDetail>(contentApiPath(current.id), { method: 'PATCH', body: { status: next } })
    toast.success('Durum güncellendi', `İçerik “${CONTENT_STATUS_LABELS[next]}” durumuna alındı.`)
  }
  catch (requestError) {
    selectedStatus.value = current.status
    toast.error('Durum güncellenemedi', getApiErrorMessage(requestError))
  }
  finally {
    savingStatus.value = false
  }
})

const editOpen = ref(false)

function onSaved(updated: ContentDetail) {
  content.value = updated
}
</script>

<template>
  <div>
    <NuxtLink
      to="/contents"
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
          to="/contents"
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
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="card space-y-3 p-5 lg:col-span-2">
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
      <UiPageHeader :title="content.title">
        <template #eyebrow>
          <div class="mb-3 flex flex-wrap items-center gap-3">
            <ContentStatusBadge :status="content.status" />
            <ContentTypeBadge :type="content.type" />
          </div>
        </template>
        <template #actions>
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

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <!-- Body -->
        <section
          class="card p-5 sm:p-6 lg:col-span-2"
          aria-labelledby="content-body-title"
        >
          <h2
            id="content-body-title"
            class="text-sm font-semibold text-ink-900"
          >
            İçerik metni
          </h2>
          <p
            v-if="content.body"
            class="mt-3 whitespace-pre-line break-words text-[15px] leading-7 text-ink-700"
          >
            {{ content.body }}
          </p>
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

        <div class="space-y-6">
          <!-- Status -->
          <section
            class="card p-5"
            aria-labelledby="content-status-title"
          >
            <h2
              id="content-status-title"
              class="mb-3 text-sm font-semibold text-ink-900"
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
            class="card p-5"
            aria-labelledby="content-details-title"
          >
            <h2
              id="content-details-title"
              class="text-sm font-semibold text-ink-900"
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
                    :to="`/clients/${content.client.id}`"
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

    <ContentFormModal
      :open="editOpen"
      :content-id="content?.id"
      @close="editOpen = false"
      @saved="onSaved"
    />
  </div>
</template>
