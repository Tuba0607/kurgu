<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  /** Adds the coral full stop of the brand ("Stüdyoda bugün.") */
  accentDot?: boolean
}>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <slot name="eyebrow" />
      <h1 class="display-title break-words text-[26px] leading-tight text-ink-900 sm:text-[30px]">
        {{ title }}<span
          v-if="accentDot"
          class="text-brand"
          aria-hidden="true"
        >.</span>
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
