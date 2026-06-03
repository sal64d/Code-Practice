-- Private Storage buckets and prototype policies (US-003)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('problem-mdx', 'problem-mdx', false, 52428800, array['text/markdown', 'text/plain', 'text/mdx', 'application/octet-stream']),
  ('submission-code', 'submission-code', false, 52428800, array['text/plain', 'application/javascript', 'application/x-httpd-php', 'application/octet-stream'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can read problem-mdx"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'problem-mdx');

create policy "Authenticated users can insert problem-mdx"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'problem-mdx');

create policy "Authenticated users can update problem-mdx"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'problem-mdx')
  with check (bucket_id = 'problem-mdx');

create policy "Authenticated users can read submission-code"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'submission-code');

create policy "Authenticated users can insert submission-code"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'submission-code');

create policy "Authenticated users can update submission-code"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'submission-code')
  with check (bucket_id = 'submission-code');
