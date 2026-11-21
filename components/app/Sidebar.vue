<script setup lang="ts">
import { FileText, LayoutDashboard, Users, X } from 'lucide-vue-next'

defineProps<{
  /** Shows a close button (mobile drawer). */
  closable?: boolean
}>()

defineEmits<{ close: [] }>()

const route = useRoute()

const NAV_ITEMS = [
  { label: 'Genel bakış', to: '/', icon: LayoutDashboard, exact: true },
  { label: 'Müşteriler', to: '/clients', icon: Users, exact: false },
  { label: 'İçerikler', to: '/contents', icon: FileText, exact: false },
] as const

function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<template>
  <div class="flex h-full flex-col bg-sidebar">
    <div class="flex items-start justify-between px-7 pb-8 pt-7">
      <AppLogo surface="dark" />
      <button
        v-if="closable"
        type="button"
        class="-mr-2 -mt-1 flex size-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-sidebar-hover hover:text-white focus-visible:ring-offset-sidebar"
        aria-label="Menüyü kapat"
        @click="$emit('close')"
      >
        <X
          class="size-5"
          aria-hidden="true"
        />
      </button>
    </div>

    <nav
      class="flex-1 px-4"
      aria-label="Ana menü"
    >
      <p class="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
        Yönetim
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="item in NAV_ITEMS"
          :key="item.to"
        >
          <NuxtLink
            :to="item.to"
            class="group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/70 focus-visible:ring-offset-0 [&:focus:not(:focus-visible)]:shadow-none"
            :class="isActive(item)
              ? 'bg-sidebar-active font-medium text-white'
              : 'text-ink-300 hover:bg-sidebar-hover hover:text-white'"
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            <!-- Active indicator: thin corporate red bar -->
            <span
              v-if="isActive(item)"
              class="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-brand"
              aria-hidden="true"
            />
            <component
              :is="item.icon"
              class="size-[18px] shrink-0 transition-colors"
              :class="isActive(item) ? 'text-white' : 'text-ink-400 group-hover:text-ink-200'"
              :stroke-width="1.75"
              aria-hidden="true"
            />
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <p class="px-7 pb-6 text-[11px] text-ink-400">
      Kilit Grup için tasarlandı
    </p>
  </div>
</template>
