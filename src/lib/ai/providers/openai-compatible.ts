import OpenAI from 'openai'
import type { AIProvider, GenerateOptions } from '../types'

export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible'
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
    })
  }

  async generate(options: GenerateOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxOutputTokens ?? 900,
      ...(options.jsonMode
        ? { response_format: { type: 'json_object' as const } }
        : {}),
      messages: [
        { role: 'system', content: options.system },
        ...options.messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) throw new Error('Provider returned an empty response.')
    return text
  }

  async embed(): Promise<number[][]> {
    throw new Error(
      'Embeddings are not configured on the openai-compatible fallback provider. ' +
        'Set AI_PROVIDER=gemini or add an embedding implementation.'
    )
  }
}
