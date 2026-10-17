import { describe, it, expect } from 'vitest'
import { parseOptions, stripLetterPrefix, useSingleColumn } from '../mcq-utils'

describe('stripLetterPrefix', () => {
  it('removes "A) ", "b. " and "(C) " prefixes', () => {
    expect(stripLetterPrefix('A) 3, 4, 5, 2, 1')).toBe('3, 4, 5, 2, 1')
    expect(stripLetterPrefix('b. realloc')).toBe('realloc')
    expect(stripLetterPrefix('(C) O(n)')).toBe('O(n)')
  })

  it('leaves text without a letter prefix alone', () => {
    expect(stripLetterPrefix('1, 5, 2, 4, 3')).toBe('1, 5, 2, 4, 3')
    expect(stripLetterPrefix('Array decay')).toBe('Array decay')
    expect(stripLetterPrefix('a)b')).toBe('a)b')
  })
})

describe('parseOptions', () => {
  const opts = ['A) 3 4 5 2 1', 'B) 2 4 3 5 1', 'C) 1 5 2 4 3', 'D) 4 5 3 2 1']

  it('marks the answer given as a letter', () => {
    const parsed = parseOptions(opts, 'c')
    expect(parsed.map(o => o.isCorrect)).toEqual([false, false, true, false])
    expect(parsed[2]).toEqual({ letter: 'C', text: '1 5 2 4 3', isCorrect: true, index: 2 })
  })

  it('marks the answer given as an index', () => {
    expect(parseOptions(opts, 0).map(o => o.isCorrect)).toEqual([true, false, false, false])
  })

  it('supports object options with a correct flag', () => {
    const parsed = parseOptions([{ text: 'x' }, { text: 'B) y', correct: true }])
    expect(parsed[1]).toEqual({ letter: 'B', text: 'y', isCorrect: true, index: 1 })
  })
})

describe('useSingleColumn', () => {
  it('uses the 2x2 grid for short options', () => {
    expect(useSingleColumn(parseOptions(['1', '2', '3', '4']))).toBe(false)
  })

  it('switches to one column when any option is long', () => {
    const long = 'The pointer now refers to freed memory after realloc moves it'
    expect(useSingleColumn(parseOptions(['short', long]))).toBe(true)
  })
})
