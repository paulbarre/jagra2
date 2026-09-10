export interface HighlightPart {
  text: string
  type?: 'primary' | 'secondary'
}

// `**...**` highlights in the primary color, `__...__` in the secondary color.
// Shared convention across content types (rules' structure/examples, kanji
// example words).
export function highlightParts(text: string): HighlightPart[] {
  const parts: HighlightPart[] = []
  const regex = /\*\*(.+?)\*\*|__(.+?)__/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index) })
    parts.push(match[1] !== undefined
      ? { text: match[1], type: 'primary' }
      : { text: match[2]!, type: 'secondary' })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex) })
  return parts
}
