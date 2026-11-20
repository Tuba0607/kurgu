import { describe, expect, it } from 'vitest'
import { getSearchVariants } from '#shared/utils/search'

describe('getSearchVariants', () => {
  it('returns a single variant when the term is already lowercase', () => {
    expect(getSearchVariants('kahve')).toEqual(['kahve'])
  })

  it('adds the Turkish lowercase form for dotless and dotted capital I', () => {
    expect(getSearchVariants('TARIM')).toEqual(['TARIM', 'tarım'])
    expect(getSearchVariants('İSTANBUL')).toEqual(['İSTANBUL', 'istanbul'])
  })

  it('keeps the raw term so ASCII input still matches', () => {
    expect(getSearchVariants('LINA')).toContain('LINA')
  })
})
