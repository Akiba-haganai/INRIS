import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider } from '@/lib/ai/provider'
import {
  CASE_ANALYSIS_SYSTEM_PROMPT,
  AI_UNAVAILABLE_MESSAGE,
} from '@/lib/ai/prompts'
import { retrieveGuidance, formatGuidanceContext } from '@/lib/ai/rag'
import { caseAnalysisOutputSchema } from '@/lib/validations'
import { getCase, saveAnalysis } from '@/lib/cases'
import { writeAuditLog } from '@/lib/audit'
import { redactText } from '@/lib/redact'
import { requireStaffApi } from '@/lib/auth'
import { extractJsonObject } from '@/lib/ai/json' // FIX: was duplicated inline here; now shared with /api/chat

export const runtime = 'nodejs'

const requestSchema = z.object({ case_id: z.string().uuid() })

export async function POST(req: Request) {
  const user = await requireStaffApi()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'case_id is required.' }, { status: 400 })
  }

  const { case_id } = parsed.data

  try {
    const caseRow = await getCase(case_id)
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
    }

    // ---- retrieve approved guidance relevant to the case -------------
    const query = `${caseRow.category} ${caseRow.description}`
    const guidance = await retrieveGuidance(query, 5)
    const context = guidance.length
      ? formatGuidanceContext(guidance)
      : '(no matching approved guidance found)'

    // ---- redact before sending to the model -----------------------------
    const redaction = redactText(caseRow.description)

    const provider = getProvider()

    let raw: string
    try {
      raw = await provider.generate({
        system: CASE_ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'system',
            content: `APPROVED GUIDANCE CONTEXT:\n\n${context}`,
          },
          {
            role: 'user',
            content: [
              `Case number: ${caseRow.case_number}`,
              `Declared category: ${caseRow.category}`,
              `Description: ${redaction.text}`,
              '',
              'Analyse this case and return the required JSON object.',
            ].join('\n'),
          },
        ],
        jsonMode: true,
        temperature: 0.1,
        maxOutputTokens: 900,
      })
    } catch (err) {
      console.error('[api/cases/analyze] generation failed:', err)
      return NextResponse.json(
        { error: 'AI_UNAVAILABLE', message: AI_UNAVAILABLE_MESSAGE },
        { status: 503 }
      )
    }

    // ---- parse + validate --------------------------------------------
    const json = extractJsonObject(raw)
    const validated = caseAnalysisOutputSchema.safeParse(json)
    if (!validated.success) {
      console.error('[api/cases/analyze] schema mismatch:', validated.error.flatten())
      return NextResponse.json(
        {
          error: 'AI_UNAVAILABLE',
          message: AI_UNAVAILABLE_MESSAGE,
          details: validated.error.flatten(),
        },
        { status: 503 }
      )
    }

    // ---- persist ------------------------------------------------------
    // FIX: saveAnalysis() previously dropped case_type and
    // relevant_guidance on the floor -- they were validated above and
    // then never written anywhere, even though FR-05 explicitly asks
    // for both. See 002_case_analysis_review.sql for the new columns.
    const analysis = await saveAnalysis(case_id, validated.data)

    // FIX: this used to hard-code `process.env.AI_MODEL || 'deepseek-chat'`
    // regardless of which provider actually ran -- with the default
    // AI_PROVIDER=gemini, every audit row falsely claimed "deepseek-chat"
    // was used. Now records the model that was actually active.
    const modelUsed =
      provider.name === 'gemini'
        ? process.env.GEMINI_GENERATION_MODEL || 'gemini-3.8-flash'
        : process.env.AI_MODEL || 'deepseek-chat'

    await writeAuditLog({
      action: 'case.analyze',
      case_id,
      user_id: user.id,
      details: {
        provider: provider.name,
        model: modelUsed,
        confidence: validated.data.confidence,
        human_review_required: validated.data.human_review_required,
        guidance_used: guidance.map((g) => g.title),
        redaction: redaction.redacted,
      },
    })

    return NextResponse.json({
      analysis,
      guidance: guidance.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        source: g.source,
        last_verified: g.last_verified,
      })),
    })
  } catch (err) {
    console.error('[api/cases/analyze]', err)
    return NextResponse.json(
      { error: 'AI_UNAVAILABLE', message: AI_UNAVAILABLE_MESSAGE },
      { status: 503 }
    )
  }
}
