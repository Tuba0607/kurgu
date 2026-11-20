<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

defineProps<{
  options: ReadonlyArray<{ value: string, label: string }>
  placeholder?: string
  invalid?: boolean
  /** The empty option is a real choice (e.g. "All clients"), so it is not muted. */
  emptyIsValue?: boolean
}>()
</script>

<template>
  <div class="relative">
    <select
      v-model="model"
      v-bind="$attrs"
      :aria-invalid="invalid || undefined"
      class="field-control h-10 appearance-none truncate pl-3 pr-9"
      :class="model === '' && !emptyIsValue && 'text-ink-400'"
    >
      <option
        v-if="placeholder !== undefined"
        value=""
      >
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="text-ink-900"
      >
        {{ option.label }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
      aria-hidden="true"
    />
  </div>
</template>
