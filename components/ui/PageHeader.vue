<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <slot name="eyebrow" />
      <h1 class="break-words text-2xl font-semibold tracking-tight text-ink-900">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-1 text-sm text-ink-500"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex flex-wrap gap-2"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
