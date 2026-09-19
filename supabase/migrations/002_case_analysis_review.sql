-- =========================================================
-- 002_case_analysis_review.sql
--
-- FIX: referenced by docs/06_Database_Design.md and README.md as part
-- of the schema's source of truth, but the file did not exist anywhere
-- in the repo. Recreated here.
--
-- Adds the two AI-output fields that FR-05 requires ("the AI shall
-- suggest: case type ... relevant guidance") but that the original
-- case_analysis table had no columns for -- previously the API
-- validated them from the model's JSON output and then silently
-- discarded them before saving. Also adds the partial "needs review"
-- index docs/06 mentions.
-- =========================================================

alter table public.case_analysis
  add column if not exists case_type          text,
  add column if not exists relevant_guidance   text[] not null default '{}';

-- Fast lookup of cases still awaiting human review.
create index if not exists case_analysis_review_idx
  on public.case_analysis (case_id)
  where human_review_required = true;
