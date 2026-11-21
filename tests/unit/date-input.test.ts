import { describe, expect, it } from 'vitest'
import { addDaysIso, buildMonthGrid, displayToIso, isoToDisplay, maskDisplayDate, nextMondayIso, quickDateOptions, toIsoDate } from '../../utils/date-input'

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

describe('quick date options', () => {
  it('adds days across month and year ends', () => {
    expect(addDaysIso('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDaysIso('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('finds the next Monday strictly after the day', () => {
    expect(nextMondayIso('2026-11-21')).toBe('2026-11-23') // Saturday
    expect(nextMondayIso('2026-11-22')).toBe('2026-11-23') // Sunday
    expect(nextMondayIso('2026-11-23')).toBe('2026-11-30') // Monday -> following week
  })

  it('builds Yarın / Gelecek Pazartesi / 1 hafta sonra', () => {
    expect(quickDateOptions('2026-11-21')).toEqual([
      { label: 'Yarın', iso: '2026-11-22' },
      { label: 'Gelecek Pazartesi', iso: '2026-11-23' },
      { label: '1 hafta sonra', iso: '2026-11-28' },
    ])
  })
})
