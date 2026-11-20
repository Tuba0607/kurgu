<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

defineProps<{
  invalid?: boolean
}>()
</script>

<template>
  <input
    v-model="model"
    v-bind="$attrs"
    :aria-invalid="invalid || undefined"
    class="field-control h-10 px-3"
  >
</template>
