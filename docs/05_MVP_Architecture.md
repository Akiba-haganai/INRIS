# 05 — MVP Architecture

## High-Level Shape

```
                      USER (mobile / desktop browser)
                                 │
                                 ▼
                    Next.js App Router (React, TS)
                    ┌────────────┴─────────────┐
                    ▼                          ▼
           Guidance UI (public)         Staff UI (authorised)
                    │                          │
                    ▼                          ▼
              POST /api/chat           /api/cases  (list, create)
                    │                  /api/cases/:id (get, patch)
                    │                  /api/cases/analyze
                    │                  /api/cases/stats
                    │                          │
                    └──────────┬───────────────┘
                               ▼
                    ┌────────────────────┐
                    │  RAG / AI Layer    │
                    │  (OpenAI-compat)   │
                    └────────┬───────────┘
                             ▼
                    ┌────────────────────┐
                    │  Supabase Postgres │
                    │  guidance          │
                    │  cases             │
                    │  case_analysis     │
                    │  audit_logs        │
                    └────────────────────┘
```

## Layer Responsibilities

**Browser / UI**
Server-rendered pages with small client components for interactivity. Mobile-first
shell: sticky header + drawer on mobile, inline nav on desktop, bottom tab bar
on mobile only.

**API routes (`src/app/api/*`)**
Zod-validated inputs. Pure server. Never expose the service-role key.

**RAG / AI layer (`src/lib/ai/*`)**
- `provider.ts` — a single OpenAI-compatible client selected by env vars.
- `rag.ts` — keyword retrieval over `guidance`, scoring and formatting.
- `prompts.ts` — system prompts and refusal constants.

**Data layer (`src/lib/cases.ts`, `src/lib/supabase/*`)**
- `supabase/server.ts` — anon client for public guidance reads.
- `supabase/admin.ts` — service-role client for case tables.
- `cases.ts` — every case read/write in one file.

**Audit (`src/lib/audit.ts`)**
Fire-and-forget insertion into `audit_logs`. Never breaks the request.

## Grounding Gate (important)
`POST /api/chat` will not call the model unless retrieval returns at least one
row. If retrieval is empty, it returns the refusal message directly and never
touches the LLM. This is the mechanism that prevents hallucinated procedures.

## Infrastructure Portability
The only two environment variables that select the AI backend are
`AI_BASE_URL` and `AI_MODEL`. Pointing them at a locally hosted model behind an
OpenAI-compatible endpoint (vLLM, Ollama, TGI) requires no code changes.

## Deliberate Non-Choices (why we didn't)
- **No streaming.** Responses are short; simplicity beats perceived speed.
