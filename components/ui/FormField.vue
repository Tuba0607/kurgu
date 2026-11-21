<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  error?: string
  hint?: string
  required?: boolean
  optional?: boolean
  /** Shows the hint as a warning (e.g. a character limit exceeded) without blocking. */
  hintWarning?: boolean
}>()

const id = useId()
const errorId = `${id}-error`
const hintId = `${id}-hint`

const describedBy = computed(() => {
  const ids = [props.error && errorId, props.hint && !props.error && hintId].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
})
</script>

<template>
  <div data-form-field>
    <label
      :for="id"
      class="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink-800"
    >
      <span>
        {{ label }}<span
          v-if="required"
          class="text-rose-500"
          aria-hidden="true"
        > *</span>
      </span>
      <span
        v-if="optional"
        class="text-xs font-normal text-ink-400"
      >İsteğe bağlı</span>
    </label>

    <slot
      :id="id"
      :described-by="describedBy"
      :invalid="Boolean(error)"
    />

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
    <p
      v-else-if="hint"
      :id="hintId"
      class="mt-1.5 text-[13px]"
      :class="hintWarning ? 'font-medium text-danger' : 'text-ink-500'"
      :aria-live="hintWarning ? 'polite' : undefined"
    >
      {{ hint }}
    </p>
  </div>
</template>
