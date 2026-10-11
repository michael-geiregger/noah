"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { Comments } from "@/components/Comments";
import { ProductMedia } from "@/components/ProductMedia";
import { Stars } from "@/components/Stars";
import { getApi } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { averageStars, formatPrice, useData } from "@/lib/useData";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { t, pick, lang } = useI18n();
  const api = getApi();
  const { data, loading, reload } = useData(async () => {
    const [product, ratings] = await Promise.all([api.getProduct(id), api.listRatings()]);
    return { product, ratings };
  }, [id]);

  if (loading && !data) return <p>{t("loading")}</p>;
  const p = data?.product;
  if (!p)
    return (
      <>
        <BackLink href="/shop" />
        <p>{t("notFound")}</p>
      </>
    );

  const r = averageStars(data.ratings, p.id);

  return (
    <>
      <BackLink href="/shop" />
      <div className="grid-lg" style={{ alignItems: "start" }}>
        <div className="card">
          <ProductMedia p={p} />
          <h1>{pick(p, "name")}</h1>
          <Stars avg={r.avg} count={r.count} />
          <p className="price" style={{ fontSize: "1.6rem", margin: "10px 0" }}>{formatPrice(Number(p.price), lang)}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{pick(p, "description")}</p>
          <RateBox productId={p.id} onRated={reload} />
        </div>
        <div className="card">
          <OrderForm productId={p.id} productName={p.name} />
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <Comments target={{ product_id: p.id }} />
      </div>
    </>
  );
}

function RateBox({ productId, onRated }: { productId: string; onRated: () => void }) {
  const { t } = useI18n();
  const storageKey = `tpwe-rated-${productId}`;
  const [rated, setRated] = useState<number | null>(null);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v) setRated(Number(v));
    } catch {}
  }, [storageKey]);

  const rate = async (stars: number) => {
    if (rated) return;
    await getApi().addRating(productId, stars);
    setRated(stars);
    try {
      localStorage.setItem(storageKey, String(stars));
    } catch {}
    onRated();
  };

  return (
    <div style={{ marginTop: 14 }}>
      <strong>{t("rateIt")}</strong>
      <div onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            className="star-btn"
            onMouseEnter={() => setHover(s)}
            onClick={() => rate(s)}
            disabled={!!rated}
            aria-label={`${s}`}
            style={{ color: s <= (hover || rated || 0) ? "#f5a524" : "var(--border)" }}
          >
            ★
          </button>
        ))}
      </div>
      {rated && <p className="ok">{t("rateThanks")}</p>}
    </div>
  );
}

function OrderForm({ productId, productName }: { productId: string; productName: string }) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      await getApi().addOrder({
        product_id: productId,
        product_name: productName,
        quantity,
        customer_name: name.trim(),
        contact: contact.trim(),
        message: message.trim() || null,
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent")
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem" }}>📦</div>
        <p className="ok">{t("orderThanks")}</p>
      </div>
    );

  return (
    <form className="form" onSubmit={send}>
      <h2>📦 {t("orderTitle")}</h2>
      <label className="field">
        {t("orderQty")}
        <input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
      </label>
      <label className="field">
        {t("orderName")}
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </label>
      <label className="field">
        {t("orderContact")}
        <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} required />
      </label>
      <label className="field">
        {t("orderMsg")}
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={2} />
      </label>
      <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t("orderNote")}</p>
      <div className="row">
        <button className="btn yellow" disabled={state === "sending"}>
          🚀 {t("orderSend")}
        </button>
        {state === "error" && <span className="err">{t("errorGeneric")}</span>}
      </div>
    </form>
  );
}
