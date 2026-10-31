-- TPWE Bezahlpflicht: Ohne DELUXE (10,50 €) gibt es keine Daten.
-- In Supabase: SQL Editor → New query → alles einfügen → Run.
-- (Läuft nach schema.sql und deluxe.sql. Kann gefahrlos mehrmals ausgeführt werden.)

-- Damit die Regeln auch für nicht angemeldete Besucher sauber "nein" sagen
grant execute on function public.is_member() to anon;

-- Erfindungen & Videos: nur für Mitglieder (Noah sieht immer alles)
drop policy if exists "products read" on public.products;
create policy "products read" on public.products for select using ((published and public.is_member()) or public.is_admin());

drop policy if exists "videos read" on public.videos;
create policy "videos read" on public.videos for select using ((published and public.is_member()) or public.is_admin());

-- Bewertungen: lesen und abgeben nur als Mitglied
drop policy if exists "ratings read" on public.ratings;
drop policy if exists "ratings add" on public.ratings;
create policy "ratings read" on public.ratings for select using (public.is_member() or public.is_admin());
create policy "ratings add" on public.ratings for insert with check (stars between 1 and 5 and public.is_member());

-- Kommentare: lesen und schreiben nur als Mitglied, sichtbar erst nach Noahs Freigabe
drop policy if exists "comments read" on public.comments;
drop policy if exists "comments add" on public.comments;
create policy "comments read" on public.comments for select using ((approved and public.is_member()) or public.is_admin());
create policy "comments add" on public.comments for insert with check (approved = false and public.is_member());

-- Bestellen nur als Mitglied
drop policy if exists "orders add" on public.orders;
create policy "orders add" on public.orders for insert with check (status = 'neu' and public.is_member());
