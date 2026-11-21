import { describe, expect, it } from 'vitest'
import { contentListQuerySchema } from '../../shared/schemas/content'
import { getPageItems, getPageRange, parsePageParam } from '../../utils/pagination'

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(2, 2)).toEqual([1, 2])
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('collapses distant pages into ellipses around the current page', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })

  it('shows more pages near the start and the end', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 3, 4, 'ellipsis', 10])
    expect(getPageItems(3, 10)).toEqual([1, 2, 3, 4, 'ellipsis', 10])
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis', 7, 8, 9, 10])
    expect(getPageItems(8, 10)).toEqual([1, 'ellipsis', 7, 8, 9, 10])
  })

  it('never puts an ellipsis in place of a single missing page', () => {
    const items = getPageItems(4, 8)
    items.forEach((item, index) => {
      if (item !== 'ellipsis') return
      const before = items[index - 1] as number
      const after = items[index + 1] as number
      expect(after - before).toBeGreaterThan(2)
    })
  })
})

describe('getPageRange', () => {
  it('returns the visible range ("1–10 / 17")', () => {
    expect(getPageRange(1, 10, 17)).toEqual({ from: 1, to: 10 })
    expect(getPageRange(2, 10, 17)).toEqual({ from: 11, to: 17 })
  })

  it('handles an empty list', () => {
    expect(getPageRange(1, 10, 0)).toEqual({ from: 0, to: 0 })
  })
})

describe('parsePageParam', () => {
  it('accepts positive integers', () => {
    expect(parsePageParam('1')).toBe(1)
    expect(parsePageParam('12')).toBe(12)
  })

  it.each(['', '0', '-2', '1.5', 'abc', '02'])('falls back to page 1 for "%s"', (value) => {
    expect(parsePageParam(value)).toBe(1)
  })
})

describe('contentListQuerySchema pagination', () => {
  it('defaults to page 1 with 10 items', () => {
    expect(contentListQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 10 })
    expect(contentListQuerySchema.parse({ page: '', pageSize: '' })).toMatchObject({ page: 1, pageSize: 10 })
  })

  it('coerces numeric strings', () => {
    expect(contentListQuerySchema.parse({ page: '3', pageSize: '25' })).toMatchObject({ page: 3, pageSize: 25 })
  })

  it.each([
    [{ page: '0' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ page: 'x' }, 'page'],
    [{ pageSize: '0' }, 'pageSize'],
    [{ pageSize: '51' }, 'pageSize'],
  ])('rejects %o', (query, field) => {
    const result = contentListQuerySchema.safeParse(query)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual([field])
  })
})
