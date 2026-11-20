<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center px-6 py-14 text-center">
    <div class="flex size-12 items-center justify-center rounded-xl bg-ink-50 text-ink-600 ring-1 ring-inset ring-ink-100">
      <component
        :is="icon"
        class="size-6"
        aria-hidden="true"
      />
    </div>
    <h3 class="mt-4 text-sm font-semibold text-ink-900">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-1 max-w-sm text-sm text-ink-500"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      class="mt-5 flex flex-wrap justify-center gap-2"
    >
      <slot />
    </div>
  </div>
</template>
