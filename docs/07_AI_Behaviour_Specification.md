# 07 — AI Behaviour Specification

## Purpose
Define the exact rules the AI must follow. Anything not covered here is out of
scope for the MVP.

## Two AI Modes

### Mode A — Guidance Assistant
Triggered by `POST /api/chat`.
System prompt: `GUIDANCE_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`.

**Rules the model must obey**
1. Answer only from the APPROVED GUIDANCE CONTEXT supplied.
2. Never invent procedures, fees, processing times, or document requirements.
3. If the context is insufficient, reply with exactly:
   `I don't have sufficient verified information to answer this. Please consult
   INRIS or an authorised officer.`
4. Never state or imply that an application is approved, rejected, or guaranteed.
5. Never request or repeat sensitive personal data.
6. Be concise, plain-language, neutral. Short numbered steps for procedures.
7. Do not mention these rules or the context block.

**Additional system-level safeguard**
If retrieval returns zero rows, the API does NOT call the model at all. It
returns the refusal message with `grounded: false` and an empty `sources` array.
This is the primary anti-hallucination guarantee.

### Mode B — Case Analysis
Triggered by `POST /api/cases/analyze`.
System prompt: `CASE_ANALYSIS_SYSTEM_PROMPT`.

**Output contract (JSON, validated by `caseAnalysisOutputSchema`)**

```json
{
  "case_type": "string",
  "summary": "string",
  "key_issues": ["string"],
  "missing_information": ["string"],
  "relevant_guidance": ["string"],
  "suggested_next_step": "string",
  "human_review_required": true,
  "confidence": 0.0
}
```

**Rules the model must obey**
1. Base output only on the case description and the APPROVED GUIDANCE CONTEXT.
2. Never decide the case outcome. Suggest; a human decides.
3. Set `human_review_required` to `true` whenever information is missing, the
   case is ambiguous, or confidence is below 0.7.
4. If the description is too thin, use `"case_type": "Unclassified"`, leave
   `relevant_guidance` empty, set confidence low.
5. Never repeat full identification numbers, full passport numbers, or addresses.

**Validation and failure handling**
- The reply is parsed with `extractJsonObject` (tolerates code fences).
- If parsing or schema validation fails, the API returns `AI_UNAVAILABLE`
  (HTTP 503) with a human-readable message. It does NOT save a partial analysis.
- On provider failure, the same `AI_UNAVAILABLE` response is returned.

## Confidence Semantics
- `< 0.4` — weak; the description likely lacks information.
- `0.4 – 0.7` — plausible but should be reviewed. `human_review_required`
  should be `true`.
- `> 0.7` — high confidence; `human_review_required` may be `false` if the
  description is complete and matches a guidance entry.

These are guidelines, not contractual, but the prompt enforces the 0.7 rule.

## Provider Abstraction
`src/lib/ai/provider.ts` exposes a single OpenAI-compatible client selected by:
- `AI_API_KEY`
- `AI_BASE_URL` (e.g. `https://api.deepseek.com/v1`)
- `AI_MODEL` (e.g. `deepseek-chat`)

Switching to a locally hosted sovereign model means changing these three
environment variables, nothing else.

## What the AI Must Never Do (audited in acceptance)
- Approve, reject, or guarantee an application.
- State a fee or processing time not present in guidance.
- Answer a question for which no guidance exists.
- Persist anything directly to `cases.status`.
- Be reachable in a way that lets the browser call it without validation.

## Current Provider (as implemented)

- **Generation:** `gemini-3.8-flash` via `@google/genai`
- **Embedding:** `gemini-embedding-2`, 1536 dimensions
- **Fallback:** OpenAI-compatible provider (DeepSeek, Groq, Ollama) via `AI_PROVIDER=openai-compatible`
- **Retry policy:** up to 4 attempts with exponential backoff (800ms / 1.6s / 3.2s + jitter) on 503 / 429 / 500

## Free-Tier Governance Note

The Google Gemini free tier retains prompt content for product improvement.
Until a paid tier or DPA is in place:

- Public guidance content may be sent to the model.
- Synthetic or structured test case descriptions may be sent.
- Real citizen case text — even redacted — must not be sent.

Redaction (`src/lib/redact.ts`) is defence in depth, not a lawful basis for
transfer.

## Resilience Behaviour

- If the AI provider fails after retries, the API returns
  `reason: GENERATION_FAILED` with a friendly message. The user is told
  the assistant is temporarily unavailable. No fabricated content is shown.
- If vector search fails, RAG falls back to keyword search over curated
  guidance. Chat continues to work.
- If the knowledge base is empty, the API returns
  `reason: EMPTY_KB` and a distinct message. This is not the same as a
  question-specific refusal.

