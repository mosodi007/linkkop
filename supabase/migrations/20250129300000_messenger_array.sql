-- Allow multiple messengers per profile (array instead of single text).
alter table public.profiles
  drop constraint if exists profiles_messenger_check;

alter table public.profiles
  alter column messenger type text[] using (
    case
      when messenger is null or messenger = '' then '{}'
      else array[messenger]
    end
  );

alter table public.profiles
  alter column messenger set default '{}';
