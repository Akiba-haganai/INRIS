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
      ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
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

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []

    const model = process.env.AI_EMBEDDING_MODEL
    if (!model) {
      throw new Error(
        'AI_EMBEDDING_MODEL is not set. The openai-compatible provider needs an ' +
          'embedding model name to call the /embeddings endpoint on AI_BASE_URL. ' +
          'The model must produce vectors matching EMBEDDING_DIMENSIONS (default 1536).'
      )
    }

    const response = await this.client.embeddings.create({
      model,
      input: texts,
    })

    return response.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
  }
}
