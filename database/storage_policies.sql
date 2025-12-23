-- 1. Create the Bucket (if not exists)
insert into storage.buckets (id, name, public)
values ('pass-assets', 'pass-assets', true)
on conflict (id) do nothing;

-- 2. Allow Public Access to Read (So the Pass can display the image)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'pass-assets' );

-- 3. Allow Authenticated Users to Upload (The Agency Owner)
create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'pass-assets' );

-- 4. Allow Authenticated Users to Update/Delete their own uploads (Optional but good)
create policy "Authenticated Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'pass-assets' );
