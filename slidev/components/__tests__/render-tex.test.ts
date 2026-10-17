import { describe, it, expect } from 'vitest'
import { renderTex } from '../render-tex'

describe('renderTex', () => {
  it('escapes plain text', () => {
    expect(renderTex('a < b & "c"')).toBe('a &lt; b &amp; &quot;c&quot;')
  })
  it('renders $...$ with KaTeX and keeps surrounding text', () => {
    const html = renderTex('cost is $n^2$ copies')
    expect(html.startsWith('cost is ')).toBe(true)
    expect(html).toContain('class="katex"')
    expect(html.endsWith(' copies')).toBe(true)
  })
})
