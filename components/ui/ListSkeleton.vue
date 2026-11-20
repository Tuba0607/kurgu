<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 5 })
</script>

<template>
  <div
    class="divide-y divide-ink-100"
    role="status"
    aria-label="Yükleniyor"
  >
    <div
      v-for="row in rows"
      :key="row"
      class="flex items-center gap-4 px-5 py-4"
    >
      <UiSkeleton class="size-9 shrink-0 rounded-lg" />
      <div class="flex-1 space-y-2">
        <UiSkeleton
          class="h-3.5"
          :style="{ width: `${40 + ((row * 17) % 35)}%` }"
        />
        <UiSkeleton class="h-3 w-1/4" />
      </div>
      <UiSkeleton class="hidden h-6 w-20 rounded-full sm:block" />
    </div>
  </div>
</template>
