import type { Component } from 'vue'

/** One entry of the "⋯" overflow menu (UiActionsMenu). */
export interface ActionsMenuItem {
  key: string
  label: string
  icon?: Component
  /** Destructive action, shown in red. */
  danger?: boolean
}
