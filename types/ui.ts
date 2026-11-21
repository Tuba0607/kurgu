import type { Component } from 'vue'

/** One entry of the "⋯" overflow menu (UiActionsMenu). */
export interface ActionsMenuItem {
  key: string
  label: string
  icon?: Component
  /** Destructive action, shown in red. */
  danger?: boolean
  /** Draws a thin divider above this item (e.g. between "Düzenle" and "Sil"). */
  separatorBefore?: boolean
}
