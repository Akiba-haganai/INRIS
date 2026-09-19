# 08 — MVP Acceptance Criteria

The MVP is accepted when every item below passes on both a mobile viewport
(375 × 667) and a desktop viewport (≥ 1280 × 800).

## A. Guidance Assistant

- [ ] **A1** Guidance Retrieval & Ingestion Workflow:
  - **Guidance Retrieval:** The chat interface must answer queries strictly using information extracted from uploaded documents.
  - **Empty State Support:** If the knowledge base contains no approved documents, the system must clearly indicate that no verified guidance is currently available rather than fabricating or guessing answers.
  - **Ingestion Workflow Validation:** 
    - A staff member uploads an authoritative INRIS document.
    - The system processes the document and enters it into the `draft` state.
    - A staff member reviews and marks the document as `approved`.
    - Only after approval will the public chat be able to retrieve and serve information from the document.
- [ ] **A2** That answer displays at least one source card naming the guidance
  entry, its category and its source label.
- [ ] **A3** Asking *"How do I apply for a diplomatic visa for Mars?"* returns
  exactly the refusal sentence and no source cards.
- [ ] **A4** With the AI provider key deliberately unset, the assistant returns
  the "temporarily unavailable" message and does not display fabricated content.
- [ ] **A5** The UI shows a visible disclaimer on every page: prototype,
  synthetic data, advisory only.

## B. Case Intelligence

- [ ] **B1** A staff user can create a case; it appears in the list with a
  generated `INRIS-#####` number.
- [ ] **B2** The dashboard displays total / open / resolved / needs-review
  counts and a cases-by-category chart.
- [ ] **B3** Searching by case number or description filters the list.
- [ ] **B4** Filtering by status or category works and is reflected in the URL.
- [ ] **B5** A case detail page shows the category, status, priority and
  description.

## C. AI Case Analysis

- [ ] **C1** Running analysis on a case produces a summary, key issues,
  missing information, a suggested next step, a confidence value, and a
  `human_review_required` flag.
- [ ] **C2** The guidance used by the analysis is visible in the UI.
- [ ] **C3** A case described in one or two words yields a low-confidence,
  `human_review_required: true` analysis and does not fabricate details.
- [ ] **C4** If the model returns malformed JSON, the UI shows a graceful
  failure message and nothing is persisted.

## D. Human Oversight

- [ ] **D1** Changing a case's status updates the badge immediately and writes
  a row to `audit_logs`.
- [ ] **D2** The AI never changes `cases.status`; only a staff action does.
- [ ] **D3** Every AI analysis is stored in `case_analysis` and can be re-run;
  re-running adds a new row rather than overwriting.

## E. Audit

- [ ] **E1** `audit_logs` contains rows for `case.create`, `case.analyze`, and
  `case.update` after exercising the app.
- [ ] **E2** The `case.update` row records before and after values.

## F. Non-Functional

- [ ] **F1** No horizontal scrolling at 320 px width.
- [ ] **F2** Every interactive control is at least 44 px tall on mobile.
- [ ] **F3** The bottom navigation bar is visible on mobile and hidden on
  `md:` and above.
- [ ] **F4** Inputs do not trigger a zoom on iOS focus.
- [ ] **F5** With the anon key only, `cases`, `case_analysis` and `audit_logs`
  are not readable (RLS enforced).
- [ ] **F6** A full chat round-trip completes in under 5 seconds on a normal
  connection.
- [ ] **F7** When the AI provider fails, the response is a structured
  `AI_UNAVAILABLE` (503) — never a fabricated answer.

## G. Traceability

- [ ] **G1** Every item in `docs/02_Functional_Requirements.md` maps to a file
  or route in `docs/TRACEABILITY.md`.
- [ ] **G2** Every constraint in `docs/04_Project_Constraints.md` is honoured
  by the implementation (verifiable by inspection of the mapped files).
