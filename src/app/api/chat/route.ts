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

export const runtime = 'nodejs'

const NO_AI_MESSAGE =
  'The guidance assistant is not yet connected to an AI provider. Please consult INRIS or an authorised officer.'
const NO_KB_MESSAGE =
  'I don\'t have any verified guidance in my knowledge base yet. Please consult INRIS or an authorised officer.'

// FIX: matches the shape the model is now asked for in prompts.ts, so
// grounding is read from an explicit field instead of guessed from text.
const chatOutputSchema = z.object({
  sufficient: z.boolean(),
  answer: z.string(),
})

export async function POST(req: Request) {
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

  // ---- 1. Retrieve guidance ------------------------------------------
  let guidance
  try {
    guidance = await retrieveGuidance(question, 4)
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

  // ---- 2. Was there anything to retrieve? -----------------------------
  // Distinguish "empty knowledge base" from "no match for this question".
  // If the entire knowledge base is empty, that's a system state, not a
  // question-specific refusal. We say so explicitly.
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
      // If the count fails, assume not empty — fall through to the standard refusal.
    }

    return NextResponse.json({
      answer: kbEmpty ? NO_KB_MESSAGE : INSUFFICIENT_INFO_MESSAGE,
      grounded: false,
      sources: [],
      reason: kbEmpty ? 'EMPTY_KB' : 'NO_MATCH',
    })
  }

  // ---- 3. Generate -----------------------------------------------------
  const context = formatGuidanceContext(guidance)

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
        { role: 'system', content: `APPROVED GUIDANCE CONTEXT:\n\n${context}` },
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
      reason: output.sufficient ? 'GROUNDED' : 'MODEL_REFUSED',
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
