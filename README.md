# INRIS Passport Guidance & Case Intelligence — MVP

A mobile-first, AI-assisted web application that helps members of the public
understand passport procedures and helps authorised staff organise, classify,
and analyse passport-related cases.

> **Prototype only.** Synthetic data. AI output is advisory and is not an
> official government decision.

## What's in the box

- **Public guidance assistant** — ask a passport question in plain language and
  receive a grounded answer with visible sources. Refuses to answer if no
  approved guidance matches.
- **Guidance library** — read-only view of every approved guidance entry.
- **Staff dashboard** — case counts, cases by category, common issues, and
  filters.
- **Case detail** — case metadata, status controls, and an AI-generated
  structured analysis with a human-review flag and confidence score.
- **Audit log** — every AI-assisted action recorded with before/after values.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** (CSS-first theme, mobile-first)
- **Supabase / PostgreSQL** — guidance, cases, analyses, audit logs, documents
- **Google Gemini API** — `gemini-3.8-flash` (generation), `gemini-embedding-2` (retrieval)
- **Provider-abstracted AI** — swappable to a locally hosted sovereign model by changing `AI_PROVIDER`

## Current MVP State

- AI provider: Google Gemini (free tier)
- Knowledge base: 12 synthetic demo entries, labelled `DEMO`
- Authentication: schema built, feature-flagged off (`AUTH_ENABLED=false`)
- Case data: structured test records only — no real citizen data
- Health endpoint: `/api/health` reports live state of all subsystems


## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local
#   Fill in:
#     NEXT_PUBLIC_SUPABASE_URL
#     NEXT_PUBLIC_SUPABASE_ANON_KEY
#     SUPABASE_SERVICE_ROLE_KEY
#     AI_API_KEY
#     AI_BASE_URL   (e.g. https://api.deepseek.com/v1)
#     AI_MODEL      (e.g. deepseek-chat)

# 3. Create the database schema
#   Open Supabase → SQL Editor, and run in order:
#     supabase/migrations/001_initial_schema.sql
#     supabase/migrations/002_case_analysis_review.sql
#     scripts/seed.sql

# 4. Run
npm run dev
#   → http://localhost:3000

# 5. Test the API (with the dev server running in another terminal)
node scripts/test-api.mjs
```

## Demo script (5 minutes)

1. **Landing page (mobile viewport).** Show the responsive shell: sticky
   header, hamburger drawer, bottom tab bar. Tap **Ask**.
2. **Guidance assistant.** Ask *"I lost my passport. What should I do?"* →
   grounded answer with a source card.
3. **Refusal.** Ask *"How do I get a visa for Mars?"* → the refusal message,
   no sources, no hallucination. Explain why this is a feature.
4. **Guidance library.** Tap **Library** → show the read-only knowledge base.
5. **Staff dashboard.** Tap **Staff** → totals, cases-by-category bars, common
   issues.
6. **Create a case.** Tap **New case**, fill in a lost-passport description,
   submit. Note the `INRIS-#####` number.
7. **Analyse.** Open the case → **Run analysis** → structured summary, key
   issues, missing information, suggested next step, confidence, human-review
   flag, and the guidance used.
8. **Human oversight.** Change the status → it updates immediately. Then in
   Supabase, run:
   ```sql
   select action, details, created_at
   from audit_logs
   order by created_at desc limit 10;
   ```
   Show `case.create`, `case.analyze`, `case.update`.
9. **Close with the constraint slide** (from `docs/04_Project_Constraints.md`):
   advisory only, synthetic data, portable to sovereign infrastructure, no
   feature creep.

## Project structure

```
src/
  app/                # routes and pages
    api/
      chat/           # guidance assistant endpoint
      cases/          # list, create, get, patch
        analyze/      # AI case classification
        stats/        # dashboard aggregates
    guidance/         # read-only guidance library
    staff/            # dashboard and case detail
  components/
    layout/           # header, bottom nav
    chat/             # ChatBox, ChatMessage
    staff/            # CaseTable, CaseForm, CaseAnalysis, CaseStatusControls
    ui/               # Button, Card, Input, Textarea, Sheet
  lib/
    ai/               # provider, rag, prompts
    supabase/         # browser, server, admin clients
    audit.ts
    cases.ts
    utils.ts
    validations.ts
  types/
    database.ts

supabase/migrations/  # SQL schema (source of truth)
scripts/              # seed.sql, test-api.mjs
docs/                 # this documentation set
```

## Documentation set

| Doc | Purpose |
|-----|---------|
| `01_Project_Context.md`          | What the project is and is not |
| `02_Functional_Requirements.md`  | FR-01 … FR-11 |
| `03_Non_Functional_Requirements.md` | NFR-01 … NFR-10 |
| `04_Project_Constraints.md`      | C-01 … C-08 |
| `05_MVP_Architecture.md`         | Layers, grounding gate, portability |
| `06_Database_Design.md`          | Tables, indexes, triggers, RLS |
| `07_AI_Behaviour_Specification.md` | Exact model rules and refusal contract |
| `08_MVP_Acceptance_Criteria.md`  | Checklist for a passing MVP |
| `TRACEABILITY.md`                | Requirement → file → status matrix |
| `DEBUG_CHECKLIST.md`             | Common failures and how to fix them |

## Environment portability

The AI backend is selected entirely by environment variables:

```
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

To move to a locally hosted sovereign model, point `AI_BASE_URL` at the local
OpenAI-compatible endpoint and update `AI_MODEL`. No code changes.
