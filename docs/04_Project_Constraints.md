# 04 — Project Constraints

## C-01 — No real government data for MVP
The MVP uses synthetic data unless INRIS officially provides authorised
development data. Every seeded guidance entry is labelled as demo material.

## C-02 — AI is advisory only
The system must not autonomously approve, reject, or make official
determinations about citizens. All AI output is a suggestion that a human
officer reviews.

## C-03 — Limited MVP scope
The MVP is a working proof of concept, not a replacement for an INRIS
production system. Features outside the specified FRs are deliberately excluded.

## C-04 — Official information dependency
Final guidance must ultimately come from authoritative INRIS/government
sources. The current knowledge base is a placeholder pending that material.

## C-05 — Security
The MVP avoids unnecessary storage of sensitive personal information. Cases are
intended to hold synthetic descriptions only. RLS is enabled and case tables
have no anon policies.

## C-06 — Infrastructure portability
The programme provides access to sovereign GPU infrastructure on campus. The AI
layer is therefore abstracted behind an OpenAI-compatible client
(`src/lib/ai/provider.ts`) so the development API endpoint can be replaced with
a locally hosted model by changing environment variables only — no code change.

## C-07 — Team capability
The system must be achievable by a multidisciplinary student team. It uses only
Next.js, Supabase (Postgres), and an OpenAI-compatible chat endpoint — no
custom ML training, no bespoke infrastructure.

## C-08 — Time
The MVP is built to fit within the three-month build-and-test programme. Some complex integrations (e.g. real government APIs, advanced evaluation harnesses) are deferred to later stages.
