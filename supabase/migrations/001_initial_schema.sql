-- =========================================================
-- 001_initial_schema.sql
--
-- FIX: this file was present in the repo but EMPTY. Every later
-- migration (003-006) does `alter table public.guidance ...` etc,
-- assuming these tables already exist. Nothing in the repo actually
-- created them. This is the foundational schema described in
-- docs/06_Database_Design.md, recreated from that spec.
--
-- Run this first, before 003_guidance_metadata.sql.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- guidance ---------------------------------------------------
create table if not exists public.guidance (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  category       text not null,
  content        text not null,
  source         text not null,
  last_verified  timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists guidance_category_idx on public.guidance (category);

create index if not exists guidance_search_idx on public.guidance
  using gin (to_tsvector('english', title || ' ' || content));

-- ---------- cases --------------------------------------------------------
create table if not exists public.cases (
  id           uuid primary key default gen_random_uuid(),
  case_number  text unique,
  category     text not null,
  description  text not null,
  status       text not null default 'open',
  priority     text not null default 'normal',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint cases_category_check check (category in (
    'New Application', 'Renewal', 'Lost Passport', 'Damaged Passport',
    'Replacement', 'Supporting Documents', 'Application Procedures',
    'Collection', 'Other'
  )),
  constraint cases_status_check check (status in ('open', 'in_review', 'resolved', 'closed')),
  constraint cases_priority_check check (priority in ('low', 'normal', 'high', 'urgent'))
);

create index if not exists cases_status_idx on public.cases (status);
create index if not exists cases_category_idx on public.cases (category);

-- case_number generation: INRIS-##### via a dedicated sequence.
create sequence if not exists public.case_number_seq start with 1 increment by 1;

create or replace function public.set_case_number()
returns trigger language plpgsql as $$
begin
  if new.case_number is null then
    new.case_number := 'INRIS-' || lpad(nextval('public.case_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_case_number on public.cases;
create trigger trg_set_case_number
  before insert on public.cases
  for each row execute function public.set_case_number();

create or replace function public.touch_cases_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_cases_updated_at on public.cases;
create trigger trg_cases_updated_at
  before update on public.cases
  for each row execute function public.touch_cases_updated_at();

-- ---------- case_analysis -------------------------------------------------
create table if not exists public.case_analysis (
  id                     uuid primary key default gen_random_uuid(),
  case_id                uuid not null references public.cases(id) on delete cascade,
  summary                text not null,
  issues                 text[] not null default '{}',
  missing_information    text[] not null default '{}',
  suggested_action       text not null,
  confidence             numeric(3,2) not null,
  human_review_required  boolean not null default true,
  created_at             timestamptz not null default now(),
  constraint case_analysis_confidence_check check (confidence >= 0 and confidence <= 1)
);

create index if not exists case_analysis_case_id_idx on public.case_analysis (case_id);

-- ---------- audit_logs -----------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  case_id     uuid references public.cases(id) on delete set null,
  action      text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_case_id_idx on public.audit_logs (case_id);

-- ---------- RLS --------------------------------------------------------
-- guidance: public read (narrowed to status='approved' once 004 adds that
-- column and replaces this policy). cases / case_analysis / audit_logs:
-- RLS on, no anon policies at all -- server-only via the service-role key.
-- (004_documents_and_chunks.sql later adds authenticated staff-read
-- policies on top of this.)

alter table public.guidance       enable row level security;
alter table public.cases          enable row level security;
alter table public.case_analysis  enable row level security;
alter table public.audit_logs     enable row level security;

drop policy if exists "guidance_public_read" on public.guidance;
create policy "guidance_public_read"
  on public.guidance for select
  to anon, authenticated
  using (true);
