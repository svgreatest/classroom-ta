export type RawOption = string | { text: string; correct?: boolean }

export interface OptionItem {
  letter: string
  text: string
  isCorrect: boolean
  index: number
}

// Options written as "A) foo", "b. foo" or "C: foo" already carry a letter; the
// MCQ draws its own badge, so drop the duplicate prefix.
const LETTER_PREFIX = /^\s*\(?[A-Ha-h][).:]\s+/

export function stripLetterPrefix(text: string): string {
  return text.replace(LETTER_PREFIX, '')
}

export function parseOptions(options: RawOption[], answer?: number | string): OptionItem[] {
  return options.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx)
    if (typeof opt !== 'string') {
      return { letter, text: stripLetterPrefix(opt.text), isCorrect: Boolean(opt.correct), index: idx }
    }
    const isCorrect =
      (typeof answer === 'number' && answer === idx) ||
      (typeof answer === 'string' && answer.trim().toUpperCase() === letter)
    return { letter, text: stripLetterPrefix(opt), isCorrect, index: idx }
  })
}

// Short options sit in a 2x2 grid; long ones get a full-width row each so they
// stay at the same large font size instead of wrapping into narrow columns.
export const WIDE_OPTION_CHARS = 40

export function useSingleColumn(items: OptionItem[]): boolean {
  return items.some(item => item.text.length > WIDE_OPTION_CHARS)
}
