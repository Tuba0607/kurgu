<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  placeholder?: string
}>()

const input = ref<HTMLInputElement | null>(null)

function clear() {
  model.value = ''
  input.value?.focus()
}
</script>

<template>
  <div class="relative">
    <Search
      class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
      aria-hidden="true"
    />
    <input
      ref="input"
      v-model="model"
      type="search"
      :aria-label="label"
      :placeholder="placeholder"
      maxlength="100"
      autocomplete="off"
      class="field-control h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
    >
    <button
      v-if="model"
      type="button"
      class="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 active:bg-ink-100 hover:text-ink-600"
      aria-label="Aramayı temizle"
      @click="clear"
    >
      <X
        class="size-4"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
