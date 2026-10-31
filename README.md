# TPWE – Noahs Erfinder-Welt ⚙️

**T**echnik · **P**hysik · **W**issenschaft · **E**rfindungen. Die App von Noah, für Noah.

## Was die App kann

| Bereich | Inhalt |
|---|---|
| 🏠 Start | Kacheln zu allen Bereichen |
| 🎮 Spielen | Quiz, Rätsel, Mini-Simulationen (Planeten-Sprung, Wippe, Stromkreis) |
| 🛒 Shop | Noahs Erfindungen ansehen, mit Sternen bewerten, bestellen, kommentieren |
| 🎬 Videos | Videos nach Themen (hochgeladen oder als YouTube-Link) mit Kommentaren |
| 💎 DELUXE | Einmalig 10,50 € per Karte (Stripe). Jede Zahlung wird in der Datenbank gespeichert |
| 🪪 Erfinder-Ausweis | Eigenes Konto mit Avatar, Rang, Abzeichen; Raketen-Sterne und Quiz-Bestwert werden gespeichert |
| 🏆 Bestenliste & Challenge | DELUXE: Ranglisten (Woche/aller Zeiten), Noah legt Wochen-Challenges mit Preis an |
| 🤖 Professor Zahnrad | DELUXE: kindgerechter KI-Erfinder-Lehrer (Claude), 20 Fragen pro Tag, alle Fragen sieht Noah im Admin |
| 🪙 TPWE-Taler | DELUXE: 1 Taler pro Stern/Quiz-Punkt, im Taler-Shop gegen Noahs Belohnungen tauschen |
| 📌 Erfinder-Pinnwand | DELUXE: Ideen teilen – jeder Beitrag erscheint erst nach Noahs Freigabe |
| 📡 Funkraum | DELUXE: Video-Treffen jeden Samstag 13:00–13:30 (Wiener Zeit), Noah ist Chef und kann stummschalten/entfernen |
| 📞 Privat-Gespräch | DELUXE: nur auf Anfrage – Noah bestätigt und legt die Uhrzeit fest, ein Erwachsener muss dabei sein |
| 🔧 Admin | Erfindungen und Videos anlegen, Bestellungen bearbeiten, Kommentare freigeben, Mitglieder verwalten |

**Frei vs. DELUXE:** Spielen, Shop (ansehen, bestellen, bewerten, kommentieren) und Videos sind für alle frei.
Nur der DELUXE-Bereich (Funkraum, Professor Zahnrad, Bestenliste, Taler, Pinnwand) ist ohne Bezahlung (einmalig 10,50 €) gesperrt –
in der App *und* in der Datenbank. Noah (Admin) kommt immer überall rein.

Dazu: Hell/Dunkel-Modus, Sprachen Deutsch/Englisch/Japanisch, läuft auf Handy, Tablet und PC.
Kommentare von anderen erscheinen erst, wenn Noah sie im Admin-Bereich freigibt.

## So ist der Admin-Bereich geschützt 🔒

| Schutz | Wie |
|---|---|
| Verschlüsselte Verbindung | Vercel liefert die App nur über HTTPS aus, zusätzlich mit HSTS-Header |
| Passwort | Anmeldung über Supabase. Passwörter werden dort nur verschlüsselt (bcrypt-Hash) gespeichert |
| Rechte auf dem Server | Ob jemand ändern darf, prüft die **Datenbank selbst** (Row Level Security + Admin-Liste), nicht nur die App |
| Kein Registrieren | Neue Konten sind abgeschaltet, nur das Admin-Konto existiert |
| Versteckt | Der Admin-Knopf oben erscheint erst nach dem Anmelden (Zugang über 🔒 unten), keine Suchmaschinen |
| Zu viele Versuche | Nach 5 falschen Passwörtern 1 Minute Pause (Supabase begrenzt zusätzlich) |
| Auto-Abmelden | Nach 30 Minuten ohne Aktivität |

Tipp: ein langes Passwort aus mehreren Wörtern wählen, z. B. `Rakete-Mond-Hebel-42`.

## Zwei Modi

- **Demo-Modus** (ohne Supabase): Alles wird nur im eigenen Browser gespeichert. Admin-Passwort: `tpwe` (nur zum Ausprobieren, schützt nichts Echtes).
- **Online-Modus** (mit Supabase): Erfindungen, Videos, Bestellungen, Bewertungen und Kommentare sind für alle auf jedem Gerät sichtbar.

## Einrichten (einmalig)

### 1. Supabase (Datenbank + Speicher für Bilder/Videos), kostenlos
1. Auf <https://supabase.com> ein Konto und ein neues Projekt anlegen (Region: Frankfurt).
2. **SQL Editor** → `supabase/schema.sql` aus diesem Repo einfügen. **Ganz unten die eigene E-Mail eintragen** → *Run*.
3. **Authentication → Users → Add user**: dieselbe E-Mail + ein Passwort anlegen (*Auto Confirm* anhaken). Damit meldet sich Noah im Admin-Bereich an.
4. **Authentication → Sign In / Providers**: *Allow new users to sign up* ausschalten.
5. **Project Settings → API**: *Project URL* und *anon public key* kopieren.

### 2. Vercel
1. Auf <https://vercel.com> → *Add New → Project* → dieses GitHub-Repo `noah` importieren.
2. Unter *Environment Variables* eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
3. *Deploy*. Fertig! Jede Änderung auf `main` geht automatisch live.

