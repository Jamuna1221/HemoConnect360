-- HemoConnect360 - Donor document storage
-- Run this in the Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('donor-docs', 'donor-docs', true)
on conflict (id) do update set public = true;

drop policy if exists "donor_docs_upload_own" on storage.objects;
create policy "donor_docs_upload_own" on storage.objects
  for insert
  with check (
    bucket_id = 'donor-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "donor_docs_public_read" on storage.objects;
create policy "donor_docs_public_read" on storage.objects
  for select
  using (bucket_id = 'donor-docs');
