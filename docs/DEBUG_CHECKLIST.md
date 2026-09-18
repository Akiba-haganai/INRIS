# Debug Checklist

Run through this before declaring the MVP done. Each entry lists a symptom,
the most likely cause, and the fix.

## Chat / Guidance

| Symptom | Likely cause | Fix |
|---|---|---|
| Chat returns "temporarily unavailable" every time | AI env vars missing or wrong | Check `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` in `.env.local`; restart `npm run dev` |
| Chat returns the refusal message for a question that *is* in the seed | Seed data not inserted, or search terms filtered out | Re-run `scripts/seed.sql`; try a more specific question |
| Chat returns `grounded: false` with an answer | Model paraphrased but didn't hit the exact refusal sentence | Check `GUIDANCE_SYSTEM_PROMPT`; the model should output the sentence verbatim when unsure |
| Chat hangs | Model provider rate-limited or unreachable | Check provider status; the fetch has no client timeout, which is intentional for the MVP |
| `503` with `AI_UNAVAILABLE` on a normal question | Provider returned an empty completion | Check server console for the actual error |

## Case API

| Symptom | Likely cause | Fix |
|---|---|---|
| `500 Failed to create case` | Missing `SUPABASE_SERVICE_ROLE_KEY` | Add it to `.env.local`, restart dev server |
| Case created but no `case_number` | Trigger not installed | Re-run `001_initial_schema.sql` |
| `404 Case not found` for a case you just created | Using the wrong id | Use the `id` returned by `POST /api/cases`, not the case_number |
| `PATCH` returns 400 | Zod rejected the status value | Allowed: `open`, `in_review`, `resolved`, `closed` |

## Case Analysis

| Symptom | Likely cause | Fix |
|---|---|---|
| `503 AI_UNAVAILABLE` and server log shows "schema mismatch" | Model returned JSON that didn't match `caseAnalysisOutputSchema` | Check `CASE_ANALYSIS_SYSTEM_PROMPT`; consider lowering temperature or adding an example |
| `503` and server log shows "No JSON object found" | Provider doesn't respect `response_format` and prefixed the reply | The parser tolerates code fences and text around JSON; check the raw reply in the server log |
| Analysis saved but UI doesn't show it | Server component cached | Case detail uses `force-dynamic`; hard-refresh (Cmd/Ctrl+Shift+R) |
| Confidence is always 0 | Model omitting the field | Check `CASE_ANALYSIS_SYSTEM_PROMPT` output contract |

## Database / RLS

| Symptom | Likely cause | Fix |
|---|---|---|
| Anon browser can read `cases` | RLS policies accidentally added | `001_initial_schema.sql` deliberately adds no anon policies; verify with `select policyname from pg_policies where tablename='cases';` |
| `guidance` page is empty | Seed not run | Run `scripts/seed.sql` |
| `updated_at` never changes | Trigger missing | Re-run `001_initial_schema.sql` |

## UI / Mobile

| Symptom | Likely cause | Fix |
|---|---|---|
| `bg-brand-700` has no effect | `@theme` block missing or below `@layer base` | Move `@theme` above `@layer base` in `globals.css` |
| Tailwind classes not applying | Old `tailwind.config.*` still present | Delete it; keep only `postcss.config.mjs` |
| Content hidden behind bottom nav | Missing `pb-24` on `<main>` | Confirm `layout.tsx` main has `pb-24 md:pb-8` |
| Chat composer overlaps bottom nav | Composer not offset | Confirm composer has `bottom-20 md:bottom-0` |
| Zoom on iOS input focus | Input font-size < 16px | `globals.css` sets `input, select, textarea { font-size: 1rem }`; confirm it wasn't overridden |
| Safe-area insets ignored on notched phones | Missing `viewport-fit=cover` | Confirm `viewport` export in `layout.tsx` includes `viewportFit: 'cover'` |
| Drawer doesn't close on backdrop tap | Backdrop covered by panel | Confirm the backdrop div is a sibling *before* the panel |

## Audit Logging

| Symptom | Likely cause | Fix |
|---|---|---|
| `audit_logs` empty | Env var for service role missing | Audit failures are swallowed; check server console for `[audit]` messages |
| `case.update` row has no before/after | Update called before `getCase` | `PATCH /api/cases/:id` reads the case before updating; don't refactor that away |

## Acceptance Pass (final run before the demo)

In order, with `npm run dev` and the API tests already green:

1. Open `http://localhost:3000` on a 375 px viewport.
2. Ask the lost-passport question. Note the source card.
3. Ask the Mars visa question. Note the refusal and no sources.
4. Tap **Library** in the bottom nav. Confirm the guidance list renders.
5. Tap **Staff**. Confirm the dashboard totals match what's in the DB.
6. Create a case. Confirm the `INRIS-#####` number.
7. Open the case. Run analysis. Confirm summary, issues, missing info,
   suggested action, confidence, review flag.
8. Change the status. Confirm the badge updates.
9. Run `select action from audit_logs order by created_at desc limit 5;` and
   confirm `case.create`, `case.analyze`, `case.update`.
10. Resize to 1280 px. Confirm the table replaces the card list and the bottom
    nav hides.

If all ten pass, the MVP is done.
