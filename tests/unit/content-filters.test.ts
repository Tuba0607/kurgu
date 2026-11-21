import { describe, expect, it } from 'vitest'
import {
  buildActiveFilterChips,
  contentFilterResetPatch,
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
  it('removes search, status, client and page but keeps unrelated params', () => {
    const query = { search: 'koy', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota', page: '2', ref: 'dashboard' }
    expect(applyQueryPatch(query, contentFilterResetPatch())).toEqual({ ref: 'dashboard' })
  })

  it('is a no-op when no filter is set', () => {
    expect(applyQueryPatch({}, contentFilterResetPatch())).toEqual({})
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
    const query = { search: 'koy', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota', page: '2', ref: 'dashboard' }
    expect(applyQueryPatch(query, { status: null }))
      .toEqual({ search: 'koy', clientId: 'seed_client_mavi_rota', page: '2', ref: 'dashboard' })
  })
})
