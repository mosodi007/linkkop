-- Contacts: derived from accepted connection requests. One row per (user, contact) so each user sees their own list.
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, contact_id),
  check (user_id != contact_id)
);

create index if not exists contacts_user_id_idx on public.contacts(user_id);
create index if not exists contacts_contact_id_idx on public.contacts(contact_id);

alter table public.contacts enable row level security;

create policy "Users can view own contacts"
  on public.contacts for select using (auth.uid() = user_id);

create policy "Users can add own contacts"
  on public.contacts for insert with check (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on public.contacts for delete using (auth.uid() = user_id);

-- Notifications: allow insert so that e.g. connection request sender can create a notification for the recipient.
create policy "Users can insert notifications for others"
  on public.notifications for insert
  to authenticated
  with check (user_id != auth.uid());

-- Index for unread notifications
create index if not exists notifications_user_id_read_at_idx on public.notifications(user_id, read_at);

-- When a connection request is accepted, add both users to each other's contacts.
create or replace function public.add_contacts_on_accept()
returns trigger as $$
begin
  if new.status = 'accepted' and (old.status is null or old.status != 'accepted') then
    insert into public.contacts (user_id, contact_id)
    values (new.from_user_id, new.to_user_id), (new.to_user_id, new.from_user_id)
    on conflict (user_id, contact_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists connection_requests_add_contacts on public.connection_requests;
create trigger connection_requests_add_contacts
  after update on public.connection_requests
  for each row execute function public.add_contacts_on_accept();
