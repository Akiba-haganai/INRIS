export interface Chunk {
  index: number
  content: string
  tokenCount: number
}

const TARGET_TOKENS = 400
const OVERLAP_TOKENS = 60
const APPROX_CHARS_PER_TOKEN = 4

/**
 * Paragraph-aware chunker.
 * Splits on blank lines first; merges small paragraphs until the target size
 * is reached; overlaps adjacent chunks so context is preserved across boundaries.
 */
export function chunkText(text: string): Chunk[] {
  const normalised = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  if (!normalised) return []

  const paragraphs = normalised
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const targetChars = TARGET_TOKENS * APPROX_CHARS_PER_TOKEN
  const overlapChars = OVERLAP_TOKENS * APPROX_CHARS_PER_TOKEN

  const chunks: Chunk[] = []
  let buffer = ''

  const flush = () => {
    const content = buffer.trim()
    if (!content) return
    chunks.push({
      index: chunks.length,
      content,
      tokenCount: Math.ceil(content.length / APPROX_CHARS_PER_TOKEN),
    })
    // Keep a tail as overlap for the next chunk
    buffer = content.length > overlapChars ? content.slice(-overlapChars) : ''
  }

  for (const para of paragraphs) {
    if ((buffer + '\n\n' + para).length > targetChars && buffer.length > 0) {
      flush()
    }
    buffer = buffer ? `${buffer}\n\n${para}` : para
  }
  // Final flush without overlap tail
  const tail = buffer.trim()
  if (tail) {
    chunks.push({
      index: chunks.length,
      content: tail,
      tokenCount: Math.ceil(tail.length / APPROX_CHARS_PER_TOKEN),
    })
  }

  return chunks
}
