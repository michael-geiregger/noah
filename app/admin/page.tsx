"use client";

import { useEffect, useRef, useState } from "react";
import { notifyAdminChanged } from "@/lib/adminEvents";
import { getApi } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { AdminProducts } from "./AdminProducts";
import { AdminVideos } from "./AdminVideos";
import { AdminOrders } from "./AdminOrders";
import { AdminComments } from "./AdminComments";

type Tab = "products" | "videos" | "orders" | "comments";

export default function AdminPage() {
  const { t } = useI18n();
  const api = getApi();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    api.isAdmin().then(setAdmin).catch(() => setAdmin(false));
  }, [api]);

  useAutoLogout(!!admin, async () => {
    await api.logout();
    notifyAdminChanged();
    setTimedOut(true);
    setAdmin(false);
  });

  if (admin === null) return <p>{t("loading")}</p>;
  if (!admin)
    return (
      <>
        {timedOut && <p className="card muted" style={{ maxWidth: 420, margin: "20px auto 0" }}>⏰ {t("adminAutoLogout")}</p>}
        <Login
          onDone={() => {
            setTimedOut(false);
            notifyAdminChanged();
            setAdmin(true);
          }}
        />
      </>
    );

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: `💡 ${t("tabProducts")}` },
    { key: "videos", label: `🎬 ${t("tabVideos")}` },
    { key: "orders", label: `📦 ${t("tabOrders")}` },
    { key: "comments", label: `💬 ${t("tabComments")}` },
  ];

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>🔧 {t("adminTitle")}</h1>
        <div className="row">
          <span className="pill">{api.mode === "demo" ? `🧪 ${t("modeDemo")}` : `🌐 ${t("modeOnline")}`}</span>
          <button
            className="btn secondary small"
            onClick={async () => {
              await api.logout();
              notifyAdminChanged();
              setAdmin(false);
            }}
          >
            {t("adminLogout")}
          </button>
        </div>
      </div>
      {api.mode === "demo" && <p className="muted">{t("adminDemoHint")}</p>}
      <div className="tabs">
        {tabs.map((tb) => (
          <button key={tb.key} className={tab === tb.key ? "on" : ""} onClick={() => setTab(tb.key)}>
            {tb.label}
          </button>
        ))}
      </div>
      {tab === "products" && <AdminProducts />}
      {tab === "videos" && <AdminVideos />}
      {tab === "orders" && <AdminOrders />}
      {tab === "comments" && <AdminComments />}
    </>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const api = getApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const fails = useRef(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockedUntil) return;
    setBusy(true);
    setError(false);
    try {
      await api.login(email, password);
      if (await api.isAdmin()) onDone();
      else {
        await api.logout();
        setError(true);
      }
    } catch {
      setError(true);
      // Nach 5 Fehlversuchen eine Minute Pause
      fails.current += 1;
      if (fails.current >= 5) {
        fails.current = 0;
        setLockedUntil(Date.now() + 60_000);
        setTimeout(() => setLockedUntil(0), 60_000);
      }
    } finally {
      setBusy(false);
    }
  };
  const locked = lockedUntil > 0;

  return (
    <div className="card" style={{ maxWidth: 420, margin: "20px auto" }}>
      <form className="form" onSubmit={submit}>
        <h1>🔐 {t("adminTitle")}</h1>
        <p className="muted" style={{ margin: 0 }}>{t("adminSecure")}</p>
        {api.mode === "demo" ? null : (
          <label className="field">
            {t("adminEmail")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
        )}
        <label className="field">
          {t("adminPassword")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && !locked && <p className="err">{t("adminWrong")}</p>}
        {locked && <p className="err">{t("adminTooMany")}</p>}
        <button className="btn" disabled={busy || locked}>
          {t("adminLogin")}
        </button>
      </form>
    </div>
  );
}

const IDLE_MS = 30 * 60 * 1000;

/** Meldet nach 30 Minuten ohne Klicken/Tippen automatisch ab. */
function useAutoLogout(active: boolean, onTimeout: () => void) {
  const cb = useRef(onTimeout);
  cb.current = onTimeout;
  useEffect(() => {
    if (!active) return;
    let timer = setTimeout(() => cb.current(), IDLE_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cb.current(), IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [active]);
}
