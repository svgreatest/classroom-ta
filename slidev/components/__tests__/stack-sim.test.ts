import { describe, it, expect } from 'vitest'
import { simulateStack } from '../stack-sim'

describe('simulateStack', () => {
  const ops = ['push 10', 'push 20', 'pop', 'push 30']

  it('starts empty at step 0', () => {
    const s = simulateStack(ops, 0)
    expect(s.items).toEqual([])
    expect(s.last.kind).toBe('start')
  })

  it('replays ops up to the step (LIFO)', () => {
    expect(simulateStack(ops, 2).items).toEqual(['10', '20'])
    const s = simulateStack(ops, 3)
    expect(s.items).toEqual(['10'])
    expect(s.last).toMatchObject({ kind: 'pop', value: '20' })
    expect(simulateStack(ops, 4).items).toEqual(['10', '30'])
  })

  it('clamps steps past the end', () => {
    expect(simulateStack(ops, 99).items).toEqual(['10', '30'])
  })

  it('doubles capacity when pushing into a full stack', () => {
    const s = simulateStack(['push a', 'push b', 'push c'], 3, 2)
    expect(s.capacity).toBe(4)
    expect(s.items).toEqual(['a', 'b', 'c'])
    expect(s.last.kind).toBe('grow')
    expect(s.last.message).toContain('2→4')
  })

  it('supports an explicit grow op', () => {
    expect(simulateStack(['grow'], 1, 4).capacity).toBe(8)
  })

  it('clear empties the stack and noop leaves it unchanged', () => {
    const ops = ['push /home', 'push /shoes', 'noop', 'clear']
    expect(simulateStack(ops, 3).items).toEqual(['/home', '/shoes'])
    const cleared = simulateStack(ops, 4)
    expect(cleared.items).toEqual([])
    expect(cleared.last.message).toBe('clear: popped 2')
  })

  it('reports underflow instead of throwing', () => {
    const s = simulateStack(['pop'], 1)
    expect(s.items).toEqual([])
    expect(s.last.kind).toBe('error')
  })
})
