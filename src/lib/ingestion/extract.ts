/**
 * Extract plain text from an uploaded file buffer.
 * Supports PDF, DOCX, and plain text. Returns the text plus a rough page/block count.
 */

export interface ExtractResult {
  text: string
  pageCount: number | null
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractResult> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return extractPdf(buffer)
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return extractDocx(buffer)
  }
  if (mimeType.startsWith('text/') || ext === 'txt' || ext === 'md') {
    return { text: buffer.toString('utf-8'), pageCount: null }
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`)
}

async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  // pdf-parse has a debug-mode quirk when imported at module scope in Next.js.
  // Importing dynamically at call time avoids it.
  const mod = await import('pdf-parse')
  const pdfParse = (mod as unknown as { default: (b: Buffer) => Promise<{ text: string; numpages: number }> }).default
  const result = await pdfParse(buffer)
  return { text: result.text, pageCount: result.numpages }
}

async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value, pageCount: null }
}
