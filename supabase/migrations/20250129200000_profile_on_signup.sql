-- Create a minimal profile when a new user signs up (auth.users).
-- The client then upserts the full onboarding data over this row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, 'New User')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger runs after a row is inserted into auth.users (Supabase Auth).
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
