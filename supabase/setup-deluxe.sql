-- TPWE: DELUXE komplett einrichten (deluxe.sql + extras.sql + funkraum.sql in einem)
-- In Supabase: SQL Editor → New query → ALLES einfügen → Run. Kann gefahrlos mehrmals laufen.


-- ════════════════ deluxe.sql ════════════════
-- TPWE DELUXE: Konten, Erfinder-Ausweis und gespeicherte Zahlungen

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

-- ════════════════ extras.sql ════════════════
-- TPWE DELUXE-Extras: Bestenliste, Wochen-Challenge, TPWE-Taler, Pinnwand, Professor Zahnrad

-- ───────── Spiel-Ergebnisse (Grundlage für Bestenliste, Challenges und Taler) ─────────
create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game text not null check (game in ('rocket', 'quiz')),
  points int not null check (points between 0 and 10),
  created_at timestamptz not null default now()
);
create index if not exists game_results_user_idx on public.game_results (user_id, created_at);
create index if not exists game_results_time_idx on public.game_results (game, created_at);
alter table public.game_results enable row level security;
revoke all on public.game_results from anon, authenticated;
grant select, insert (game, points) on public.game_results to authenticated;
drop policy if exists "results read" on public.game_results;
drop policy if exists "results add" on public.game_results;
create policy "results read" on public.game_results for select using (user_id = auth.uid() or public.is_admin());
create policy "results add" on public.game_results for insert with check (user_id = auth.uid());

-- Schummel-Bremse: Rakete max. 3 Punkte, Quiz max. 10, und nicht schneller als alle 4 Sekunden
create or replace function public.check_game_result()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.game = 'rocket' and new.points > 3 then raise exception 'too many points'; end if;
  if exists (
    select 1 from public.game_results
    where user_id = new.user_id and game = new.game and created_at > now() - interval '4 seconds'
  ) then raise exception 'too fast'; end if;
  return new;
end;
$$;
drop trigger if exists game_result_check on public.game_results;
create trigger game_result_check before insert on public.game_results
  for each row execute function public.check_game_result();

-- ───────── Wochen-Challenges (legt Noah im Admin an) ─────────
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  title_en text,
  title_ja text,
  prize text,
  game text not null check (game in ('rocket', 'quiz')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at)
);
alter table public.challenges enable row level security;
revoke all on public.challenges from anon, authenticated;
grant select, insert, update, delete on public.challenges to authenticated;
drop policy if exists "challenges read" on public.challenges;
drop policy if exists "challenges admin" on public.challenges;
create policy "challenges read" on public.challenges for select using (public.is_member() or public.is_admin());
create policy "challenges admin" on public.challenges for all using (public.is_admin()) with check (public.is_admin());

-- Bestenliste: Top 20 (Punkte seit "since"), nur für DELUXE-Mitglieder und Admin sichtbar
create or replace function public.leaderboard(p_game text, p_since timestamptz default '-infinity', p_until timestamptz default 'infinity')
returns table (display_name text, avatar text, points bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  select p.display_name, p.avatar, sum(r.points) as points, p.id = auth.uid() as is_me
  from public.game_results r
  join public.profiles p on p.id = r.user_id
  join public.memberships m on m.user_id = r.user_id  -- nur DELUXE-Mitglieder erscheinen
  where (public.is_member() or public.is_admin())
    and r.game = p_game and r.created_at >= p_since and r.created_at < p_until
    and not p.blocked
  group by p.id, p.display_name, p.avatar
  having sum(r.points) > 0
  order by points desc, min(r.created_at)
  limit 20;
$$;

-- ───────── TPWE-Taler: 1 Taler pro Punkt, ausgeben im Taler-Shop ─────────
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  title_en text,
  title_ja text,
  emoji text not null default '🎁',
  cost int not null check (cost > 0),
  active boolean not null default true
);
alter table public.rewards enable row level security;
revoke all on public.rewards from anon, authenticated;
grant select, insert, update, delete on public.rewards to authenticated;
drop policy if exists "rewards read" on public.rewards;
drop policy if exists "rewards admin" on public.rewards;
create policy "rewards read" on public.rewards for select using ((active and public.is_member()) or public.is_admin());
create policy "rewards admin" on public.rewards for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete set null,
  reward_title text not null,
  cost int not null,
  status text not null default 'neu' check (status in ('neu', 'erledigt', 'abgelehnt'))
);
alter table public.redemptions enable row level security;
revoke all on public.redemptions from anon, authenticated;
grant select on public.redemptions to authenticated;
grant update (status) on public.redemptions to authenticated;
drop policy if exists "redemptions read" on public.redemptions;
drop policy if exists "redemptions admin" on public.redemptions;
create policy "redemptions read" on public.redemptions for select using (user_id = auth.uid() or public.is_admin());
create policy "redemptions admin" on public.redemptions for update using (public.is_admin()) with check (public.is_admin());

