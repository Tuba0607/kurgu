import type { Ref } from 'vue'

let lockCount = 0

/** Prevents background scrolling while overlays (modal, mobile menu) are open. */
export function useScrollLock(active: Ref<boolean>) {
  let locked = false

  function lock() {
    if (locked) return
    locked = true
    if (lockCount++ === 0) document.documentElement.style.overflow = 'hidden'
  }

  function unlock() {
    if (!locked) return
    locked = false
    if (--lockCount === 0) document.documentElement.style.overflow = ''
  }

  onMounted(() => {
    watch(active, isActive => (isActive ? lock() : unlock()), { immediate: true })
  })

  onBeforeUnmount(unlock)
}
