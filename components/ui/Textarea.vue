<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

defineProps<{
  invalid?: boolean
}>()
</script>

<template>
  <textarea
    v-model="model"
    v-bind="$attrs"
    :aria-invalid="invalid || undefined"
    class="field-control min-h-28 resize-y px-3 py-2.5 leading-relaxed"
  />
</template>