### 3. DELUXE einrichten (Konten + Bezahlung)
**Supabase**
1. **SQL Editor** → `supabase/deluxe.sql` einfügen → *Run*.
2. **Authentication → Sign In / Providers**: *Allow new users to sign up* wieder **einschalten**.
   (Sicher: Admin-Rechte gibt es weiterhin nur für E-Mails in der Admin-Liste.)
3. Dort auch **Confirm email**: Der eingebaute Mail-Versand von Supabase schafft nur ganz wenige Mails pro Stunde.
   Für den Anfang *Confirm email* ausschalten – oder später einen eigenen Mail-Dienst (SMTP, z. B. Resend) eintragen.
4. **Authentication → URL Configuration**: *Site URL* = eure Vercel-Adresse (z. B. `https://tpwe.vercel.app`).
5. **Project Settings → API Keys**: den **secret / service_role** Key kopieren.

**Stripe** (Konto auf den Namen eines Erwachsenen, zuerst im **Testmodus**)
1. **Developers → API keys**: *Secret key* (`sk_test_…`) kopieren.
2. **Developers → Webhooks → Add endpoint**: `https://EURE-ADRESSE/api/stripe-webhook`,
   Ereignisse `checkout.session.completed` und `checkout.session.async_payment_succeeded`.
   Danach das *Signing secret* (`whsec_…`) kopieren.

**Vercel → Settings → Environment Variables** (danach *Redeploy*!)
| Key | Wert |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | secret / service_role Key aus Supabase |
| `STRIPE_SECRET_KEY` | `sk_test_…` (später `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |

⚠️ Diese drei Schlüssel sind geheim: nur bei Vercel eintragen, nie mit `NEXT_PUBLIC_` beginnen lassen, nie weitergeben.

**Testen**: Konto anlegen → DELUXE → mit Testkarte `4242 4242 4242 4242`, beliebiges Datum in der Zukunft, beliebige Prüfziffer.
**Echt verkaufen**: Stripe-Konto aktivieren, auf *Live* umschalten, Live-Key + neuen Live-Webhook eintragen, Redeploy.
Vorher die Platzhalter auf `/rechtliches` (Impressum, AGB, Widerruf, Datenschutz) ausfüllen.

### 4. DELUXE-Extras und Bezahlpflicht einrichten
1. **Supabase → SQL Editor**: `supabase/extras.sql` einfügen → *Run*.
   Falls ihr früher `paywall.sql` ausgeführt habt: `supabase/normal-frei.sql` ausführen (macht Shop & Videos wieder für alle frei).
2. **Professor Zahnrad**: auf <https://platform.claude.com> ein Konto anlegen, Guthaben aufladen
   (z. B. 5 $ reichen für sehr viele Kinderfragen), unter *API Keys* einen Schlüssel erstellen.
   In **Vercel** als `ANTHROPIC_API_KEY` eintragen → *Redeploy*. Am besten dort auch ein monatliches Ausgabenlimit setzen.

Alle Sicherheitsregeln (wer was lesen/ändern darf) sind in den SQL-Dateien festgelegt und wurden
gegen eine echte PostgreSQL-Datenbank getestet.

### 5. Funkraum (Video-Calls) einrichten
1. **Supabase → SQL Editor**: `supabase/funkraum.sql` einfügen → *Run*.
2. Auf <https://dashboard.daily.co> ein kostenloses Konto anlegen (Gratis-Tarif: 10.000 Teilnehmer-Minuten/Monat).
3. **Developers → API key** kopieren und in **Vercel** als `DAILY_API_KEY` eintragen → *Redeploy*.

**Schutzregeln im Funkraum**
- Nur zahlende DELUXE-Mitglieder, nur Samstag 13:00–13:30 (Noah darf 15 Min. früher hinein), um 13:30 werden alle automatisch getrennt.
- Jeder bekommt einen persönlichen Schlüssel nur für diesen Raum und diese Zeit; der Name kommt vom Erfinder-Ausweis.
- Noah ist „Owner“: kann stummschalten und Leute entfernen. Gesperrte Konten kommen nicht mehr hinein.
- Kein Text-Chat und keine Bildschirmfreigabe; vor dem Betreten müssen die Regeln bestätigt werden.
- Privat-Gespräche: keine direkten Anrufe – nur Anfragen (max. 2 offen), die Noah bestätigt und terminiert.
  Beide Seiten bestätigen, dass ein Erwachsener dabei ist. Raum offen 10 Min. vor bis 30 Min. nach dem Termin, max. 3 Teilnehmer.
- Zeiten ändern: `lib/funkraum.ts` (`RADIO_SCHEDULE`).

### Auf dem Handy wie eine App
Seite öffnen → Teilen → **Zum Home-Bildschirm**.

## Lokal entwickeln
```bash
npm install
cp .env.example .env.local   # optional: Supabase-Werte eintragen
npm run dev                  # http://localhost:3000
```

## Ausbauen
- Neue Quizfragen & Rätsel: `lib/content.ts`
- Texte & Übersetzungen: `lib/i18n.tsx`
- Neue Simulation: neuen Ordner in `app/spielen/` anlegen und eine Kachel in `app/spielen/page.tsx` ergänzen
- Datenbank-Zugriff: `lib/data/` (Demo: `local.ts`, Online: `supabase.ts`)
