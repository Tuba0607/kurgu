<script setup lang="ts">
import type { NuxtError } from '#app'
import { ArrowLeft, SearchX, TriangleAlert } from 'lucide-vue-next'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

useHead({ title: isNotFound.value ? 'Sayfa bulunamadı' : 'Bir hata oluştu' })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout>
    <div class="card mx-auto mt-6 max-w-lg">
      <div class="flex flex-col items-center px-6 py-14 text-center">
        <div class="flex size-12 items-center justify-center rounded-xl bg-ink-50 text-ink-600 ring-1 ring-inset ring-ink-100">
          <SearchX
            v-if="isNotFound"
            class="size-6"
            aria-hidden="true"
          />
          <TriangleAlert
            v-else
            class="size-6"
            aria-hidden="true"
          />
        </div>
        <p class="mt-4 text-sm font-semibold tabular-nums text-ink-500">
          {{ error.statusCode }}
        </p>
        <h1 class="mt-1 text-lg font-semibold text-ink-900">
          {{ isNotFound ? 'Sayfa bulunamadı' : 'Bir hata oluştu' }}
        </h1>
        <p class="mt-1 max-w-sm text-sm text-ink-500">
          {{ isNotFound
            ? 'Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.'
            : 'Beklenmeyen bir sorun oluştu. Lütfen daha sonra tekrar deneyin.' }}
        </p>
        <UiButton
          class="mt-6"
          @click="goHome"
        >
          <template #icon>
            <ArrowLeft
              class="size-4"
              aria-hidden="true"
            />
          </template>
          Dashboard'a dön
        </UiButton>
      </div>
    </div>
  </NuxtLayout>
</template>
