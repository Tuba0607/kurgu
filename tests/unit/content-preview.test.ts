import { describe, expect, it } from 'vitest'
import { estimateReadingMinutes, splitParagraphs, titleToPath } from '../../utils/content-ui'

describe('splitParagraphs', () => {
  it('splits on blank lines and keeps single line breaks', () => {
    expect(splitParagraphs('Birinci\nsatır\n\n  İkinci  \n \n\nÜçüncü')).toEqual(['Birinci\nsatır', 'İkinci', 'Üçüncü'])
  })

  it('returns an empty list for empty bodies', () => {
    expect(splitParagraphs('')).toEqual([])
    expect(splitParagraphs(null)).toEqual([])
    expect(splitParagraphs('  \n\n ')).toEqual([])
  })
})

describe('estimateReadingMinutes', () => {
  it('is at least one minute', () => {
    expect(estimateReadingMinutes('')).toBe(1)
    expect(estimateReadingMinutes('kısa metin')).toBe(1)
  })

  it('uses about 200 words per minute', () => {
    expect(estimateReadingMinutes(Array(600).fill('kelime').join(' '))).toBe(3)
  })
})

describe('titleToPath', () => {
  it('builds a Turkish-aware path', () => {
    expect(titleToPath('Hakkımızda sayfası')).toBe('/hakkimizda-sayfasi')
    expect(titleToPath('Şubeler & İletişim: Güncel!')).toBe('/subeler-iletisim-guncel')
  })

  it('handles titles without letters', () => {
    expect(titleToPath('!!!')).toBe('/')
  })
})