-- Kontostand: verdiente Taler minus ausgegebene (abgelehnte zählen nicht)
create or replace function public.taler_balance(p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select sum(points) from public.game_results where user_id = p_user), 0)::int
       - coalesce((select sum(cost) from public.redemptions where user_id = p_user and status <> 'abgelehnt'), 0)::int
  where p_user = auth.uid() or public.is_admin();
$$;

-- Belohnung einlösen (prüft Mitgliedschaft und Kontostand)
create or replace function public.redeem_reward(p_reward uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.rewards;
begin
  if not public.is_member() then raise exception 'not-member'; end if;
  select * into r from public.rewards where id = p_reward and active;
  if not found then raise exception 'not-found'; end if;
  -- gleichzeitiges Doppelt-Einlösen verhindern
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if public.taler_balance(auth.uid()) < r.cost then raise exception 'not-enough-taler'; end if;
  insert into public.redemptions (user_id, reward_id, reward_title, cost) values (auth.uid(), r.id, r.title, r.cost);
end;
$$;

-- ───────── Erfinder-Pinnwand (Noah gibt jeden Beitrag frei) ─────────
create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default '',
  text text not null check (char_length(text) between 1 and 300),
  approved boolean not null default false
);
alter table public.board_posts enable row level security;
revoke all on public.board_posts from anon, authenticated;
grant select, insert (text), delete on public.board_posts to authenticated;
grant update (approved) on public.board_posts to authenticated;
drop policy if exists "board read" on public.board_posts;
drop policy if exists "board add" on public.board_posts;
drop policy if exists "board admin update" on public.board_posts;
drop policy if exists "board delete" on public.board_posts;
create policy "board read" on public.board_posts for select
  using ((approved and public.is_member()) or user_id = auth.uid() or public.is_admin());
create policy "board add" on public.board_posts for insert with check (user_id = auth.uid() and public.is_member());
create policy "board admin update" on public.board_posts for update using (public.is_admin()) with check (public.is_admin());
create policy "board delete" on public.board_posts for delete using (user_id = auth.uid() or public.is_admin());

-- Name und Bild kommen immer aus dem Ausweis, Beiträge starten immer unfreigegeben
create or replace function public.board_post_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select display_name, avatar into new.author_name, new.author_avatar from public.profiles where id = new.user_id;
  new.approved := false;
  if (select count(*) from public.board_posts where user_id = new.user_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too-many-posts';
  end if;
  return new;
end;
$$;
drop trigger if exists board_post_defaults on public.board_posts;
create trigger board_post_defaults before insert on public.board_posts
  for each row execute function public.board_post_defaults();

-- ───────── Professor Zahnrad: Fragen-Protokoll (schreibt nur der Server) ─────────
create table if not exists public.ai_questions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  lang text not null default 'de'
);
create index if not exists ai_questions_user_idx on public.ai_questions (user_id, created_at);
alter table public.ai_questions enable row level security;
revoke all on public.ai_questions from anon, authenticated;
grant select on public.ai_questions to authenticated;
drop policy if exists "ai read" on public.ai_questions;
create policy "ai read" on public.ai_questions for select using (user_id = auth.uid() or public.is_admin());

-- Rechte für die Funktionen
revoke execute on function public.leaderboard(text, timestamptz, timestamptz), public.taler_balance(uuid), public.redeem_reward(uuid) from public, anon;
grant execute on function public.leaderboard(text, timestamptz, timestamptz), public.taler_balance(uuid), public.redeem_reward(uuid) to authenticated;

-- Ein paar Start-Belohnungen für den Taler-Shop (Noah kann sie im Admin ändern)
insert into public.rewards (title, title_en, title_ja, emoji, cost)
select * from (values
  ('TPWE-Sticker', 'TPWE sticker', 'TPWEステッカー', '🏷️', 20),
  ('Noah erfindet etwas für dich', 'Noah invents something for you', 'ノアがきみのために発明する', '💡', 100),
  ('Gruß von Noah im nächsten Video', 'Shout-out in Noah''s next video', '次の動画でノアからあいさつ', '🎬', 60)
) as v(title, title_en, title_ja, emoji, cost)
where not exists (select 1 from public.rewards);

-- ════════════════ funkraum.sql ════════════════
-- TPWE-Funkraum: Anfragen für Privat-Gespräche mit Noah
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
