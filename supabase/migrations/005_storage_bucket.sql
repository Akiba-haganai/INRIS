-- Storage bucket for uploaded guidance documents.
insert into storage.buckets (id, name, public)
values ('guidance-documents', 'guidance-documents', false)
on conflict (id) do nothing;

-- RLS on storage.objects: staff-only read and write for this bucket.
drop policy if exists "guidance_docs_staff_read" on storage.objects;
create policy "guidance_docs_staff_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'guidance-documents'
    and public.current_user_role() in ('staff', 'admin')
  );

drop policy if exists "guidance_docs_staff_insert" on storage.objects;
create policy "guidance_docs_staff_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'guidance-documents'
    and public.current_user_role() in ('staff', 'admin')
  );

drop policy if exists "guidance_docs_staff_update" on storage.objects;
create policy "guidance_docs_staff_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'guidance-documents'
    and public.current_user_role() in ('staff', 'admin')
  );

drop policy if exists "guidance_docs_staff_delete" on storage.objects;
create policy "guidance_docs_staff_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'guidance-documents'
    and public.current_user_role() in ('staff', 'admin')
  );
