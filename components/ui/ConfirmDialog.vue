<script setup lang="ts">
/** Small confirmation dialog for destructive or irreversible actions. */
withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
}>(), {
  description: undefined,
  confirmLabel: 'Onayla',
  cancelLabel: 'Vazgeç',
  tone: 'danger',
  loading: false,
})

const emit = defineEmits<{ confirm: [], cancel: [] }>()
</script>

<template>
  <UiModal
    :open="open"
    :title="title"
    :description="description"
    :persistent="loading"
    @close="emit('cancel')"
  >
    <slot />
    <template #footer>
      <UiButton
        variant="secondary"
        :disabled="loading"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </UiButton>
      <UiButton
        :variant="tone"
        :loading="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </UiButton>
    </template>
  </UiModal>
</template>
