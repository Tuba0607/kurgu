<script setup lang="ts">
/**
 * "kurgu." logo: the "Kesit" mark (three montage clips sharing a left edge, which
 * together read as an abstract K) and the lower-case wordmark with a coral dot.
 */
withDefaults(defineProps<{
  size?: 'md' | 'sm'
  /** Background the logo is placed on. */
  surface?: 'light' | 'dark'
}>(), {
  size: 'md',
  surface: 'light',
})
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-flex items-center gap-2.5 rounded-md focus-visible:ring-offset-4"
    :class="surface === 'dark' ? 'focus-visible:ring-offset-sidebar' : 'focus-visible:ring-offset-canvas'"
    aria-label="kurgu. — Genel bakış"
  >
    <svg
      viewBox="0 0 32 32"
      :class="size === 'sm' ? 'size-7' : 'size-8'"
      aria-hidden="true"
    >
      <path
        d="M3 4.5h20.5l-3.5 6H3z"
        fill="#E8664A"
      />
      <rect
        x="3"
        y="13"
        width="10"
        height="6"
        rx="1.2"
        :fill="surface === 'dark' ? '#FFF8F4' : '#1C1520'"
      />
      <path
        d="M15.5 13h13l-3.5 6h-9.5z"
        fill="#E8664A"
        opacity=".85"
      />
      <path
        d="M3 21.5h17l3.5 6H3z"
        fill="#E8664A"
        opacity=".55"
      />
    </svg>
    <span
      class="font-display font-semibold leading-none tracking-[-0.04em]"
      :class="[
        surface === 'dark' ? 'text-[#FFF8F4]' : 'text-ink-900',
        size === 'sm' ? 'text-lg' : 'text-[21px]',
      ]"
    >kurgu<span class="text-brand">.</span></span>
  </NuxtLink>
</template>
