-- Occupations reference table for profile occupation
create table if not exists public.occupations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create index if not exists occupations_name_idx on public.occupations(name);

alter table public.occupations enable row level security;

create policy "Occupations are readable by everyone"
  on public.occupations for select using (true);

-- Seed occupations (common professions)
insert into public.occupations (name) values
  ('Accountant'), ('Actor'), ('Architect'), ('Artist'), ('Attorney'), ('Baker'), ('Banker'),
  ('Barber'), ('Bartender'), ('Blogger'), ('Builder'), ('Chef'), ('Coach'), ('Consultant'),
  ('Designer'), ('Developer'), ('Doctor'), ('Driver'), ('Electrician'), ('Engineer'),
  ('Entrepreneur'), ('Farmer'), ('Firefighter'), ('Freelancer'), ('Hairdresser'), ('Journalist'),
  ('Lawyer'), ('Mechanic'), ('Nurse'), ('Pharmacist'), ('Photographer'), ('Pilot'), ('Plumber'),
  ('Police Officer'), ('Professor'), ('Psychologist'), ('Real Estate Agent'), ('Researcher'),
  ('Scientist'), ('Social Worker'), ('Teacher'), ('Therapist'), ('Veterinarian'), ('Writer'),
  ('Administrator'), ('Analyst'), ('Carpenter'), ('Dentist'), ('Dietitian'), ('Editor'),
  ('HR Manager'), ('Interpreter'), ('Librarian'), ('Marketing Manager'), ('Musician'),
  ('Paramedic'), ('Pastor'), ('Personal Trainer'), ('Physician'), ('Receptionist'),
  ('Sales Representative'), ('Software Engineer'), ('Surgeon'), ('Translator'), ('Volunteer')
on conflict (name) do nothing;

-- Add gender and occupation to profiles
alter table public.profiles
  add column if not exists gender text check (gender in ('male', 'female')),
  add column if not exists occupation_id uuid references public.occupations(id) on delete set null;
