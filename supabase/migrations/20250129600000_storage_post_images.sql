-- Post images bucket for feed post photos (public so post images are viewable)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

-- Authenticated users can upload to their own folder: user_id/*
create policy "Users can upload own post images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can read (public bucket)
create policy "Post images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'post-images');

-- Users can update/delete their own files
create policy "Users can update own post image"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own post image"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
