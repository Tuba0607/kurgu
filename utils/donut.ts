import { CONTENT_STATUS_LABELS, CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'
import { formatPercent } from './format'

export interface DonutSegment {
  status: ContentStatusValue
  label: string
  count: number
  /** Share of the total, 0..1 */
  ratio: number
  /** Human readable percentage, e.g. "%31" */
  percent: string
  /** Visible arc length (stroke-dasharray) */
  dashLength: number
  /** Start position of the arc (stroke-dashoffset) */
  dashOffset: number
  /** Angle of the arc's midpoint in degrees, clockwise from 12 o'clock */
  midAngle: number
}

/**
 * Geometry for an SVG donut drawn with one <circle> per status (stroke-dasharray).
 * Statuses without contents get no segment; a small gap separates segments when
 * more than one is visible. Returns [] when there are no contents at all.
 */
export function buildDonutSegments(
  counts: Record<ContentStatusValue, number>,
  circumference: number,
  gap = 2,
): DonutSegment[] {
  const total = CONTENT_STATUSES.reduce((sum, status) => sum + counts[status], 0)
  if (total === 0) return []

  const visible = CONTENT_STATUSES.filter(status => counts[status] > 0)
  const segmentGap = visible.length > 1 ? gap : 0
  let offset = 0

  return visible.map((status) => {
    const ratio = counts[status] / total
    const length = ratio * circumference
    const segment: DonutSegment = {
      status,
      label: CONTENT_STATUS_LABELS[status],
      count: counts[status],
      ratio,
      percent: formatPercent(counts[status], total),
      dashLength: Math.max(length - segmentGap, 0),
      dashOffset: -offset,
      midAngle: ((offset + length / 2) / circumference) * 360,
    }
    offset += length
    return segment
  })
}
