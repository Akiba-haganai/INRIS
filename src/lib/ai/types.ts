export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateOptions {
  system: string
  messages: ChatMessage[]
  /** Ask the provider to emit valid JSON. Falls back to prompt-only if unsupported. */
  jsonMode?: boolean
  temperature?: number
  maxOutputTokens?: number
}

export interface AIProvider {
  readonly name: string
  /** Single-shot generation. Throws on provider failure. */
  generate(options: GenerateOptions): Promise<string>
  /** Embed a batch of texts. Returns one vector per input, in order. */
  embed(texts: string[]): Promise<number[][]>
}
