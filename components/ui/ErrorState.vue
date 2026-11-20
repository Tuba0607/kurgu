<script setup lang="ts">
import { RotateCw, TriangleAlert } from 'lucide-vue-next'

withDefaults(defineProps<{
  title?: string
  message: string
  retrying?: boolean
}>(), {
  title: 'Veriler yüklenemedi',
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center px-6 py-14 text-center"
    role="alert"
  >
    <div class="flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
      <TriangleAlert
        class="size-6"
        aria-hidden="true"
      />
    </div>
    <h3 class="mt-4 text-sm font-semibold text-ink-900">
      {{ title }}
    </h3>
    <p class="mt-1 max-w-sm text-sm text-ink-500">
      {{ message }}
    </p>
    <UiButton
      class="mt-5"
      variant="secondary"
      :loading="retrying"
      @click="$emit('retry')"
    >
      <template #icon>
        <RotateCw
          class="size-4"
          aria-hidden="true"
        />
      </template>
      Tekrar dene
    </UiButton>
  </div>
</template>
