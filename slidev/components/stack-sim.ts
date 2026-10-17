export interface StackState {
  items: string[]
  capacity: number
  // What the last applied op did, for the caption and the highlight.
  last: { kind: 'push' | 'pop' | 'grow' | 'error' | 'start'; value?: string; message: string }
}

// Ops: "push <value>", "pop", "clear", "noop", "grow" (realloc to double capacity).
// A push into a full stack grows automatically, the way IntStack/GenericStack do.
export function simulateStack(ops: string[], step: number, initialCapacity = 4): StackState {
  const state: StackState = {
    items: [],
    capacity: initialCapacity,
    last: { kind: 'start', message: 'empty stack' },
  }
  const count = Math.max(0, Math.min(step, ops.length))
  for (let i = 0; i < count; i++) {
    const [verb, ...rest] = ops[i].trim().split(/\s+/)
    const value = rest.join(' ')
    switch (verb.toLowerCase()) {
      case 'push': {
        let grew = ''
        if (state.items.length === state.capacity) {
          grew = `full → realloc ${state.capacity}→${state.capacity * 2}, then `
          state.capacity *= 2
        }
        state.items.push(value)
        state.last = { kind: grew ? 'grow' : 'push', value, message: `${grew}push(${value})` }
        break
      }
      case 'pop': {
        const popped = state.items.pop()
        state.last = popped === undefined
          ? { kind: 'error', message: 'pop() on empty stack → underflow!' }
          : { kind: 'pop', value: popped, message: `pop() → ${popped}` }
        break
      }
      case 'noop': {
        // keeps two stacks animating in lockstep when only one of them changes
        state.last = { kind: 'start', message: 'unchanged' }
        break
      }
      case 'clear': {
        const dropped = state.items.length
        state.items = []
        state.last = { kind: 'pop', message: dropped ? `clear: popped ${dropped}` : 'clear: already empty' }
        break
      }
      case 'grow': {
        state.last = { kind: 'grow', message: `realloc ${state.capacity}→${state.capacity * 2}` }
        state.capacity *= 2
        break
      }
      default:
        state.last = { kind: 'error', message: `unknown op "${ops[i]}"` }
    }
  }
  return state
}
