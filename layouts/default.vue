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
      class="sr-only z-[70] rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >İçeriğe atla</a>

    <!-- Desktop sidebar -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">
      <AppSidebar />
    </aside>

    <!-- Mobile top bar -->
    <header class="sticky top-0 z-20 flex h-14 items-center gap-3 bg-sidebar px-4 lg:hidden">
      <button
        type="button"
        class="-ml-1 flex size-9 items-center justify-center rounded-lg text-ink-300 transition hover:bg-sidebar-hover hover:text-white focus-visible:ring-offset-sidebar"
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
          class="fixed inset-0 z-40 bg-ink-950/30 lg:hidden"
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
          class="fixed inset-y-0 left-0 z-50 w-[264px] max-w-[85vw] shadow-overlay lg:hidden"
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
      class="outline-none focus-visible:ring-0 focus-visible:ring-offset-0 lg:pl-[264px]"
      tabindex="-1"
    >
      <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <slot />
      </div>
    </main>
  </div>
</template>
