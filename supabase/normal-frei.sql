-- TPWE: Normaler Bereich (Shop, Videos, Kommentare, Bewertungen, Bestellen) wieder für ALLE frei.
-- Nur nötig, wenn ihr vorher paywall.sql ausgeführt habt. Schadet aber nie – kann jederzeit laufen.
-- DELUXE (Bestenliste, Professor, Taler, Pinnwand, Funkraum) bleibt weiterhin nur für Mitglieder.
-- In Supabase: SQL Editor → New query → alles einfügen → Run.

drop policy if exists "products read" on public.products;
create policy "products read" on public.products for select using (published or public.is_admin());

drop policy if exists "videos read" on public.videos;
create policy "videos read" on public.videos for select using (published or public.is_admin());

drop policy if exists "ratings read" on public.ratings;
drop policy if exists "ratings add" on public.ratings;
create policy "ratings read" on public.ratings for select using (true);
create policy "ratings add" on public.ratings for insert with check (stars between 1 and 5);

drop policy if exists "comments read" on public.comments;
drop policy if exists "comments add" on public.comments;
create policy "comments read" on public.comments for select using (approved or public.is_admin());
create policy "comments add" on public.comments for insert with check (approved = false);

drop policy if exists "orders add" on public.orders;
create policy "orders add" on public.orders for insert with check (status = 'neu');
