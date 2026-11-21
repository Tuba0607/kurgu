<script setup lang="ts">
import { FileText, LayoutDashboard, Users, X } from 'lucide-vue-next'

defineProps<{
  /** Shows a close button (mobile drawer). */
  closable?: boolean
  /** Icon-only rail (collapsed sidebar on tablets). */
  collapsed?: boolean
}>()

defineEmits<{ close: [] }>()

const route = useRoute()

const NAV_ITEMS = [
  { label: 'Genel bakış', to: '/', icon: LayoutDashboard, exact: true },
  { label: 'Müşteriler', to: '/musteriler', icon: Users, exact: false },
  { label: 'İçerikler', to: '/icerikler', icon: FileText, exact: false },
] as const

function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<template>
  <div class="flex h-full flex-col bg-sidebar">
    <div
      class="flex items-center justify-between pb-8 pt-7"
      :class="collapsed ? 'justify-center px-3' : 'px-6'"
    >
      <AppLogo
        v-if="!collapsed"
        surface="dark"
      />
      <NuxtLink
        v-else
        to="/"
        class="rounded-md focus-visible:ring-offset-sidebar"
        aria-label="kurgu. — Genel bakış"
      >
        <img
          src="/favicon.svg"
          alt=""
          class="size-9"
        >
      </NuxtLink>
      <button
        v-if="closable"
        type="button"
        class="-mr-2 flex size-9 items-center justify-center rounded-lg text-sidebar-text transition hover:bg-sidebar-hover hover:text-white focus-visible:ring-offset-sidebar"
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
      class="flex-1"
      :class="collapsed ? 'px-2.5' : 'px-4'"
      aria-label="Ana menü"
    >
      <p
        v-if="!collapsed"
        class="px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted"
      >
        Stüdyo
      </p>
      <ul class="space-y-1">
        <li
          v-for="item in NAV_ITEMS"
          :key="item.to"
        >
          <NuxtLink
            :to="item.to"
            class="group relative flex h-11 items-center gap-3 rounded-xl text-sm outline-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/70 focus-visible:ring-offset-0 [&:focus:not(:focus-visible)]:shadow-none"
            :class="[
              collapsed ? 'justify-center px-0' : 'px-3',
              isActive(item) ? 'bg-sidebar-active font-medium text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
            ]"
            :aria-current="isActive(item) ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <!-- Active marker: small coral diamond at the left edge -->
            <span
              v-if="isActive(item)"
              class="absolute -left-[5px] top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-brand"
              :class="collapsed && '-left-[3px]'"
              aria-hidden="true"
            />
            <component
              :is="item.icon"
              class="size-[18px] shrink-0 transition-colors"
              :class="isActive(item) ? 'text-brand' : 'text-sidebar-muted group-hover:text-white'"
              :stroke-width="1.75"
              aria-hidden="true"
            />
            <span :class="collapsed && 'sr-only'">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <p
      v-if="!collapsed"
      class="px-7 pb-6 text-xs text-sidebar-muted"
    >
      Kilit Grup için tasarlandı
    </p>
  </div>
</template>
