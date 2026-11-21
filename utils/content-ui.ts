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
  /** SVG stroke (donut chart segment) */
  stroke: string
}

// Status colors: neutral for draft, amber for review, green for published.
export const CONTENT_STATUS_STYLES: Record<ContentStatusValue, StatusStyle> = {
  DRAFT: {
    badge: 'bg-ink-100 text-ink-700 ring-ink-500/20',
    dot: 'bg-ink-400',
    bar: 'bg-ink-400',
    stroke: 'stroke-ink-400',
  },
  IN_REVIEW: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    stroke: 'stroke-amber-500',
  },
  PUBLISHED: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    stroke: 'stroke-emerald-500',
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

// Preview helpers (plain-text bodies only; nothing is rendered as HTML).

/** Splits a plain-text body into paragraphs on blank lines; single line breaks stay inside a paragraph. */
export function splitParagraphs(body: string | null | undefined): string[] {
  return (body ?? '').split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean)
}

/** Estimated reading time in whole minutes (≈200 words per minute, at least 1). */
export function estimateReadingMinutes(body: string | null | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

const SLUG_CHAR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }

/** URL path derived from a title, e.g. "Hakkımızda sayfası" -> "/hakkimizda-sayfasi". */
export function titleToPath(title: string): string {
  const slug = title
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, char => SLUG_CHAR_MAP[char] ?? char)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return `/${slug}`
}
