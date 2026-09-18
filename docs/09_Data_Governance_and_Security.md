# 09 — Data Governance & Security

## Purpose
Define what data the system may hold, where it flows, who may see it, and what
safeguards apply. This is a first-class document, not an appendix. Any future
code change must be auditable against this file.

## Data Classification

| Class              | Examples                                     | Storage               | May leave the server? |
|--------------------|----------------------------------------------|-----------------------|-----------------------|
| **Public**         | Approved guidance content                    | `guidance`            | Yes — displayed to any user |
| **Operational**    | Case metadata (category, status, priority)   | `cases`               | Server-side only      |
| **Sensitive**      | Case description, notes, any PII             | `cases.description`   | Server-side; redacted before any AI call |
| **Derived**        | AI analysis output                           | `case_analysis`       | Server-side only      |
| **Audit**          | Action logs, before/after values             | `audit_logs`          | Server-side; readable by authorised staff |
| **Credentials**    | Service-role key, AI API key                 | `.env.local` only     | Never — must not enter the repo |

## Single Source of Truth

| Data                        | Owner table                                |
|-----------------------------|--------------------------------------------|
| Guidance                    | `guidance`                                 |
| Cases                       | `cases`                                    |
| AI case analyses            | `case_analysis` (FK → `cases.id`)          |
| Audit history               | `audit_logs`                               |
| Users / roles *(future)*    | `users` (Supabase Auth + role column)      |
| Uploaded source documents *(future)* | Supabase Storage + a `documents` metadata table |

**Rule:** derived data must always have a foreign key back to its source. An
AI analysis references `case_id`. A retrieved guidance item carries
`guidance.id`. No system may hold a copy of canonical content without a
reference to the original.

## Data Flow Boundaries

```
Browser (public)
   │  may read: guidance (via public policies)
   │  may POST: chat questions (no PII permitted by UI prompt)
   ▼
Next.js API routes (server)
   │  use: anon key for guidance reads
   │       service-role key for case tables (never exposed to the browser)
   ▼
AI Provider  ──── receives ONLY: redacted case text + retrieved guidance
   │
   ▼
Supabase Postgres
   │  cases, case_analysis, audit_logs, guidance
```

## PII Handling Rules

1. **No PII in prompts to external providers until a DPA is signed.**
   `src/lib/redact.ts` strips known patterns (passport numbers, national ID
   patterns, email, phone, addresses) from any text before it is included in an
   LLM request.
2. **The full description is retained locally** in `cases.description` for the
   staff member to see. Only the redacted version travels to the model.
3. **Log redaction decisions** in `audit_logs.details.redaction` so we can
   reconstruct what the model actually saw.
4. **No storage of raw model prompts or completions** beyond the structured
   `case_analysis` record.

> **AI provider terms.** The current development provider (Gemini free tier) retains
> prompt content for product improvement. Until a paid tier or a Data Processing
> Agreement is in place, only public guidance content and synthetic case
> descriptions may be sent. Real case text — even redacted — must not be
> processed by a free-tier provider.

## Access Control

### MVP (current)
- `guidance`: public read via RLS policy.
- `cases`, `case_analysis`, `audit_logs`: RLS enabled, **no anon policies**.
  All access is server-side via the service-role key.

### Pre-requisite for real case data
- Supabase Auth with at least two roles: `public` and `staff`.
- RLS policies keyed on `auth.uid()` and role.
- Every case route re-verifies the caller's role server-side — never trusts a
  client claim.
- A `users` table joined to `auth.users`, with `role` text.

**The system is not ready to hold real citizen data until the above is
implemented, tested, and reviewed.**

## Cross-Border Transfer

Until a lawful basis exists for transferring Zambian personal data to an
external AI provider:
- The MVP must use **synthetic or structured test records only** for cases.
- Guidance documents (public information) may be sent to any provider.
- Providers under consideration must be evaluated against the Data Protection
  Act, 2021 (or the applicable jurisdiction) before use with real case data.

## Audit Trail Requirements

Every one of these actions writes a row to `audit_logs`:
- `case.create` — user, category, priority.
- `case.analyze` — model name, confidence, `human_review_required`, guidance
  titles used, redaction summary.
- `case.update` — before/after status, priority, category.
- *(future)* `auth.login`, `auth.logout`, `user.role.change`,
  `guidance.create`, `guidance.update`.

## Security Boundaries

- **The service-role key never reaches the browser.** It is only read inside
  server-side modules (`src/lib/supabase/admin.ts`).
- **The AI API key never reaches the browser.** It is only read inside
  `src/lib/ai/provider.ts`, which is server-only.
- **No route accepts a raw UUID without Zod validation.**
- **No route trusts a role claim from the client.**
- **No route sends unredacted case text to an external provider.**

## Review Cadence

This document must be re-reviewed:
- Before any real citizen data is loaded.
- Before any new AI provider is enabled.
- Before deployment to a public URL.
- At each programme milestone.
