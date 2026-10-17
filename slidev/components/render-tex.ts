import katex from 'katex'

// Turns plain text with $...$ segments into HTML: text is escaped, math is
// rendered with KaTeX. Used wherever math appears in component props.
const MATH = /\$([^$]+)\$/g

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderTex(text: string): string {
  let out = ''
  let last = 0
  for (const m of text.matchAll(MATH)) {
    out += escapeHtml(text.slice(last, m.index))
    out += katex.renderToString(m[1], { throwOnError: false })
    last = m.index! + m[0].length
  }
  return out + escapeHtml(text.slice(last))
}
