// Turkish-aware text helpers (dotted/dotless i: "i" <-> "İ", "ı" <-> "I").

const LOCALE = 'tr-TR'
/** Short conjunctions stay lower case unless they start the value. */
const LOWERCASE_WORDS = new Set(['ve', 'ile', 'veya'])

function capitalizeWord(word: string): string {
  // Each part of a hyphenated word is capitalized: "e-ticaret" -> "E-Ticaret"
  return word
    .split('-')
    .map(part => part.charAt(0).toLocaleUpperCase(LOCALE) + part.slice(1).toLocaleLowerCase(LOCALE))
    .join('-')
}

/**
 * Turkish title case for labels such as industries:
 * "yiyecek & içecek" -> "Yiyecek & İçecek", "İNŞAAT VE MİMARLIK" -> "İnşaat ve Mimarlık".
 * Whitespace is trimmed and collapsed.
 */
export function toTurkishTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLocaleLowerCase(LOCALE)
      return index > 0 && LOWERCASE_WORDS.has(lower) ? lower : capitalizeWord(word)
    })
    .join(' ')
}

/** Case-insensitive, Turkish-aware comparison key ("İstanbul" === "istanbul"). */
export function turkishKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase(LOCALE)
}
