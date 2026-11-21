import { describe, expect, it } from 'vitest'
import { buildDonutSegments } from '../../utils/donut'

const C = 100 // convenient circumference for assertions

describe('buildDonutSegments', () => {
  it('returns no segments when there are no contents', () => {
    expect(buildDonutSegments({ DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0 }, C)).toEqual([])
  })

  it('computes ratios and percentages from the real counts', () => {
    const segments = buildDonutSegments({ DRAFT: 5, IN_REVIEW: 5, PUBLISHED: 6 }, C)
    expect(segments.map(s => [s.status, s.count, s.percent])).toEqual([
      ['DRAFT', 5, '%31'],
      ['IN_REVIEW', 5, '%31'],
      ['PUBLISHED', 6, '%38'],
    ])
    expect(segments.reduce((sum, s) => sum + s.ratio, 0)).toBeCloseTo(1)
  })

  it('lays segments end to end with a small gap between them', () => {
    const segments = buildDonutSegments({ DRAFT: 1, IN_REVIEW: 1, PUBLISHED: 2 }, C, 2)
    expect(segments.map(s => s.dashOffset)).toEqual([-0, -25, -50])
    expect(segments.map(s => s.dashLength)).toEqual([23, 23, 48])
  })

  it('places each midpoint angle at the centre of its arc', () => {
    const segments = buildDonutSegments({ DRAFT: 1, IN_REVIEW: 1, PUBLISHED: 2 }, C)
    expect(segments.map(s => s.midAngle)).toEqual([45, 135, 270])
  })

  it('skips statuses without contents', () => {
    const segments = buildDonutSegments({ DRAFT: 0, IN_REVIEW: 3, PUBLISHED: 1 }, C)
    expect(segments.map(s => s.status)).toEqual(['IN_REVIEW', 'PUBLISHED'])
  })

  it('draws a single full ring without a gap when only one status has contents', () => {
    const [segment] = buildDonutSegments({ DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 4 }, C, 2)
    expect(segment).toMatchObject({ dashLength: 100, dashOffset: -0, percent: '%100', midAngle: 180 })
  })
})
