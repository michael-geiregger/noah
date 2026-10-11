"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    api.isAdmin().then(setAdmin).catch(() => setAdmin(false));
  }, [api]);

  if (admin === null) return <p>{t("loading")}</p>;
  if (!admin) return <Login onDone={() => setAdmin(true)} />;

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "20px auto" }}>
      <form className="form" onSubmit={submit}>
        <h1>🔐 {t("adminTitle")}</h1>
        {api.mode === "demo" ? (
          <p className="muted">{t("adminDemoHint")}</p>
        ) : (
          <label className="field">
            {t("adminEmail")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
        )}
        <label className="field">
          {t("adminPassword")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="err">{t("adminWrong")}</p>}
        <button className="btn" disabled={busy}>
          {t("adminLogin")}
        </button>
      </form>
    </div>
  );
}
