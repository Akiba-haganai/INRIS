# 02 — Functional Requirements

## FR-01 — Guidance Search
The system shall allow a user to search passport guidance using keywords or
natural-language questions and shall retrieve relevant guidance entries.

**Implemented by:** `src/lib/ai/rag.ts` (`retrieveGuidance`, `buildSearchTerms`)
and `POST /api/chat`.

## FR-02 — AI Guidance Assistant
The system shall allow users to ask questions in ordinary language. The AI shall
produce an answer based only on the approved guidance dataset.

**Rule:** the AI must never invent procedures. If the knowledge base does not
contain a sufficient answer, the system must reply:

> "I don't have sufficient verified information to answer this. Please consult
> INRIS or an authorised officer."

This is a feature, not a weakness.

**Implemented by:** `src/lib/ai/prompts.ts` (`GUIDANCE_SYSTEM_PROMPT`,
`INSUFFICIENT_INFO_MESSAGE`), `src/app/api/chat/route.ts` (grounding gate).

## FR-03 — Guidance Categories
The system shall organise guidance into categories: New Application, Renewal,
Lost Passport, Damaged Passport, Replacement, Supporting Documents, Application
Procedures, Collection, and Other.

**Implemented by:** `guidance.category` column and the seed data in
`scripts/seed.sql`; visible in `src/app/guidance/page.tsx`.

## FR-04 — Case Creation
An authorised user shall be able to create a case containing structured
information: case ID, category, description, date submitted, status, notes,
priority.

**Implemented by:** `POST /api/cases`, `src/lib/cases.ts` (`createCase`),
`src/components/staff/CaseForm.tsx`. Case numbers are generated server-side as
`INRIS-#####`.

## FR-05 — AI Case Classification
When a case is analysed, the AI shall suggest: case type, summary, key issues,
relevant guidance, missing information, suggested next step, and confidence.

The staff member must be able to override the AI.

**Implemented by:** `POST /api/cases/analyze`,
`CASE_ANALYSIS_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`,
`src/components/staff/CaseAnalysis.tsx`.

## FR-06 — Case Listing, Filtering, and Search
Authorised users shall be able to list, filter by status or category, and
search cases by number or description.

**Implemented by:** `src/lib/cases.ts` (`listCases`), `GET /api/cases`,
`src/app/staff/page.tsx`.

## FR-07 — Case Status Management
Authorised users shall be able to change a case's status between `open`,
`in_review`, `resolved`, and `closed`.

**Implemented by:** `PATCH /api/cases/:id`,
`src/components/staff/CaseStatusControls.tsx`.

## FR-08 — Case Intelligence Dashboard
The system shall display: total cases, open cases, resolved cases, cases
requiring review, cases by category, and common issues.

**Implemented by:** `src/lib/cases.ts` (`getCaseStats`),
`GET /api/cases/stats`, `src/app/staff/page.tsx`.

## FR-09 — Human Review Flagging
AI analyses shall include a `human_review_required` boolean that defaults to
`true` whenever the description is ambiguous, information is missing, or
confidence is below 0.7.

**Implemented by:** prompt rules in `CASE_ANALYSIS_SYSTEM_PROMPT`; persisted to
`case_analysis.human_review_required`; surfaced in the dashboard and case
detail.

## FR-10 — Audit Logging
The system shall log every important AI-assisted action (case creation, AI
analysis, status change) with enough detail to reconstruct what the AI
suggested and what the human did.

**Implemented by:** `src/lib/audit.ts` (`writeAuditLog`), called from the three
case API routes.

## FR-11 — Guidance Library (Read-Only)
The system shall expose a read-only listing of the approved guidance entries so
users can see what the assistant uses.

**Implemented by:** `src/app/guidance/page.tsx`.
