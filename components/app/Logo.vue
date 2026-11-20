<script setup lang="ts">
// Official Kilit Grup logo with the product name underneath.
// - kilit-logo.svg: original, unmodified file (red emblem, black wordmark) for light surfaces
// - kilit-logo-light.svg: identical except the wordmark is white, for dark surfaces
withDefaults(defineProps<{
  size?: 'md' | 'sm'
  /** Background the logo is placed on. */
  surface?: 'light' | 'dark'
}>(), {
  size: 'md',
  surface: 'light',
})

// Intrinsic SVG size (113.084 x 41.814) keeps the aspect ratio and avoids layout shift.
const LOGO_WIDTH = 113
const LOGO_HEIGHT = 42
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-flex flex-col items-start rounded-md focus-visible:ring-offset-4"
    :class="surface === 'dark' ? 'focus-visible:ring-offset-sidebar' : 'focus-visible:ring-offset-white'"
  >
    <img
      :src="surface === 'dark' ? '/brand/kilit-logo-light.svg' : '/brand/kilit-logo.svg'"
      alt="Kilit Grup"
      :width="LOGO_WIDTH"
      :height="LOGO_HEIGHT"
      class="w-auto"
      :class="size === 'sm' ? 'h-7' : 'h-9'"
    >
    <!-- lang="en" keeps uppercase "i" from becoming Turkish "İ". -->
    <span
      lang="en"
      class="font-medium uppercase leading-none"
      :class="[
        surface === 'dark' ? 'text-ink-400' : 'text-ink-500',
        size === 'sm' ? 'mt-1 text-[9px] tracking-[0.16em]' : 'mt-2 text-[10px] tracking-[0.18em]',
      ]"
    >Content Studio</span>
  </NuxtLink>
</template>
