# Noah

Noah's Entwicklungs- und Testumgebung

## Noahs Spiele-Werkstatt

Eine kleine Web-App, mit der man sich eigene Mini-Spiele selbst bauen und direkt spielen kann. Beim Erstellen wählt man zwischen fünf Spielarten:

- **🌀 Irrgarten:** Rasterfeld bepinseln mit Wänden 🧱, Start 🚩, Ziel 🏁, Münzen 🪙 und Gegnern 👾, dann durchspielen.
- **❓ Quiz:** eigene Fragen mit mehreren Antwortmöglichkeiten erstellen und beantworten.
- **🧠 Memory:** Symbole auswählen, daraus werden Kartenpaare zum Umdrehen/Finden.
- **🏃 Hüpf-Spiel:** Figur, Hindernis und Tempo wählen, per Sprung ausweichen.
- **🧩 Eigenes Spiel (Block-Editor):** wie MakeCode/Scratch — eigene Pixel-Figuren zeichnen, auf einer Bühne platzieren und mit Bausteinen (Ereignisse wie „Beim Start“/„Bei Tastendruck“/„Bei Berührung“ + Aktionen wie Bewegen, Punkte zählen, Text zeigen, Spiel beenden) ein eigenes Spiel programmieren.

Die Tastensteuerung für Irrgarten und Hüpf-Spiel lässt sich unter „⌨️ Tasten einstellen“ frei belegen. Gespeicherte Spiele bleiben lokal im Browser erhalten (`localStorage`) und können jederzeit bearbeitet, erneut gespielt oder gelöscht werden.

### Starten

Kein Build nötig — einfach `index.html` in einem Browser öffnen, oder lokal einen Server starten:

```bash
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen.
