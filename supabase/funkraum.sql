-- TPWE-Funkraum: Anfragen für Privat-Gespräche mit Noah
-- In Supabase: SQL Editor → New query → alles einfügen → Run.
-- (Läuft nach deluxe.sql. Kann gefahrlos mehrmals ausgeführt werden.)
-- Schutzregel: Niemand kann Noah einfach anrufen – es gibt nur Anfragen,
-- die Noah (Admin) bestätigt und für die er eine Uhrzeit festlegt.

create table if not exists public.call_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default '',
  wish text not null check (char_length(wish) between 1 and 200),
  message text check (char_length(message) <= 300),
  adult_present boolean not null check (adult_present),
  status text not null default 'neu' check (status in ('neu', 'bestaetigt', 'abgelehnt', 'erledigt')),
  scheduled_at timestamptz
);
alter table public.call_requests enable row level security;
revoke all on public.call_requests from anon, authenticated;
grant select, delete on public.call_requests to authenticated;
grant insert (wish, message, adult_present) on public.call_requests to authenticated;
grant update (status, scheduled_at) on public.call_requests to authenticated;

drop policy if exists "calls read" on public.call_requests;
drop policy if exists "calls add" on public.call_requests;
drop policy if exists "calls admin update" on public.call_requests;
drop policy if exists "calls delete" on public.call_requests;
create policy "calls read" on public.call_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "calls add" on public.call_requests for insert with check (user_id = auth.uid() and public.is_member());
create policy "calls admin update" on public.call_requests for update using (public.is_admin()) with check (public.is_admin());
create policy "calls delete" on public.call_requests for delete using ((user_id = auth.uid() and status = 'neu') or public.is_admin());

-- Name/Bild aus dem Ausweis, Start immer als "neu", höchstens 2 offene Anfragen pro Konto
create or replace function public.call_request_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select display_name, avatar into new.author_name, new.author_avatar from public.profiles where id = new.user_id;
  new.status := 'neu';
  new.scheduled_at := null;
  if (select count(*) from public.call_requests
      where user_id = new.user_id and status in ('neu', 'bestaetigt')) >= 2 then
    raise exception 'too-many-requests';
  end if;
  return new;
end;
$$;
drop trigger if exists call_request_defaults on public.call_requests;
create trigger call_request_defaults before insert on public.call_requests
  for each row execute function public.call_request_defaults();
