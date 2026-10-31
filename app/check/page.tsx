"use client";

// Prüfseite für Eltern: Zeigt, ob Supabase richtig eingerichtet ist (keine geheimen Daten).
import { useCallback, useEffect, useState } from "react";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Result = { label: string; ok: boolean | null; detail: string; fix?: string };

async function get(path: string) {
  const res = await fetch(`${URL_}${path}`, { headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

/** Gibt es die Tabelle? 404/PGRST205 = fehlt, alles andere (auch "keine Berechtigung") = vorhanden */
async function tableExists(table: string) {
  const { status, body } = await get(`/rest/v1/${table}?select=*&limit=0`);
  const missing = status === 404 || body?.code === "PGRST205" || body?.code === "42P01";
  return !missing;
}

export default function CheckPage() {
  const [results, setResults] = useState<Result[] | null>(null);
  const [signupTest, setSignupTest] = useState<string | null>(null);

  const run = useCallback(async () => {
    setResults(null);
    const out: Result[] = [];
    if (!URL_ || !KEY) {
      setResults([{ label: "App mit Supabase verbunden", ok: false, detail: "Demo-Modus", fix: "In Vercel NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY eintragen → Redeploy." }]);
      return;
    }
    try {
      const health = await get("/auth/v1/health");
      out.push({ label: "Supabase erreichbar", ok: health.status === 200, detail: `Antwort ${health.status}`, fix: "Im Supabase-Dashboard prüfen, ob das Projekt pausiert ist → „Restore project“." });
    } catch {
      out.push({ label: "Supabase erreichbar", ok: false, detail: "keine Verbindung", fix: "Projekt pausiert oder falsche NEXT_PUBLIC_SUPABASE_URL in Vercel." });
      setResults(out);
      return;
    }
    try {
      const { body } = await get("/auth/v1/settings");
      out.push({
        label: "Registrieren erlaubt",
        ok: body.disable_signup === false,
        detail: body.disable_signup ? "AUS" : "an",
        fix: "Supabase → Authentication → Sign In / Providers → „Allow new users to sign up“ einschalten → Save.",
      });
      out.push({
        label: "E-Mail-Bestätigung aus (empfohlen)",
        ok: body.mailer_autoconfirm === true,
        detail: body.mailer_autoconfirm ? "aus – Konten sind sofort fertig" : "AN – Supabase schickt nur an Team-Mitglieder (max. 2 Mails/Std.)",
        fix: "Supabase → Authentication → Sign In / Providers → Email → „Confirm email“ ausschalten → Save.",
      });
    } catch {
      out.push({ label: "Anmelde-Einstellungen lesbar", ok: false, detail: "nicht lesbar" });
    }
    const tables: [string, string, string][] = [
      ["products", "schema.sql", "Grundlage (Shop, Videos)"],
      ["profiles", "deluxe.sql", "Erfinder-Ausweis & DELUXE"],
      ["game_results", "extras.sql", "Bestenliste, Taler, Pinnwand, Professor"],
      ["call_requests", "funkraum.sql", "Funkraum"],
    ];
    for (const [table, file, what] of tables) {
      const exists = await tableExists(table).catch(() => false);
      out.push({ label: `${what} (${file})`, ok: exists, detail: exists ? "eingerichtet" : "fehlt", fix: `Supabase → SQL Editor → Inhalt von supabase/${file} einfügen → Run.` });
    }
    setResults(out);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  /** Echte Test-Registrierung mit Zufallsadresse – zeigt die genaue Antwort von Supabase. */
  const testSignup = async () => {
    setSignupTest("…");
    const email = `tpwe-test-${Date.now()}@example.com`;
    try {
      const res = await fetch(`${URL_}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: KEY!, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: `Test-${Math.random().toString(36).slice(2)}-42`, data: { display_name: "Test" } }),
      });
      const body = await res.json().catch(() => ({}));
      setSignupTest(
        res.ok
          ? `✅ Klappt! (Test-Konto ${email} wurde angelegt – kann in Supabase unter Authentication → Users gelöscht werden.)`
          : `❌ Supabase sagt (${res.status}): ${body.msg || body.error_description || body.message || body.error || JSON.stringify(body)}`,
      );
    } catch (e) {
      setSignupTest(`❌ Keine Verbindung: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="card form" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>🩺 Einrichtungs-Prüfung</h1>
      <p className="muted" style={{ margin: 0 }}>Für Eltern: zeigt, ob Supabase für die App richtig eingestellt ist.</p>
      {!results && <p>Prüfe …</p>}
      <div className="list">
        {results?.map((r) => (
          <div key={r.label} className="card" style={{ padding: 12, borderColor: r.ok ? "var(--good)" : "var(--bad)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>
                {r.ok ? "✅" : "❌"} {r.label}
              </strong>
              <span className="muted">{r.detail}</span>
            </div>
            {!r.ok && r.fix && <p style={{ margin: "6px 0 0" }}>👉 {r.fix}</p>}
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn secondary" onClick={run}>
          🔄 Nochmal prüfen
        </button>
        {URL_ && (
          <button className="btn" onClick={testSignup}>
            🧪 Test-Registrierung
          </button>
        )}
      </div>
      {signupTest && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{signupTest}</p>}
    </div>
  );
}
