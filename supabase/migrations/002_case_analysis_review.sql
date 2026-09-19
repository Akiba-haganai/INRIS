-- =========================================================
-- 002_case_analysis_review.sql
-- Adds case_type + relevant_guidance, which FR-05 requires but
-- the original case_analysis table had no columns for.
-- =========================================================

alter table public.case_analysis
  add column if not exists case_type          text,
  add column if not exists relevant_guidance   text[] not null default '{}';

create index if not exists case_analysis_review_idx
  on public.case_analysis (case_id)
  where human_review_required = true;
