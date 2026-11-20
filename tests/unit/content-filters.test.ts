import { describe, expect, it } from 'vitest'
import {
  buildActiveFilterChips,
  contentFilterResetPatch,
  countContentsByStatus,
  filterContentsByStatus,
  hasActiveContentFilters,
} from '../../utils/content-filters'
import { applyQueryPatch } from '../../utils/query'

const DEFAULTS = { search: '', status: '', clientId: '' }

describe('hasActiveContentFilters', () => {
  it('is false when every filter has its default value', () => {
    expect(hasActiveContentFilters(DEFAULTS)).toBe(false)
  })

  it('ignores a whitespace-only search', () => {
    expect(hasActiveContentFilters({ ...DEFAULTS, search: '   ' })).toBe(false)
  })

  it('is true for a search, a status or a client filter', () => {
    expect(hasActiveContentFilters({ ...DEFAULTS, search: 'blog' })).toBe(true)
    expect(hasActiveContentFilters({ ...DEFAULTS, status: 'PUBLISHED' })).toBe(true)
    expect(hasActiveContentFilters({ ...DEFAULTS, clientId: 'seed_client_mavi_rota' })).toBe(true)
  })
})

describe('applyQueryPatch', () => {
  it('sets and replaces params', () => {
    expect(applyQueryPatch({ status: 'DRAFT' }, { status: 'PUBLISHED', search: 'koy' }))
      .toEqual({ status: 'PUBLISHED', search: 'koy' })
  })

  it('removes params patched with empty values', () => {
    expect(applyQueryPatch({ status: 'DRAFT', search: 'koy' }, { status: '', search: null }))
      .toEqual({})
  })

  it('keeps params that are not part of the patch', () => {
    expect(applyQueryPatch({ status: 'DRAFT', page: '2' }, { status: null })).toEqual({ page: '2' })
  })
})

describe('content filter reset', () => {
  it('removes search, status and client filters but keeps unrelated params', () => {
    const query = { search: 'koy', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota', ref: 'dashboard' }
    expect(applyQueryPatch(query, contentFilterResetPatch())).toEqual({ ref: 'dashboard' })
  })

  it('is a no-op when no filter is set', () => {
    expect(applyQueryPatch({}, contentFilterResetPatch())).toEqual({})
  })
})

describe('countContentsByStatus', () => {
  it('counts every status and the total', () => {
    const contents = [{ status: 'DRAFT' }, { status: 'PUBLISHED' }, { status: 'PUBLISHED' }] as const
    expect(countContentsByStatus(contents)).toEqual({ total: 3, DRAFT: 1, IN_REVIEW: 0, PUBLISHED: 2 })
  })

  it('returns zeros for an empty list', () => {
    expect(countContentsByStatus([])).toEqual({ total: 0, DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0 })
  })
})

describe('filterContentsByStatus', () => {
  const contents = [
    { id: 'a', status: 'DRAFT' },
    { id: 'b', status: 'IN_REVIEW' },
    { id: 'c', status: 'PUBLISHED' },
    { id: 'd', status: 'PUBLISHED' },
  ] as const

  it('returns every content for the "all" tab', () => {
    expect(filterContentsByStatus(contents, '').map(c => c.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns only the matching status and keeps order', () => {
    expect(filterContentsByStatus(contents, 'PUBLISHED').map(c => c.id)).toEqual(['c', 'd'])
    expect(filterContentsByStatus(contents, 'IN_REVIEW').map(c => c.id)).toEqual(['b'])
  })

  it('returns an empty list when no content has the status', () => {
    expect(filterContentsByStatus(contents.filter(c => c.status !== 'DRAFT'), 'DRAFT')).toEqual([])
  })

  it('does not mutate the input', () => {
    const copy = [...contents]
    filterContentsByStatus(contents, 'DRAFT')
    expect(contents).toEqual(copy)
  })
})

describe('buildActiveFilterChips', () => {
  it('returns no chips for the default filters', () => {
    expect(buildActiveFilterChips(DEFAULTS)).toEqual([])
  })

  it('returns a single chip for a single filter', () => {
    expect(buildActiveFilterChips({ ...DEFAULTS, status: 'DRAFT' })).toEqual([
      { param: 'status', label: 'Taslak', removeLabel: 'Taslak filtresini kaldır' },
    ])
  })

  it('returns chips for every active filter in control order', () => {
    const chips = buildActiveFilterChips(
      { search: '  koy ', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota' },
      'Mavi Rota Turizm',
    )
    expect(chips).toEqual([
      { param: 'search', label: 'Arama: “koy”', removeLabel: '“koy” aramasını kaldır' },
      { param: 'clientId', label: 'Mavi Rota Turizm', removeLabel: 'Mavi Rota Turizm filtresini kaldır' },
      { param: 'status', label: 'Yayında', removeLabel: 'Yayında filtresini kaldır' },
    ])
  })

  it('uses a neutral label while the client name is unknown', () => {
    expect(buildActiveFilterChips({ ...DEFAULTS, clientId: 'cl_1' })[0]?.label).toBe('Seçili müşteri')
  })

  it('ignores whitespace-only search and unknown status values', () => {
    expect(buildActiveFilterChips({ search: '   ', status: 'ARCHIVED', clientId: '' })).toEqual([])
  })

  it('removing one chip keeps the others (query patch for a single param)', () => {
    const query = { search: 'koy', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota', ref: 'dashboard' }
    expect(applyQueryPatch(query, { status: null }))
      .toEqual({ search: 'koy', clientId: 'seed_client_mavi_rota', ref: 'dashboard' })
  })
})
