<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  /** Adds the coral full stop of the brand ("Stüdyoda bugün.") */
  accentDot?: boolean
  /** Smaller title for long, user-written titles (content detail). */
  compact?: boolean
}>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <slot name="eyebrow" />
      <h1
        class="display-title break-words text-ink-900 [text-wrap:balance]"
        :class="compact ? 'text-[22px] leading-[1.2] sm:text-[26px] lg:text-[28px]' : 'text-[26px] leading-tight sm:text-[30px]'"
      >
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
      class="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
