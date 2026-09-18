-- =========================================================
-- Documents, chunks, embeddings, auth-role schema
-- =========================================================

create extension if not exists vector;

-- ---------- users / roles --------------------------------------------
-- Mirrors auth.users with application-level role.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'public',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint users_role_check check (role in ('public', 'staff', 'admin'))
);

-- Auto-create a profile when a new auth user is created.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.touch_users_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.touch_users_updated_at();

-- Helper used by RLS policies.
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

-- ---------- documents (uploaded source files) ------------------------
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  original_filename text not null,
  storage_path      text not null,
  mime_type         text not null,
  file_size_bytes   bigint not null,
  sha256            text not null,
  version           integer not null default 1,
  status            text not null default 'uploaded',
  uploaded_by       uuid references auth.users(id) on delete set null,
  uploaded_at       timestamptz not null default now(),
  processed_at      timestamptz,
  error_message     text,
  metadata          jsonb not null default '{}'::jsonb,
  constraint documents_status_check
    check (status in ('uploaded', 'processing', 'ready', 'failed', 'retired'))
);

create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_uploaded_at_idx on public.documents (uploaded_at desc);
create unique index if not exists documents_sha256_uidx on public.documents (sha256);

-- ---------- guidance: provenance + lifecycle -------------------------
alter table public.guidance
  add column if not exists document_id    uuid references public.documents(id) on delete set null,
  add column if not exists source_url     text,
  add column if not exists version        text,
  add column if not exists effective_date date,
  add column if not exists status         text not null default 'approved',
  add column if not exists updated_at     timestamptz not null default now();

-- Replace the earlier status check if 003 was applied.
alter table public.guidance drop constraint if exists guidance_status_check;
alter table public.guidance add constraint guidance_status_check
  check (status in ('demo', 'draft', 'approved', 'retired'));

create index if not exists guidance_status_idx on public.guidance (status);
create index if not exists guidance_document_id_idx on public.guidance (document_id);

create or replace function public.touch_guidance_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_guidance_updated_at on public.guidance;
create trigger trg_guidance_updated_at
  before update on public.guidance
  for each row execute function public.touch_guidance_updated_at();

-- Mark existing seed content as demo so it can be filtered out of real answers.
update public.guidance
   set status = 'demo'
 where source ilike 'DEMO%' and status = 'approved';

-- ---------- guidance_chunks (derived, embedded) ----------------------
create table if not exists public.guidance_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  guidance_id  uuid references public.guidance(id) on delete set null,
  chunk_index  integer not null,
  content      text not null,
  token_count  integer,
  embedding    vector(1536),
  created_at   timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists guidance_chunks_document_idx
  on public.guidance_chunks (document_id);

-- IVFFlat index — good enough for a small corpus; swap to HNSW later if needed.
create index if not exists guidance_chunks_embedding_idx
  on public.guidance_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------- RLS ------------------------------------------------------
alter table public.users            enable row level security;
alter table public.documents        enable row level security;
alter table public.guidance_chunks  enable row level security;

-- Users can see their own profile. Admins see all.
drop policy if exists "users_self_read" on public.users;
create policy "users_self_read"
  on public.users for select
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

-- Staff can read all documents. Only staff can insert. Nobody but admin deletes.
drop policy if exists "documents_staff_read" on public.documents;
create policy "documents_staff_read"
  on public.documents for select
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'));

drop policy if exists "documents_staff_insert" on public.documents;
create policy "documents_staff_insert"
  on public.documents for insert
  to authenticated
  with check (public.current_user_role() in ('staff', 'admin'));

drop policy if exists "documents_staff_update" on public.documents;
create policy "documents_staff_update"
  on public.documents for update
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'));

-- Chunks: staff read. Writes go through the service role only (ingestion).
drop policy if exists "chunks_staff_read" on public.guidance_chunks;
create policy "chunks_staff_read"
  on public.guidance_chunks for select
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'));

-- Guidance: staff read everything, public reads only approved.
drop policy if exists "guidance_public_read" on public.guidance;
drop policy if exists "guidance_public_approved" on public.guidance;
create policy "guidance_public_approved"
  on public.guidance for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "guidance_staff_all" on public.guidance;
create policy "guidance_staff_all"
  on public.guidance for all
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'))
  with check (public.current_user_role() in ('staff', 'admin'));

-- Cases / case_analysis / audit_logs remain with no anon policies —
-- but now staff can read them via RLS instead of only the service role.
drop policy if exists "cases_staff_read" on public.cases;
create policy "cases_staff_read"
  on public.cases for select
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'));

drop policy if exists "case_analysis_staff_read" on public.case_analysis;
create policy "case_analysis_staff_read"
  on public.case_analysis for select
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'));

drop policy if exists "audit_logs_staff_read" on public.audit_logs;
create policy "audit_logs_staff_read"
  on public.audit_logs for select
  to authenticated
  using (public.current_user_role() in ('staff', 'admin'));
