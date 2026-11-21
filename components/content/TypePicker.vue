<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next'
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  type ContentTypeValue,
} from '#shared/constants/content'

const model = defineModel<ContentTypeValue | ''>({ required: true })

defineProps<{
  legend: string
  error?: string
}>()

const name = useId()
const errorId = `${name}-error`
</script>

<template>
  <fieldset
    data-form-field
    :aria-describedby="error ? errorId : undefined"
  >
    <legend class="mb-1.5 text-sm font-medium text-ink-800">
      {{ legend }}<span
        class="text-rose-500"
        aria-hidden="true"
      > *</span>
    </legend>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <label
        v-for="type in CONTENT_TYPES"
        :key="type"
        class="relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 ring-inset transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:flex-col sm:items-start sm:gap-2"
        :class="model === type
          ? 'bg-ink-50 text-ink-900 ring-ink-600'
          : ['bg-white text-ink-700 hover:ring-ink-400', error ? 'ring-rose-300' : 'ring-ink-300']"
      >
        <input
          v-model="model"
          type="radio"
          class="sr-only"
          :name="name"
          :value="type"
          :aria-invalid="error ? true : undefined"
        >
        <component
          :is="CONTENT_TYPE_ICONS[type]"
          class="size-5 shrink-0"
          :class="model === type ? 'text-ink-900' : 'text-ink-400'"
          aria-hidden="true"
        />
        {{ CONTENT_TYPE_LABELS[type] }}
      </label>
    </div>
    <p
      v-if="error"
      :id="errorId"
      class="mt-1.5 flex items-start gap-1.5 text-[13px] text-rose-600"
    >
      <CircleAlert
        class="mt-0.5 size-3.5 shrink-0"
        aria-hidden="true"
      />
      {{ error }}
    </p>
  </fieldset>
</template>
