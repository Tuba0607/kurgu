<script setup lang="ts">
import { Menu } from 'lucide-vue-next'

const route = useRoute()
const menuOpen = ref(false)
const drawer = ref<HTMLElement | null>(null)

function closeMenu() {
  menuOpen.value = false
}

useFocusTrap(drawer, menuOpen, { onEscape: closeMenu })
useScrollLock(menuOpen)

// Close the mobile menu after navigating.
watch(() => route.fullPath, closeMenu)
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <a
      href="#main-content"
      class="sr-only z-[70] rounded-lg bg-surface px-4 py-2 text-sm font-medium text-ink-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >İçeriğe atla</a>

    <!-- Desktop sidebar (>= 1024px) -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
      <AppSidebar />
    </aside>

    <!-- Tablet (768–1023px): collapsed icon rail -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-[76px] md:block lg:hidden">
      <AppSidebar collapsed />
    </aside>

    <!-- Mobile top bar (< 768px) -->
    <header class="sticky top-0 z-20 flex h-14 items-center gap-3 bg-sidebar px-4 md:hidden">
      <button
        type="button"
        class="-ml-1 flex size-9 items-center justify-center rounded-lg text-sidebar-text transition hover:bg-sidebar-hover active:bg-sidebar-hover hover:text-white focus-visible:ring-offset-sidebar"
        aria-label="Menüyü aç"
        aria-controls="mobile-menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = true"
      >
        <Menu
          class="size-5"
          aria-hidden="true"
        />
      </button>
      <AppLogo
        size="sm"
        surface="dark"
      />
    </header>

    <!-- Mobile drawer -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="menuOpen"
          class="fixed inset-0 z-40 bg-ink-950/40 md:hidden"
          aria-hidden="true"
          @click="closeMenu"
        />
      </Transition>
      <Transition
        enter-active-class="transition-transform duration-200 ease-out"
        enter-from-class="-translate-x-full"
        leave-active-class="transition-transform duration-150 ease-in"
        leave-to-class="-translate-x-full"
      >
        <div
          v-if="menuOpen"
          id="mobile-menu"
          ref="drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Ana menü"
          class="fixed inset-y-0 left-0 z-50 w-[264px] max-w-[85vw] shadow-overlay md:hidden"
        >
          <AppSidebar
            closable
            @close="closeMenu"
          />
        </div>
      </Transition>
    </Teleport>

    <main
      id="main-content"
      class="outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:pl-[76px] lg:pl-[248px]"
      tabindex="-1"
    >
      <div class="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        <slot />
      </div>
    </main>
  </div>
</template>
