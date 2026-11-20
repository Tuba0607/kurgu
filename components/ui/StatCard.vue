<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  label: string
  value: number
  to: RouteLocationRaw
  icon?: Component
  /** Colored dot shown instead of an icon (used for statuses). */
  dotClass?: string
  hint?: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="card group flex min-w-0 flex-col justify-between gap-4 p-4 transition sm:p-5 hover:border-ink-300 hover:shadow-md"
  >
    <div class="flex min-w-0 items-center justify-between gap-2">
      <span class="truncate text-[13px] font-medium text-ink-500 sm:text-sm">{{ label }}</span>
      <span
        v-if="dotClass"
        class="size-2.5 shrink-0 rounded-full ring-4 ring-ink-50"
        :class="dotClass"
        aria-hidden="true"
      />
      <component
        :is="icon"
        v-else-if="icon"
        class="size-[18px] text-ink-400 transition group-hover:text-ink-600"
        aria-hidden="true"
      />
    </div>
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-2xl font-semibold sm:text-3xl tabular-nums tracking-tight text-ink-900">
        {{ formatNumber(value) }}
      </span>
      <span
        v-if="hint"
        class="text-xs font-medium tabular-nums text-ink-400"
      >{{ hint }}</span>
    </div>
  </NuxtLink>
</template>
