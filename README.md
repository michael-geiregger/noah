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
| 🔧 Admin | Erfindungen und Videos anlegen, Bestellungen bearbeiten, Kommentare freigeben, Mitglieder verwalten |

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
