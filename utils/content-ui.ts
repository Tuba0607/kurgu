import type { Component } from 'vue'
import { FileText, Globe, Megaphone } from 'lucide-vue-next'
import {
  CONTENT_STATUSES,
  type ContentStatusValue,
  type ContentTypeValue,
} from '#shared/constants/content'

interface StatusStyle {
  /** Badge background, text and ring */
  badge: string
  /** Small indicator dot */
  dot: string
  /** Progress / distribution bar segment */
  bar: string
}

// Status colors: neutral for draft, amber for review, green for published.
export const CONTENT_STATUS_STYLES: Record<ContentStatusValue, StatusStyle> = {
  DRAFT: {
    badge: 'bg-ink-100 text-ink-700 ring-ink-500/20',
    dot: 'bg-ink-400',
    bar: 'bg-ink-400',
  },
  IN_REVIEW: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    dot: 'bg-amber-500',
    bar: 'bg-amber-400',
  },
  PUBLISHED: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
}

export const CONTENT_TYPE_ICONS: Record<ContentTypeValue, Component> = {
  SOCIAL_POST: Megaphone,
  BLOG_POST: FileText,
  WEB_PAGE: Globe,
}

export function isContentStatus(value: unknown): value is ContentStatusValue {
  return typeof value === 'string' && (CONTENT_STATUSES as readonly string[]).includes(value)
}
