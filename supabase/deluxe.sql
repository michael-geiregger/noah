-- TPWE DELUXE: Konten, Erfinder-Ausweis und gespeicherte Zahlungen
-- In Supabase: SQL Editor → New query → alles einfügen → Run.
-- (Läuft nach schema.sql. Kann gefahrlos mehrmals ausgeführt werden.)

-- Erfinder-Ausweis (ein Profil pro Konto)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  display_name text not null default 'Erfinder' check (char_length(display_name) between 1 and 30),
  avatar text not null default '🧑‍🔬' check (char_length(avatar) <= 16),
  rocket_stars int not null default 0 check (rocket_stars >= 0),
  quiz_best int not null default 0 check (quiz_best between 0 and 100),
  blocked boolean not null default false
);
alter table public.profiles enable row level security;

-- Jeder darf nur Name, Avatar und Spielstände ändern – nie "blocked"
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar, rocket_stars, quiz_best) on public.profiles to authenticated;

drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Neues Konto → automatisch ein Ausweis
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 30), ''), 'Erfinder')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Schon vorhandene Konten (z. B. das Admin-Konto) bekommen auch einen Ausweis
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- DELUXE-Mitgliedschaften (hier wird jede Zahlung gespeichert)
create table if not exists public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paid_at timestamptz not null default now(),
  amount_cents int not null default 1050,
  source text not null check (source in ('stripe', 'admin')),
  stripe_session_id text unique
);
alter table public.memberships enable row level security;

-- Nur lesen: Eintragen darf nur der Server (nach echter Zahlung) oder der Admin per Funktion
revoke all on public.memberships from anon, authenticated;
grant select on public.memberships to authenticated;
drop policy if exists "memberships read" on public.memberships;
create policy "memberships read" on public.memberships for select using (user_id = auth.uid() or public.is_admin());

-- Ist das angemeldete Konto DELUXE (und nicht gesperrt)?
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.user_id = auth.uid() and not p.blocked
  );
$$;

-- Admin: DELUXE von Hand freischalten oder entfernen
create or replace function public.admin_set_membership(target uuid, active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if active then
    insert into public.memberships (user_id, source, amount_cents) values (target, 'admin', 0)
    on conflict (user_id) do nothing;
  else
    delete from public.memberships where user_id = target;
  end if;
end;
$$;

-- Admin: Konto sperren oder entsperren
create or replace function public.admin_set_blocked(target uuid, value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.profiles set blocked = value where id = target;
end;
$$;

revoke execute on function public.is_member(), public.admin_set_membership(uuid, boolean), public.admin_set_blocked(uuid, boolean) from public, anon;
grant execute on function public.is_member(), public.admin_set_membership(uuid, boolean), public.admin_set_blocked(uuid, boolean) to authenticated;
