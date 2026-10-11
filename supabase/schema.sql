-- TPWE-App: Datenbank einrichten
-- In Supabase: SQL Editor → New query → alles hier einfügen → Run.
-- Ganz unten die eigene Admin-E-Mail eintragen!

create extension if not exists pgcrypto;

-- Wer darf in den Admin-Bereich?
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- (keine Policies: niemand kann die Tabelle über die App lesen oder ändern)

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- Erfindungen (Produkte)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  name_en text,
  name_ja text,
  description text not null default '',
  description_en text,
  description_ja text,
  price numeric(10,2) not null default 0,
  emoji text,
  image_url text,
  published boolean not null default true
);

-- Videos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  title_en text,
  title_ja text,
  description text,
  topic text,
  video_url text,
  youtube_url text,
  published boolean not null default true
);

-- Sterne-Bewertungen
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid not null references public.products(id) on delete cascade,
  stars int not null check (stars between 1 and 5)
);

-- Kommentare (erst sichtbar, wenn der Admin sie freigibt)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid references public.products(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  text text not null check (char_length(text) between 1 and 500),
  approved boolean not null default false
);

-- Bestellungen
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity between 1 and 99),
  customer_name text not null check (char_length(customer_name) between 1 and 60),
  contact text not null check (char_length(contact) between 1 and 120),
  message text check (char_length(message) <= 500),
  status text not null default 'neu' check (status in ('neu', 'in_arbeit', 'erledigt'))
);

alter table public.products enable row level security;
alter table public.videos   enable row level security;
alter table public.ratings  enable row level security;
alter table public.comments enable row level security;
alter table public.orders   enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products, public.videos, public.ratings, public.comments, public.orders to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Produkte & Videos: alle sehen die veröffentlichten, nur Admin ändert
create policy "products read"  on public.products for select using (published or public.is_admin());
create policy "products admin" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "videos read"    on public.videos   for select using (published or public.is_admin());
create policy "videos admin"   on public.videos   for all using (public.is_admin()) with check (public.is_admin());

-- Bewertungen: alle dürfen lesen und bewerten
create policy "ratings read"   on public.ratings for select using (true);
create policy "ratings add"    on public.ratings for insert with check (stars between 1 and 5);
create policy "ratings admin"  on public.ratings for delete using (public.is_admin());

-- Kommentare: alle schreiben, sichtbar erst nach Freigabe
create policy "comments read"   on public.comments for select using (approved or public.is_admin());
create policy "comments add"    on public.comments for insert with check (approved = false);
create policy "comments update" on public.comments for update using (public.is_admin()) with check (public.is_admin());
create policy "comments delete" on public.comments for delete using (public.is_admin());

-- Bestellungen: alle bestellen, nur Admin sieht sie
create policy "orders add"    on public.orders for insert with check (status = 'neu');
create policy "orders read"   on public.orders for select using (public.is_admin());
create policy "orders update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "orders delete" on public.orders for delete using (public.is_admin());

-- Speicher für Bilder & Videos
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media read"   on storage.objects for select using (bucket_id = 'media');
create policy "media upload" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "media update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "media delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ⬇️ HIER die E-Mail des Admin-Kontos eintragen (dasselbe Konto wie unter Authentication → Users)
insert into public.admins (email) values ('DEINE-EMAIL@beispiel.de')
on conflict do nothing;
