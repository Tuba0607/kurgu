<script setup lang="ts">
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUSES,
  type ContentStatusValue,
} from '#shared/constants/content'

const model = defineModel<ContentStatusValue>({ required: true })

defineProps<{
  legend: string
  hideLegend?: boolean
  disabled?: boolean
}>()

const name = useId()
</script>

<template>
  <fieldset
    data-form-field
    :disabled="disabled"
  >
    <legend
      :class="hideLegend ? 'sr-only' : 'mb-1.5 text-sm font-medium text-ink-800'"
    >
      {{ legend }}
    </legend>
    <div class="grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1">
      <label
        v-for="status in CONTENT_STATUSES"
        :key="status"
        class="relative flex cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink-600 transition hover:text-ink-900 has-[:checked]:bg-white has-[:checked]:text-ink-900 has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/60 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
      >
        <input
          v-model="model"
          type="radio"
          class="sr-only"
          :name="name"
          :value="status"
        >
        <span
          class="size-2 shrink-0 rounded-full"
          :class="CONTENT_STATUS_STYLES[status].dot"
          aria-hidden="true"
        />
        {{ CONTENT_STATUS_LABELS[status] }}
      </label>
    </div>
  </fieldset>
</template>
