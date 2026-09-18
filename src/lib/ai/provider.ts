import type { AIProvider } from './types'
import { GeminiProvider } from './providers/gemini'
import { OpenAICompatibleProvider } from './providers/openai-compatible'

export type { AIProvider, ChatMessage, GenerateOptions } from './types'

let cached: AIProvider | null = null

export function getProvider(): AIProvider {
  if (cached) return cached

  const selected = (process.env.AI_PROVIDER || 'gemini').toLowerCase()

  switch (selected) {
    case 'gemini':
      cached = new GeminiProvider(process.env.GEMINI_API_KEY || '')
      break
    case 'openai-compatible':
      cached = new OpenAICompatibleProvider()
      break
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${selected}". Use 'gemini' or 'openai-compatible'.`
      )
  }

  return cached
}

/** Test helper — clears the cached provider so env changes take effect. */
export function resetProvider(): void {
  cached = null
}