<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  to?: RouteLocationRaw
  loading?: boolean
  disabled?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  to: undefined,
})

const NuxtLink = resolveComponent('NuxtLink')

const VARIANT_CLASSES = {
  primary: 'bg-primary text-primary-ink hover:bg-primary-hover active:bg-primary-hover disabled:hover:bg-primary',
  secondary: 'border border-ink-300 bg-surface text-ink-800 hover:border-ink-400 hover:bg-ink-50 active:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-100 hover:text-ink-900',
  danger: 'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-800 disabled:hover:bg-rose-700',
} as const

const SIZE_CLASSES = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
} as const

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : isDisabled"
    :aria-busy="loading || undefined"
    class="inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    :class="[VARIANT_CLASSES[variant], SIZE_CLASSES[size], block && 'w-full']"
  >
    <Loader2
      v-if="loading"
      class="size-4 animate-spin"
      aria-hidden="true"
    />
    <slot
      v-else
      name="icon"
    />
    <slot />
  </component>
</template>
