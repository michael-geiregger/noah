# TPWE – Noahs Erfinder-Welt ⚙️

**T**echnik · **P**hysik · **W**issenschaft · **E**rfindungen. Die App von Noah, für Noah.

## Was die App kann

| Bereich | Inhalt |
|---|---|
| 🏠 Start | Kacheln zu allen Bereichen |
| 🎮 Spielen | Quiz, Rätsel, Mini-Simulationen (Planeten-Sprung, Wippe, Stromkreis) |
| 🛒 Shop | Noahs Erfindungen ansehen, mit Sternen bewerten, bestellen, kommentieren |
| 🎬 Videos | Videos nach Themen (hochgeladen oder als YouTube-Link) mit Kommentaren |
| 🔧 Admin | Erfindungen und Videos anlegen, Bestellungen bearbeiten, Kommentare freigeben |

Dazu: Hell/Dunkel-Modus, Sprachen Deutsch/Englisch/Japanisch, läuft auf Handy, Tablet und PC.
Kommentare von anderen erscheinen erst, wenn Noah sie im Admin-Bereich freigibt.

## Zwei Modi

- **Demo-Modus** (ohne Supabase): Alles wird nur im eigenen Browser gespeichert. Admin-Passwort: `tpwe`.
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
