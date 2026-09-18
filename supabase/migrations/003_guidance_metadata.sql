alter table public.guidance
  add column if not exists source_url     text,
  add column if not exists version        text,
  add column if not exists effective_date date,
  add column if not exists status         text not null default 'approved',
  add column if not exists updated_at     timestamptz not null default now();

alter table public.guidance
  drop constraint if exists guidance_status_check;
alter table public.guidance
  add constraint guidance_status_check
  check (status in ('draft', 'approved', 'retired'));

create index if not exists guidance_status_idx on public.guidance (status);

create or replace function public.touch_guidance_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guidance_updated_at on public.guidance;
create trigger trg_guidance_updated_at
  before update on public.guidance
  for each row execute function public.touch_guidance_updated_at();
