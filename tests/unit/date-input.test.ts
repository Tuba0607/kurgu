import { describe, expect, it } from 'vitest'
import { buildMonthGrid, displayToIso, isoToDisplay, maskDisplayDate, toIsoDate } from '../../utils/date-input'

describe('Turkish date input helpers', () => {
  it('converts between "gg.aa.yyyy" and "YYYY-MM-DD"', () => {
    expect(isoToDisplay('2026-11-05')).toBe('05.11.2026')
    expect(displayToIso('05.11.2026')).toBe('2026-11-05')
    expect(isoToDisplay('')).toBe('')
  })

  it('rejects incomplete and impossible dates', () => {
    expect(displayToIso('05.11.20')).toBeNull()
    expect(displayToIso('31.02.2026')).toBeNull()
    expect(displayToIso('29.02.2028')).toBe('2028-02-29')
  })

  it('inserts the dots while typing and drops other characters', () => {
    expect(maskDisplayDate('2')).toBe('2')
    expect(maskDisplayDate('211')).toBe('21.1')
    expect(maskDisplayDate('21112026')).toBe('21.11.2026')
    expect(maskDisplayDate('21/11/2026x9')).toBe('21.11.2026')
  })

  it('builds a Monday-first 6-week grid', () => {
    // November 2026 starts on a Sunday -> the grid starts on Monday 26 October.
    const grid = buildMonthGrid(2026, 10)
    expect(grid).toHaveLength(42)
    expect(toIsoDate(grid[0]!)).toBe('2026-10-26')
    expect(grid[0]!.getDay()).toBe(1)
    expect(toIsoDate(grid[6]!)).toBe('2026-11-01')
  })
})
