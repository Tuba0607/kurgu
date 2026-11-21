/**
 * Records whether the user last interacted with a pointer or the keyboard
 * (<html data-modality="pointer|keyboard">). Some browsers (notably Safari) match
 * :focus-visible after a mouse click on buttons and tabs with a tabindex; the
 * CSS in main.css hides focus rings only while the pointer is in use. Focus
 * itself is never moved or blurred, and keyboard users always see the ring.
 */
const NAVIGATION_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Enter', ' ', 'Escape'])

export default defineNuxtPlugin(() => {
  const root = document.documentElement
  const set = (modality: 'pointer' | 'keyboard') => {
    if (root.dataset.modality !== modality) root.dataset.modality = modality
  }
  document.addEventListener('pointerdown', () => set('pointer'), true)
  document.addEventListener('keydown', (event) => {
    if (NAVIGATION_KEYS.has(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) set('keyboard')
  }, true)
})
