# Noah

Noah's Entwicklungs- und Testumgebung

## Noahs Spiele-Werkstatt

Eine kleine Web-App, mit der man sich eigene Mini-Spiele (Level) selbst bauen und direkt spielen kann.

- **Bauen:** Rasterfeld auswählen (klein/mittel/groß) und mit dem Pinsel Wände 🧱, Start 🚩, Ziel 🏁, Münzen 🪙 und Gegner 👾 platzieren.
- **Spielen:** Mit den Pfeiltasten/WASD oder den Bildschirm-Pfeilen zum Ziel laufen, Münzen einsammeln und Gegnern ausweichen.
- Gespeicherte Spiele bleiben lokal im Browser erhalten (`localStorage`) und können jederzeit bearbeitet, erneut gespielt oder gelöscht werden.

### Starten

Kein Build nötig — einfach `index.html` in einem Browser öffnen, oder lokal einen Server starten:

```bash
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen.
