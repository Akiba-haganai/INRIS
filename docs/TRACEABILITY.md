# Traceability Matrix

Every requirement maps to the file(s) that implement it, the test that
verifies it, and its current status.

Legend: ✅ achieved · 🟡 partial · 🔴 missing · ⚠️ contradicts context

## Functional Requirements

| ID    | Requirement              | Implementation                                                     | Verification                    | Status |
|-------|--------------------------|--------------------------------------------------------------------|---------------------------------|--------|
| FR-01 | Guidance search          | `src/lib/ai/rag.ts`, `POST /api/chat`                              | test-api.mjs #1                 | ✅     |
| FR-02 | AI guidance assistant    | `src/lib/ai/prompts.ts`, `POST /api/chat` grounding gate           | test-api.mjs #1, #2             | ✅     |
| FR-03 | Guidance categories      | `scripts/seed.sql`, `guidance.category`                            | Manual: `/guidance` page        | ✅     |
| FR-04 | Case creation            | `POST /api/cases`, `src/lib/cases.ts`, `CaseForm.tsx`              | test-api.mjs #3                 | ✅     |
| FR-05 | AI case classification   | `POST /api/cases/analyze`, `CASE_ANALYSIS_SYSTEM_PROMPT`           | test-api.mjs #6                 | ✅     |
| FR-06 | Case list / filter       | `listCases`, `GET /api/cases`, `staff/page.tsx`                    | test-api.mjs #4                 | ✅     |
| FR-07 | Case status management   | `PATCH /api/cases/:id`, `CaseStatusControls.tsx`                   | test-api.mjs #7                 | ✅     |
| FR-08 | Dashboard stats          | `getCaseStats`, `GET /api/cases/stats`                             | test-api.mjs #8                 | ✅     |
| FR-09 | Human review flag        | `case_analysis.human_review_required`, prompt rules                | test-api.mjs #6, manual         | ✅     |
| FR-10 | Audit logging            | `src/lib/audit.ts`, called from all case routes                    | Manual: `select * from audit_logs` | ✅  |
| FR-11 | Read-only guidance view  | `src/app/guidance/page.tsx`                                        | Manual                          | ✅     |

## Non-Functional Requirements

| ID     | Requirement              | Implementation                                                     | Status |
|--------|--------------------------|--------------------------------------------------------------------|--------|
| NFR-01 | Accuracy / grounding     | Retrieval gate in `POST /api/chat`                                 | ✅     |
| NFR-02 | Explainability           | `sources` array in every chat response; `ChatMessage.tsx`          | ✅     |
| NFR-03 | Human oversight          | AI writes only to `case_analysis`; `human_review_required`         | ✅     |
| NFR-04 | Security / RLS           | `001_initial_schema.sql` RLS block; `supabase/admin.ts` server-only| ✅     |
| NFR-05 | Privacy / synthetic data | Seed labels; case form prompt; footer disclaimer                   | ✅     |
| NFR-06 | Performance              | Indexed lookups; 50-row retrieval cap                              | 🟡 target set, not yet measured |
| NFR-07 | Responsive / a11y        | Mobile shell, bottom nav, 44px targets, iOS zoom guard             | ✅     |
| NFR-08 | Reliability              | `AI_UNAVAILABLE` responses in both AI routes                       | ✅     |
| NFR-09 | Maintainability          | Guidance lives in DB, not code                                     | ✅     |
| NFR-10 | Auditability             | `audit_logs` records before/after                                  | ✅     |

## Constraints

| ID   | Constraint                | Honoured by                                                     | Status |
|------|---------------------------|-----------------------------------------------------------------|--------|
| C-01 | No real government data   | Synthetic seed; UI disclaimer                                   | ✅     |
| C-02 | AI advisory only          | AI writes to `case_analysis` only; no status mutation           | ✅     |
| C-03 | Limited MVP scope         | FRs enumerated; no feature creep in codebase                    | ✅     |
| C-04 | Official info dependency  | All seeded guidance labelled DEMO                               | ✅     |
| C-05 | Security                  | RLS; service-role key server-only                               | ✅     |
| C-06 | Infrastructure portability| `src/lib/ai/provider.ts` selects backend from env vars only     | ✅     |
| C-07 | Team capability           | Only Next.js + Supabase + an OpenAI-compatible endpoint         | ✅     |
| C-08 | Time (3-month programme)  | Deliverable in one MVP iteration                                | ✅     |

## Deliberately Deferred

| Feature                      | Reason                                           | Revisit |
|------------------------------|--------------------------------------------------|---------|
| Vector search / embeddings   | Not required for MVP; guidance set is small      | Post-MVP |
| Authentication with roles    | MVP is server-only; service-role key is boundary | Post-MVP |
| Streaming chat responses     | Responses are short                              | Post-MVP |
| File / document upload       | Out of scope for MVP                             | Post-MVP |
| Local sovereign GPU model    | Requires campus infrastructure                   | Post-MVP |
