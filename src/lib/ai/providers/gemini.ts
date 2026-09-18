import { GoogleGenAI } from '@google/genai'
import type { AIProvider, GenerateOptions } from '../types'

const EMBED_BATCH_SIZE = 20
const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 800

/**
 * Errors that are worth retrying — the request might succeed on a second try.
 * Anything else (auth, bad request) fails immediately.
 */
function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message || ''
  // Gemini wraps status codes in the message string.
  // 503 = UNAVAILABLE (overloaded), 429 = rate limit, 500 = internal
  return (
    msg.includes('"code":503') ||
    msg.includes('"code":429') ||
    msg.includes('"code":500') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('INTERNAL')
  )
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) throw err

      // Exponential backoff with jitter: 800ms, 1.6s, 3.2s (+ random 0-400ms)
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 400
      console.warn(
        `[gemini] ${label} attempt ${attempt} failed, retrying in ${Math.round(delay)}ms:`,
        err instanceof Error ? err.message : err
      )
      await new Promise((res) => setTimeout(res, delay))
    }
  }
  throw lastError
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private client: GoogleGenAI

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(options: GenerateOptions): Promise<string> {
    const model = process.env.GEMINI_GENERATION_MODEL || 'gemini-3.8-flash'

    const contents = options.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    return withRetry('generate', async () => {
      const response = await this.client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options.system,
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 900,
          ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      })

      const text = response.text?.trim()
      if (!text) throw new Error('Gemini returned an empty response.')
      return text
    })
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []

    const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2'
    const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 1536)

    const vectors: number[][] = []

    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBED_BATCH_SIZE)

      const embeddings = await withRetry(
        `embed batch ${Math.floor(i / EMBED_BATCH_SIZE) + 1}`,
        async () => {
          const response = await this.client.models.embedContent({
            model,
            contents: batch,
            config: { outputDimensionality: dimensions },
          })
          const list = response.embeddings ?? []
          if (list.length !== batch.length) {
            throw new Error(
              `Gemini returned ${list.length} embeddings for ${batch.length} inputs.`
            )
          }
          return list
        }
      )

      for (const e of embeddings) {
        if (!e.values) throw new Error('Gemini returned an embedding with no values.')
        vectors.push(e.values)
      }
    }

    return vectors
  }
}
