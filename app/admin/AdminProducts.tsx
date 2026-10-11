"use client";

import { useState } from "react";
import { ProductMedia } from "@/components/ProductMedia";
import { getApi, type Product } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { formatPrice, useData } from "@/lib/useData";
import { uploadErrorKey } from "./upload";

const EMPTY: Partial<Product> = { name: "", description: "", price: 0, emoji: "💡", published: true };

export function AdminProducts() {
  const { t, lang } = useI18n();
  const api = getApi();
  const { data, reload } = useData(() => api.listProducts(true));
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  if (editing)
    return (
      <ProductEditor
        initial={editing}
        onClose={() => {
          setEditing(null);
          reload();
        }}
      />
    );

  return (
    <div className="form">
      <div>
        <button className="btn yellow" onClick={() => setEditing({ ...EMPTY })}>
          ➕ {t("newProduct")}
        </button>
      </div>
      <div className="list">
        {data?.map((p) => (
          <div key={p.id} className="card list-item">
            <ProductMedia p={p} className="thumb" />
            <div className="grow">
              <strong>{p.name}</strong> {!p.published && <span className="pill">🙈 {t("hidden")}</span>}
              <div className="muted">{formatPrice(Number(p.price), lang)}</div>
            </div>
            <button className="btn small" onClick={() => setEditing(p)}>
              ✏️ {t("edit")}
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                if (!confirm(t("confirmDelete"))) return;
                await api.deleteProduct(p.id);
                reload();
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({ initial, onClose }: { initial: Partial<Product>; onClose: () => void }) {
  const { t } = useI18n();
  const api = getApi();
  const [p, setP] = useState<Partial<Product>>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((old) => ({ ...old, [k]: v }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(t("uploading"));
    try {
      set("image_url", await api.uploadFile(file, "images"));
      setMsg(null);
    } catch (e) {
      setMsg(t(uploadErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.saveProduct({ ...p, price: Number(p.price) || 0 });
      onClose();
    } catch (err) {
      setMsg(`${t("errorGeneric")} ${err instanceof Error ? err.message : ""}`);
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={save}>
      <h2>{p.id ? `✏️ ${t("edit")}` : `➕ ${t("newProduct")}`}</h2>
      <label className="field">
        {t("fName")}
        <input value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
      </label>
      <label className="field">
        {t("fDesc")}
        <textarea value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={4} />
      </label>
      <div className="row">
        <label className="field" style={{ flex: 1 }}>
          {t("fPrice")}
          <input type="number" min={0} step="0.5" value={p.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} />
        </label>
        <label className="field" style={{ flex: 1 }}>
          {t("fEmoji")}
          <input value={p.emoji ?? ""} onChange={(e) => set("emoji", e.target.value)} maxLength={8} />
        </label>
      </div>
      <label className="field">
        {t("fImage")}
        <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      {p.image_url && (
        <div className="row">
          <img src={p.image_url} alt="" style={{ width: 120, borderRadius: 12 }} />
          <button type="button" className="btn small secondary" onClick={() => set("image_url", null)}>
            🗑️
          </button>
        </div>
      )}
      <label className="row" style={{ fontWeight: 700 }}>
        <input type="checkbox" checked={!!p.published} onChange={(e) => set("published", e.target.checked)} />
        {t("fPublished")}
      </label>
      <details className="translations">
        <summary>🌍 {t("fTranslations")}</summary>
        <label className="field">
          {t("fName")} (English)
          <input value={p.name_en ?? ""} onChange={(e) => set("name_en", e.target.value)} />
        </label>
        <label className="field">
          {t("fDesc")} (English)
          <textarea value={p.description_en ?? ""} onChange={(e) => set("description_en", e.target.value)} rows={3} />
        </label>
        <label className="field">
          {t("fName")} (日本語)
          <input value={p.name_ja ?? ""} onChange={(e) => set("name_ja", e.target.value)} />
        </label>
        <label className="field">
          {t("fDesc")} (日本語)
          <textarea value={p.description_ja ?? ""} onChange={(e) => set("description_ja", e.target.value)} rows={3} />
        </label>
      </details>
      {msg && <p className="muted">{msg}</p>}
      <div className="row">
        <button className="btn" disabled={busy}>
          💾 {t("save")}
        </button>
        <button type="button" className="btn secondary" onClick={onClose}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
