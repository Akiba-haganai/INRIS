import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider } from '@/lib/ai/provider'
import { retrieveGuidance, formatGuidanceContext } from '@/lib/ai/rag'
import {
  GUIDANCE_SYSTEM_PROMPT,
  INSUFFICIENT_INFO_MESSAGE,
} from '@/lib/ai/prompts'
import { chatRequestSchema } from '@/lib/validations'
import { extractJsonObject } from '@/lib/ai/json'
import { redactText } from '@/lib/redact'
import { chatRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const NO_AI_MESSAGE =
  'The guidance assistant is not yet connected to an AI provider. Please consult INRIS or an authorised officer.'
const NO_KB_MESSAGE =
  'I don\'t have any verified guidance in my knowledge base yet. Please consult INRIS or an authorised officer.'

// FIX: matches the shape the model is now asked for in prompts.ts, so
// grounding is read from an explicit field instead of guessed from text.
const chatOutputSchema = z.object({
  sufficient: z.boolean(),
  reason: z.string().optional(),
  answer: z.string(),
})

export async function POST(req: Request) {
  // 1. IP-based Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  if (!chatRateLimit.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { question, history } = parsed.data

  // ---- 0. Is the AI configured at all? --------------------------------
  let provider
  try {
    provider = getProvider()
  } catch (err) {
    return NextResponse.json({
      answer: NO_AI_MESSAGE,
      grounded: false,
      sources: [],
      reason: 'NO_PROVIDER',
      detail: err instanceof Error ? err.message : undefined,
    })
  }

  const hasKey =
    provider.name === 'gemini'
      ? Boolean(process.env.GEMINI_API_KEY)
      : Boolean(process.env.AI_API_KEY)

  if (!hasKey) {
    return NextResponse.json({
      answer: NO_AI_MESSAGE,
      grounded: false,
      sources: [],
      reason: 'NO_API_KEY',
    })
  }

  // ---- 1. Check for pure greetings --------------------------------------
  const lowerQ = question.trim().toLowerCase()
  const GREETINGS = new Set(['hi', 'hello', 'hey', 'greetings', 'help', 'what can you do', 'what can you do?'])
  if (history.length === 0 && GREETINGS.has(lowerQ)) {
    return NextResponse.json({
      answer: "Hello! I'm the INRIS Passport Assistant. I can help you with questions about passport applications, renewals, lost documents, and fees. What do you need help with?",
      grounded: true, // It's an application-level response
      sources: [],
      reason: 'GREETING',
    })
  }

  // ---- 2. Contextual retrieval ------------------------------------------
  // We want follow-ups like "What about the fee?" to be searched with the context
  // of the conversation, not just the isolated string.
  const recentUserMessages = history
    .filter(m => m.role === 'user')
    .slice(-2)
    .map(m => m.content)
  const searchContext = [...recentUserMessages, question].join('\n')

  let guidance
  try {
    guidance = await retrieveGuidance(searchContext, 4)
  } catch (err) {
    console.error('[api/chat] retrieval failed:', err)
    return NextResponse.json(
      {
        answer: 'The knowledge base is temporarily unavailable. Please try again.',
        grounded: false,
        sources: [],
        reason: 'RETRIEVAL_FAILED',
      },
      { status: 503 }
    )
  }

  // ---- 3. Was there anything to retrieve? -----------------------------
  if (guidance.length === 0) {
    let kbEmpty = false
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { count } = await supabase
        .from('guidance')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
      kbEmpty = (count ?? 0) === 0
    } catch {
      // If the count fails, assume not empty
    }

    if (kbEmpty) {
      return NextResponse.json({
        answer: "I'm sorry, but there is currently no verified guidance available in the knowledge base to answer your question.",
        grounded: false,
        sources: [],
        reason: 'EMPTY_KB',
      })
    }
  }

  // ---- 4. Generate -----------------------------------------------------
  const contextStr = guidance.length > 0
    ? formatGuidanceContext(guidance)
    : '(no matching guidance found)'

  // FIX: the user's own question previously went to the AI provider
  // unredacted -- only case descriptions were redacted. A member of the
  // public could type a passport/ID number into the chat box and it
  // would go straight to a free-tier external provider. Redact it the
  // same way case text is redacted (see docs/09_Data_Governance §PII).
  const redaction = redactText(question)

  try {
    const raw = await provider.generate({
      system: GUIDANCE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'system',
          content: `APPROVED GUIDANCE CONTEXT:\n\n${contextStr}`,
        },
        ...history,
        { role: 'user', content: redaction.text },
      ],
      jsonMode: true,
      temperature: 0.2,
      maxOutputTokens: 700,
    })

    // FIX: previously `grounded` was decided by
    // `!answer.includes(INSUFFICIENT_INFO_MESSAGE)` on free text -- a
    // paraphrased refusal was silently mislabeled "grounded" and shown
    // with source cards. The model now returns explicit JSON with a
    // `sufficient` flag; if parsing fails we fail closed (not grounded)
    // rather than risk showing fabricated content as sourced.
    let output: z.infer<typeof chatOutputSchema>
    try {
      const json = extractJsonObject(raw)
      const validated = chatOutputSchema.safeParse(json)
      if (!validated.success) throw new Error('Schema mismatch')
      output = validated.data
    } catch (err) {
      console.error('[api/chat] could not parse structured output, failing closed:', err, raw)
      return NextResponse.json({
        answer: 'The assistant is temporarily unavailable. Please try again.',
        grounded: false,
        sources: [],
        reason: 'PARSE_FAILED',
      })
    }

    return NextResponse.json({
      answer: output.answer,
      grounded: output.sufficient,
      sources: output.sufficient
        ? guidance.map((g) => ({
            id: g.id,
            title: g.title,
            category: g.category,
            source: g.source,
            last_verified: g.last_verified,
          }))
        : [],
      reason: output.sufficient ? 'GROUNDED' : (output.reason || 'MODEL_REFUSED'),
    })
  } catch (err) {
    console.error('[api/chat] generation failed:', err)
    return NextResponse.json({
      answer: 'The assistant is temporarily unavailable. Please try again.',
      grounded: false,
      sources: [],
      reason: 'GENERATION_FAILED',
    })
  }
}
