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
    class="card group flex min-w-0 items-center justify-between gap-3 px-3 py-3 transition sm:px-5 sm:py-4 hover:border-ink-300 hover:shadow-md focus-visible:border-ink-300"
  >
    <span class="flex min-w-0 items-center gap-2.5">
      <span
        v-if="dotClass"
        class="size-2.5 shrink-0 rounded-full ring-4 ring-ink-50"
        :class="dotClass"
        aria-hidden="true"
      />
      <span
        v-else-if="icon"
        class="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-200/80 transition group-hover:text-ink-700 sm:flex"
        aria-hidden="true"
      >
        <component
          :is="icon"
          class="size-[18px]"
        />
      </span>
      <span class="min-w-0 break-words text-[13px] font-medium leading-snug text-ink-500 sm:text-sm">{{ label }}</span>
    </span>
    <span class="flex shrink-0 items-baseline gap-2">
      <span
        v-if="hint"
        class="text-xs font-medium tabular-nums text-ink-400"
      >{{ hint }}</span>
      <span class="text-2xl font-semibold tabular-nums tracking-tight text-ink-900 sm:text-[28px] sm:leading-none">
        {{ formatNumber(value) }}
      </span>
    </span>
  </NuxtLink>
</template>
