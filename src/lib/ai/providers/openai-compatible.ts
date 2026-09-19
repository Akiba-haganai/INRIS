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

  // FIX: this unconditionally threw ("Embeddings are not configured...").
  // Constraint C-06 and the assignment brief both specifically promise
  // that switching AI_PROVIDER=openai-compatible to point at the
  // programme's sovereign/local GPU infrastructure requires no code
  // changes. As written, that migration path silently broke all new
  // document ingestion (generation kept working, uploads all failed)
  // the moment someone actually tried it. Most OpenAI-compatible servers
  // (vLLM, Ollama, TGI, DeepSeek) expose a standard /embeddings endpoint,
  // so we call it -- an explicit, actionable error is still thrown if no
  // embedding model has been configured, rather than a blanket "not
  // implemented".
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []

    const model = process.env.AI_EMBEDDING_MODEL
    if (!model) {
      throw new Error(
        'AI_EMBEDDING_MODEL is not set. The openai-compatible provider needs an ' +
          'embedding model name to call the /embeddings endpoint on AI_BASE_URL ' +
          '(e.g. a local vLLM/Ollama embedding model, or an OpenAI-compatible ' +
          'hosted embedding model). Note: whatever model is used must produce ' +
          'vectors matching EMBEDDING_DIMENSIONS (default 1536), which is the ' +
          'dimension guidance_chunks.embedding is declared with in ' +
          'supabase/migrations/004_documents_and_chunks.sql.'
      )
    }

    const response = await this.client.embeddings.create({
      model,
      input: texts,
    })

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding)
  }
}
