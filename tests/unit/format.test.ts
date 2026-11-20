import { describe, expect, it } from 'vitest'
import { splitEmailForWrapping } from '../../utils/format'

describe('splitEmailForWrapping', () => {
  it('splits before "@" and "." so the address wraps at natural points', () => {
    expect(splitEmailForWrapping('deniz.arslan@linakozmetik.example'))
      .toEqual(['deniz', '.arslan', '@linakozmetik', '.example'])
  })

  it('keeps the full address when the segments are joined', () => {
    const email = 'kurumsal.iletisim@uluslararasi-enerji.example'
    expect(splitEmailForWrapping(email).join('')).toBe(email)
  })

  it('returns a single segment when there is nothing to split', () => {
    expect(splitEmailForWrapping('admin')).toEqual(['admin'])
  })
})
