# 03 — Non-Functional Requirements

## NFR-01 — Accuracy
AI responses shall be based on verified knowledge-base content wherever
possible. When no matching guidance exists, the system must refuse rather than
speculate.

**Evidence:** `POST /api/chat` short-circuits to `INSUFFICIENT_INFO_MESSAGE`
when retrieval returns zero results; the system prompt forbids invention.
Verified by test case 2 in `scripts/test-api.mjs`.

## NFR-02 — Explainability
The system shall show the relevant guidance and source used to generate an
answer.

**Evidence:** every chat response returns a `sources` array; the UI renders
source cards under each assistant message (`src/components/chat/ChatMessage.tsx`).

## NFR-03 — Human Oversight
AI suggestions must be reviewable and editable by authorised personnel. The
system must never autonomously approve, reject, or finalise.

**Evidence:** the AI never writes directly to `cases.status`; it writes to
`case_analysis`. Only a staff action updates case state. Every AI analysis
carries a `human_review_required` flag.

## NFR-04 — Security
Sensitive information must not be exposed to unauthorised users.

**Evidence:** `cases`, `case_analysis` and `audit_logs` have RLS enabled with
**no** anon policies, so the anon key cannot read them. All case access goes
through server routes using `SUPABASE_SERVICE_ROLE_KEY`, which never reaches the
browser.

## NFR-05 — Privacy
The MVP shall avoid real citizen information and use synthetic data during
development and demonstration.

**Evidence:** all seeded guidance is labelled "DEMO — synthetic guidance"; the
case form explicitly prompts users not to enter real data; the footer displays
the disclaimer on every page.

## NFR-06 — Performance
Ordinary searches and interface interactions should return within a reasonable
time on typical connections.

**Target:** grounded chat responses under 5 s (LLM round-trip); database-only
operations under 3 s.

**Evidence:** keyword retrieval uses indexed ILIKE lookups; the RAG layer
caps the candidate set at 50 rows before scoring.

## NFR-07 — Accessibility and Responsiveness
The interface shall work on mobile phones, tablets, and desktop computers.

**Evidence:** mobile-first layout with a bottom navigation bar on `< md`, an
inline navigation bar on `>= md`, a card list on small screens and a table on
large; all interactive elements have a ≥ 44 px touch target; inputs use
`font-size: 1rem` to prevent iOS zoom; safe-area insets are respected.

## NFR-08 — Reliability
The application shall handle AI failures gracefully rather than displaying
fabricated information.

**Evidence:** `POST /api/chat` and `POST /api/cases/analyze` return a
structured `AI_UNAVAILABLE` response on any failure (missing key, network
error, schema mismatch) instead of inventing content.

## NFR-09 — Maintainability
Guidance shall be stored separately from application code so authorised
administrators can update it without rewriting the system.

**Evidence:** guidance lives entirely in the `guidance` Postgres table. Adding,
editing or removing guidance is a SQL operation and requires no code change.

## NFR-10 — Auditability
Important AI-assisted actions shall be logged.

**Evidence:** `audit_logs` records `case.create`, `case.analyze`, and
`case.update` with before/after values, model name, confidence and guidance
titles used.
